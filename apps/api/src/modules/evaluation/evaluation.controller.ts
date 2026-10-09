import { Router, Request, Response } from 'express';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middlewares/auth';
import { QuestionType } from '@prisma/client';

const router = Router();

// Helper to interpret Likert scale
export function interpretLikertScale(mean: number): string {
  if (mean >= 4.50) return 'มากที่สุด';
  if (mean >= 3.50) return 'มาก';
  if (mean >= 2.50) return 'ปานกลาง';
  if (mean >= 1.50) return 'น้อย';
  return 'น้อยที่สุด';
}

// Calculate Mean and SD
export function calculateStatistics(scores: number[]): { count: number; mean: number; sd: number; level: string } {
  const count = scores.length;
  if (count === 0) {
    return { count: 0, mean: 0, sd: 0, level: '-' };
  }

  const sum = scores.reduce((acc, val) => acc + val, 0);
  const mean = Math.round((sum / count) * 100) / 100;

  if (count === 1) {
    return { count, mean, sd: 0, level: interpretLikertScale(mean) };
  }

  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1);
  const sd = Math.round(Math.sqrt(variance) * 100) / 100;

  return {
    count,
    mean,
    sd,
    level: interpretLikertScale(mean),
  };
}

// Helper to generate running certificate number
async function generateNextCertificateNumber(eventId: bigint, prefix?: string): Promise<string> {
  const currentYear = new Date().getFullYear() + 543;
  const basePrefix = prefix && prefix.trim() ? prefix.trim() : `CERT-${currentYear}-${eventId}`;

  const count = await prisma.attendee.count({
    where: {
      event_id: eventId,
      certificate_no: { not: null },
    },
  });

  const nextSeq = count + 1;
  return `${basePrefix}-${String(nextSeq).padStart(4, '0')}`;
}

// 1. PUBLIC: GET /api/v1/evaluation/forms/:id/public
router.get('/forms/:id/public', async (req: Request, res: Response) => {
  try {
    const formId = BigInt(req.params.id);
    let form = await prisma.evaluationForm.findUnique({
      where: { id: formId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            start_date: true,
            organizer: { select: { full_name: true, organization: true } },
            certificate_config: true,
          },
        },
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            questions: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!form) {
      form = await prisma.evaluationForm.findUnique({
        where: { event_id: formId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              location: true,
              start_date: true,
              organizer: { select: { full_name: true, organization: true } },
              certificate_config: true,
            },
          },
          sections: {
            orderBy: { order_index: 'asc' },
            include: {
              questions: {
                orderBy: { order_index: 'asc' },
              },
            },
          },
        },
      });
    }

    if (!form || !form.is_active) {
      return res.status(404).json({ success: false, message: 'ไม่พบแบบประเมินหรือแบบประเมินปิดรับการตอบแล้ว' });
    }

    const themeConfig = (form.theme_config as any) || {};
    const now = new Date();
    let isWindowOpen = true;
    let windowNotice = '';

    if (themeConfig.start_date && now < new Date(themeConfig.start_date)) {
      isWindowOpen = false;
      windowNotice = `แบบประเมินจะเปิดให้ทำในวันที่ ${new Date(themeConfig.start_date).toLocaleDateString('th-TH')}`;
    }
    if (themeConfig.end_date && now > new Date(themeConfig.end_date)) {
      isWindowOpen = false;
      windowNotice = `แบบประเมินสิ้นสุดระยะเวลารับคำตอบแล้วเมื่อวันที่ ${new Date(themeConfig.end_date).toLocaleDateString('th-TH')}`;
    }

    return res.json({
      success: true,
      is_window_open: isWindowOpen,
      window_notice: windowNotice,
      data: serializeBigInt(form),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 2. PUBLIC: POST /api/v1/evaluation/forms/:id/respond & /api/v1/evaluation/forms/:id/submit
const handleEvaluationResponse = async (req: Request, res: Response) => {
  try {
    const formId = BigInt(req.params.id);
    const { answers, attendee_id, phone, citizen_id } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาตอบแบบประเมิน' });
    }

    let form = await prisma.evaluationForm.findUnique({
      where: { id: formId },
      include: { event: true },
    });

    if (!form) {
      form = await prisma.evaluationForm.findUnique({
        where: { event_id: formId },
        include: { event: true },
      });
    }

    if (!form || !form.is_active) {
      return res.status(404).json({ success: false, message: 'แบบประเมินปิดรับคำตอบแล้ว' });
    }

    const themeConfig = (form.theme_config as any) || {};
    const now = new Date();

    if (themeConfig.start_date && now < new Date(themeConfig.start_date)) {
      return res.status(400).json({ success: false, message: 'ยังไม่ถึงช่วงเวลาเปิดรับการตอบแบบประเมิน' });
    }
    if (themeConfig.end_date && now > new Date(themeConfig.end_date)) {
      return res.status(400).json({ success: false, message: 'สิ้นสุดช่วงเวลาการตอบแบบประเมินแล้ว' });
    }

    let attendee = null;
    if (attendee_id) {
      attendee = await prisma.attendee.findFirst({
        where: { id: BigInt(attendee_id), event_id: form.event_id },
      });
    } else if (phone || citizen_id) {
      const trimmedPhone = phone ? phone.trim().replace(/-/g, '') : null;
      const trimmedCitizen = citizen_id ? citizen_id.trim().replace(/-/g, '') : null;

      attendee = await prisma.attendee.findFirst({
        where: {
          event_id: form.event_id,
          OR: [
            ...(trimmedPhone ? [{ phone: trimmedPhone }] : []),
            ...(trimmedCitizen ? [{ citizen_id: trimmedCitizen }] : []),
          ],
        },
      });
    }

    // Duplicate Check
    const preventDuplicate = themeConfig.prevent_duplicate ?? true;
    if (attendee && preventDuplicate) {
      const existingResp = await prisma.evaluationResponse.findFirst({
        where: { form_id: form.id, attendee_id: attendee.id },
      });
      if (existingResp) {
        return res.status(400).json({
          success: false,
          message: 'ท่านได้ตอบแบบประเมินความพึงพอใจสำหรับกิจกรรมนี้ไปแล้ว (จำกัด 1 สิทธิ์ต่อ 1 ท่าน)',
          certificate_no: attendee.certificate_no,
          can_download_certificate: !!attendee.certificate_no,
          attendee_id: attendee.id.toString(),
        });
      }
    }

    // Calculate Respondent Mean Score across RATING_5 questions
    const numericScores = answers
      .filter((a: any) => typeof a.score === 'number' && a.score >= 1 && a.score <= 5)
      .map((a: any) => a.score as number);

    const respondentMean =
      numericScores.length > 0
        ? Math.round((numericScores.reduce((acc, v) => acc + v, 0) / numericScores.length) * 100) / 100
        : 0;

    const minPassingScore = typeof themeConfig.min_passing_score === 'number' ? themeConfig.min_passing_score : 0;
    const passedThreshold = minPassingScore <= 0 || respondentMean >= minPassingScore;

    // Save response in transaction
    const savedResponse = await prisma.$transaction(async (tx) => {
      const response = await tx.evaluationResponse.create({
        data: {
          form_id: form.id,
          attendee_id: attendee ? attendee.id : null,
          respondent_meta: {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            submitted_at: new Date().toISOString(),
            mean_score: respondentMean,
            passed_threshold: passedThreshold,
          },
        },
      });

      for (const ans of answers) {
        if (!ans.question_id) continue;
        await tx.evaluationAnswer.create({
          data: {
            response_id: response.id,
            question_id: BigInt(ans.question_id),
            score: typeof ans.score === 'number' ? ans.score : null,
            text_value: ans.text_value !== undefined ? String(ans.text_value) : null,
          },
        });
      }

      // Check certificate issuance eligibility
      let issuedCertificateNo = null;
      if (attendee) {
        const certConfig = (form.event.certificate_config as any) || {};
        const requireCheckIn = certConfig.require_check_in ?? true;

        const isEligible = (!requireCheckIn || attendee.status === 'checked_in') && passedThreshold;

        if (isEligible) {
          if (!attendee.certificate_no) {
            const prefix = certConfig.certificate_no_prefix;
            issuedCertificateNo = await generateNextCertificateNumber(form.event_id, prefix);
            await tx.attendee.update({
              where: { id: attendee.id },
              data: {
                certificate_no: issuedCertificateNo,
                certificate_issued_at: new Date(),
                is_certificate_eligible: true,
              },
            });
          } else {
            issuedCertificateNo = attendee.certificate_no;
          }
        }
      }

      return { response, attendee, issuedCertificateNo };
    });

    let returnMsg = 'บันทึกคำตอบแบบประเมินเรียบร้อยแล้ว ขอขอบคุณสำหรับความคิดเห็น';
    if (!passedThreshold && minPassingScore > 0) {
      returnMsg = `บันทึกคำตอบเรียบร้อยแล้ว (คะแนนเฉลี่ยของคุณคือ ${respondentMean.toFixed(2)} จากเกณฑ์ขั้นต่ำ ${minPassingScore.toFixed(2)})`;
    }

    return res.status(201).json({
      success: true,
      message: returnMsg,
      data: serializeBigInt({
        response_id: savedResponse.response.id,
        attendee_id: savedResponse.attendee ? savedResponse.attendee.id : null,
        certificate_no: savedResponse.issuedCertificateNo,
        can_download_certificate: !!savedResponse.issuedCertificateNo,
        respondent_mean: respondentMean,
        passed_threshold: passedThreshold,
      }),
    });
  } catch (error: any) {
    console.error('Submit evaluation error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งแบบประเมิน', error: error.message });
  }
};

router.post('/forms/:id/respond', handleEvaluationResponse);
router.post('/forms/:id/submit', handleEvaluationResponse);

// 3. AUTH: GET /api/v1/evaluation/events/:eventId/form
router.get('/events/:eventId/form', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const form = await prisma.evaluationForm.findUnique({
      where: { event_id: eventId },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            questions: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
        _count: { select: { responses: true } },
      },
    });

    return res.json({ success: true, data: serializeBigInt(form) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 4. AUTH: POST /api/v1/evaluation/events/:eventId/form - Create or Update full evaluation form
router.post('/events/:eventId/form', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (req.user!.role !== 'ADMIN' && event.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { title, description, theme_config, is_active, target_responses, sections } = req.body;

    const savedForm = await prisma.$transaction(async (tx) => {
      let form = await tx.evaluationForm.findUnique({ where: { event_id: eventId } });

      if (!form) {
        form = await tx.evaluationForm.create({
          data: {
            event_id: eventId,
            title: title || `แบบประเมินความพึงพอใจ - ${event.title}`,
            description: description || '',
            theme_config: theme_config || {},
            is_active: is_active ?? true,
            target_responses: target_responses ? parseInt(target_responses) : 50,
          },
        });
      } else {
        form = await tx.evaluationForm.update({
          where: { id: form.id },
          data: {
            title: title || form.title,
            description: description !== undefined ? description : form.description,
            theme_config: theme_config || form.theme_config,
            is_active: is_active !== undefined ? is_active : form.is_active,
            target_responses: target_responses ? parseInt(target_responses) : form.target_responses,
          },
        });
      }

      if (Array.isArray(sections)) {
        await tx.evaluationSection.deleteMany({ where: { form_id: form.id } });

        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          const createdSec = await tx.evaluationSection.create({
            data: {
              form_id: form.id,
              title: sec.title || `ตอนที่ ${sIdx + 1}`,
              description: sec.description || '',
              order_index: sIdx + 1,
            },
          });

          if (Array.isArray(sec.questions)) {
            for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
              const q = sec.questions[qIdx];
              await tx.evaluationQuestion.create({
                data: {
                  section_id: createdSec.id,
                  question_text: q.question_text || '',
                  question_type: q.question_type || QuestionType.RATING_5,
                  options: q.options || [],
                  order_index: qIdx + 1,
                  is_required: q.is_required !== undefined ? q.is_required : true,
                },
              });
            }
          }
        }
      }

      return tx.evaluationForm.findUnique({
        where: { id: form.id },
        include: {
          sections: {
            orderBy: { order_index: 'asc' },
            include: { questions: { orderBy: { order_index: 'asc' } } },
          },
        },
      });
    });

    return res.json({ success: true, message: 'บันทึกแบบประเมินเรียบร้อย', data: serializeBigInt(savedForm) });
  } catch (error: any) {
    console.error('Save form error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกแบบประเมิน', error: error.message });
  }
});

// 5. AUTH: GET /api/v1/evaluation/events/:eventId/summary - Statistical analysis report
router.get('/events/:eventId/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const form = await prisma.evaluationForm.findUnique({
      where: { event_id: eventId },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            questions: {
              orderBy: { order_index: 'asc' },
              include: { answers: true },
            },
          },
        },
        responses: {
          include: { attendee: true },
        },
      },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: 'ไม่พบแบบประเมินของกิจกรรมนี้' });
    }

    const totalResponses = form.responses.length;
    const allRatingScores: number[] = [];

    const sectionSummaries = form.sections.map((section) => {
      const sectionScores: number[] = [];
      const questionSummaries = section.questions.map((q) => {
        if (q.question_type === QuestionType.RATING_5) {
          const scores = q.answers.filter((a) => a.score !== null).map((a) => a.score as number);
          sectionScores.push(...scores);
          allRatingScores.push(...scores);
          const stats = calculateStatistics(scores);

          const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          scores.forEach((s) => {
            if (distribution[s] !== undefined) distribution[s]++;
          });

          return {
            id: q.id.toString(),
            question_text: q.question_text,
            question_type: q.question_type,
            stats,
            distribution,
          };
        } else if (q.question_type === QuestionType.RADIO || q.question_type === QuestionType.CHECKBOX) {
          const counts: Record<string, number> = {};
          q.answers.forEach((a) => {
            if (a.text_value) {
              counts[a.text_value] = (counts[a.text_value] || 0) + 1;
            }
          });
          return {
            id: q.id.toString(),
            question_text: q.question_text,
            question_type: q.question_type,
            choice_counts: counts,
            total_answered: q.answers.length,
          };
        } else {
          const textAnswers = q.answers
            .map((a) => a.text_value)
            .filter((t) => t && t.trim().length > 0) as string[];
          return {
            id: q.id.toString(),
            question_text: q.question_text,
            question_type: q.question_type,
            text_answers: textAnswers,
            total_answered: textAnswers.length,
          };
        }
      });

      const sectionStats = calculateStatistics(sectionScores);
      return {
        id: section.id.toString(),
        title: section.title,
        description: section.description,
        stats: sectionStats,
        questions: questionSummaries,
      };
    });

    const overallStats = calculateStatistics(allRatingScores);

    return res.json({
      success: true,
      data: serializeBigInt({
        form_id: form.id,
        title: form.title,
        description: form.description,
        theme_config: form.theme_config,
        total_responses: totalResponses,
        target_responses: form.target_responses,
        completion_rate: form.target_responses > 0 ? Math.round((totalResponses / form.target_responses) * 100) : 100,
        overall: overallStats,
        sections: sectionSummaries,
      }),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการคำนวณสถิติ', error: error.message });
  }
});

// 6. AUTH: GET /api/v1/evaluation/templates
router.get('/templates', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.evaluationTemplate.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
    });
    return res.json({ success: true, data: serializeBigInt(templates) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 7. AUTH: POST /api/v1/evaluation/events/:eventId/apply-template/:templateId
router.post('/events/:eventId/apply-template/:templateId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const templateId = parseInt(req.params.templateId);

    const template = await prisma.evaluationTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'ไม่พบแม่แบบแบบประเมิน' });
    }

    const templateSections = (template.sections as any[]) || [];

    const updatedForm = await prisma.$transaction(async (tx) => {
      let form = await tx.evaluationForm.findUnique({ where: { event_id: eventId } });

      if (!form) {
        form = await tx.evaluationForm.create({
          data: {
            event_id: eventId,
            title: template.title,
            description: template.description || '',
            theme_config: template.theme_config || {},
            target_responses: template.target_responses || 50,
          },
        });
      } else {
        form = await tx.evaluationForm.update({
          where: { id: form.id },
          data: {
            title: template.title,
            description: template.description || form.description,
            theme_config: (template.theme_config || form.theme_config || {}) as any,
            target_responses: template.target_responses || form.target_responses,
          },
        });
      }

      await tx.evaluationSection.deleteMany({ where: { form_id: form.id } });

      for (let sIdx = 0; sIdx < templateSections.length; sIdx++) {
        const sec = templateSections[sIdx];
        const createdSec = await tx.evaluationSection.create({
          data: {
            form_id: form.id,
            title: sec.title || `ตอนที่ ${sIdx + 1}`,
            description: sec.description || '',
            order_index: sIdx + 1,
          },
        });

        if (Array.isArray(sec.questions)) {
          for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
            const q = sec.questions[qIdx];
            await tx.evaluationQuestion.create({
              data: {
                section_id: createdSec.id,
                question_text: q.question_text || '',
                question_type: q.question_type || QuestionType.RATING_5,
                options: q.options || [],
                order_index: qIdx + 1,
                is_required: q.is_required !== undefined ? q.is_required : true,
              },
            });
          }
        }
      }

      return tx.evaluationForm.findUnique({
        where: { id: form.id },
        include: {
          sections: {
            orderBy: { order_index: 'asc' },
            include: { questions: { orderBy: { order_index: 'asc' } } },
          },
        },
      });
    });

    return res.json({
      success: true,
      message: `นำเข้าแม่แบบ "${template.title}" สำเร็จ`,
      data: serializeBigInt(updatedForm),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการนำเข้าแม่แบบ', error: error.message });
  }
});

// 8. AUTH: GET /api/v1/evaluation/events/:eventId/export-csv - Export responses to Excel/CSV with BOM
router.get('/events/:eventId/export-csv', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const form = await prisma.evaluationForm.findUnique({
      where: { event_id: eventId },
      include: {
        event: { select: { title: true, event_code: true } },
        sections: {
          orderBy: { order_index: 'asc' },
          include: { questions: { orderBy: { order_index: 'asc' } } },
        },
        responses: {
          orderBy: { submitted_at: 'asc' },
          include: {
            attendee: true,
            answers: true,
          },
        },
      },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: 'ไม่พบแบบประเมิน' });
    }

    // Collect all question columns
    const allQuestions: { id: bigint; label: string }[] = [];
    form.sections.forEach((s) => {
      s.questions.forEach((q) => {
        allQuestions.push({
          id: q.id,
          label: `[${s.title}] ${q.question_text}`.replace(/[\r\n",]/g, ' '),
        });
      });
    });

    // Header row
    const headers = [
      'ลำดับ',
      'วันที่-เวลาตอบ',
      'ชื่อ-นามสกุล',
      'เบอร์โทรศัพท์',
      'สังกัด/หน่วยงาน',
      'เลขที่เกียรติบัตร',
      ...allQuestions.map((q) => `"${q.label}"`),
      'คะแนนเฉลี่ยของผู้ตอบ',
    ];

    const rows: string[] = [];
    rows.push(headers.join(','));

    form.responses.forEach((resp, idx) => {
      const answersMap = new Map<string, string>();
      const ratingScores: number[] = [];

      resp.answers.forEach((ans) => {
        if (ans.score !== null) {
          answersMap.set(ans.question_id.toString(), ans.score.toString());
          ratingScores.push(ans.score);
        } else if (ans.text_value !== null) {
          answersMap.set(ans.question_id.toString(), `"${ans.text_value.replace(/"/g, '""')}"`);
        }
      });

      const avg =
        ratingScores.length > 0
          ? (ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length).toFixed(2)
          : '-';

      const row = [
        idx + 1,
        `"${new Date(resp.submitted_at).toLocaleString('th-TH')}"`,
        `"${(resp.attendee ? `${resp.attendee.title_name || ''}${resp.attendee.full_name}` : 'ผู้ตอบนิรนาม').replace(/"/g, '""')}"`,
        `"${resp.attendee?.phone || '-'}"`,
        `"${(resp.attendee?.organization || '-').replace(/"/g, '""')}"`,
        `"${resp.attendee?.certificate_no || '-'}"`,
        ...allQuestions.map((q) => answersMap.get(q.id.toString()) || '""'),
        avg,
      ];
      rows.push(row.join(','));
    });

    // Prepend UTF-8 BOM so Excel opens Thai correctly
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const filename = `evaluation_${form.event.event_code || eventId}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล', error: error.message });
  }
});

export default router;
