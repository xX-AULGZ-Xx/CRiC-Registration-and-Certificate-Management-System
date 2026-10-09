import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middlewares/auth';

const router = Router();
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || '../../storage');
const CERT_DIR = path.join(STORAGE_DIR, 'certificates');

if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CERT_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cert-asset-${uniqueSuffix}${ext}`);
  },
});

const uploadCertAsset = multer({
  storage: certStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, SVG) เท่านั้น'));
    }
  },
});

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

// 1. PUBLIC: GET /api/v1/certificates/verify/:certificateNo - Public Verification Page
router.get('/verify/:certificateNo', async (req: Request, res: Response) => {
  try {
    const { certificateNo } = req.params;
    if (!certificateNo) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเลขที่เกียรติบัตร' });
    }

    const attendee = await prisma.attendee.findFirst({
      where: { certificate_no: certificateNo.trim() },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            event_code: true,
            project_ref_code: true,
            location: true,
            start_date: true,
            end_date: true,
            organizer: { select: { full_name: true, organization: true } },
            certificate_config: true,
          },
        },
      },
    });

    if (!attendee) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'ไม่พบข้อมูลเกียรติบัตรฉบับนี้ในระบบ หรืออาจเป็นเอกสารที่ยังไม่ได้รับการรับรอง',
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: 'เกียรติบัตรนี้เป็นเอกสารจริงที่ออกโดยระบบอย่างถูกต้อง',
      data: serializeBigInt({
        certificate_no: attendee.certificate_no,
        full_name: `${attendee.title_name || ''}${attendee.full_name}`,
        position: attendee.position,
        organization: attendee.organization,
        event_title: attendee.event.title,
        event_code: attendee.event.event_code,
        project_ref_code: attendee.event.project_ref_code,
        location: attendee.event.location,
        issue_date: attendee.certificate_issued_at || attendee.checked_in_at || attendee.created_at,
        organizer: attendee.event.organizer,
      }),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบเกียรติบัตร', error: error.message });
  }
});

// 2. PUBLIC: GET /api/v1/certificates/search - Public Certificate Search Portal
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลค้นหาอย่างน้อย 3 ตัวอักษร (เบอร์โทรศัพท์, เลขบัตรประชาชน หรือชื่อ-นามสกุล)',
      });
    }

    const cleanQ = query.trim().replace(/-/g, '');
    const attendees = await prisma.attendee.findMany({
      where: {
        certificate_no: { not: null },
        OR: [
          { phone: { contains: cleanQ } },
          { citizen_id: { contains: cleanQ } },
          { full_name: { contains: query.trim() } },
          { certificate_no: { contains: query.trim() } },
        ],
      },
      orderBy: { created_at: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            start_date: true,
            location: true,
            organizer: { select: { full_name: true, organization: true } },
          },
        },
      },
    });

    return res.json({ success: true, count: attendees.length, data: serializeBigInt(attendees) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการค้นหา', error: error.message });
  }
});

// 3. PUBLIC: GET /api/v1/certificates/attendees/:id/data - Render data for a certificate
router.get('/attendees/:id/data', async (req: Request, res: Response) => {
  try {
    const id = BigInt(req.params.id);
    const attendee = await prisma.attendee.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            organizer: { select: { full_name: true, organization: true, position: true, signature_img: true } },
          },
        },
      },
    });

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้เข้าร่วม' });
    }

    return res.json({ success: true, data: serializeBigInt(attendee) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 4. AUTH: POST /api/v1/certificates/events/:eventId/upload-bg - Upload Certificate Background
router.post('/events/:eventId/upload-bg', authenticate, uploadCertAsset.single('background'), async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (req.user!.role !== 'ADMIN' && event.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'ไม่พบไฟล์รูปภาพ' });
    }

    const bgUrl = `/storage/certificates/${req.file.filename}`;
    const currentConfig = (event.certificate_config as any) || {};
    const updatedConfig = { ...currentConfig, bg_image_url: bgUrl };

    await prisma.event.update({
      where: { id: eventId },
      data: { certificate_config: updatedConfig },
    });

    return res.json({ success: true, message: 'อัปโหลดภาพพื้นหลังเกียรติบัตรสำเร็จ', data: { bg_image_url: bgUrl } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลด', error: error.message });
  }
});

// 5. AUTH: PUT /api/v1/certificates/events/:eventId/config - Save certificate configuration
router.put('/events/:eventId/config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (req.user!.role !== 'ADMIN' && event.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { certificate_config } = req.body;
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { certificate_config: certificate_config || {} },
    });

    return res.json({ success: true, message: 'บันทึกรูปแบบเกียรติบัตรเรียบร้อย', data: serializeBigInt(updated) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 6. AUTH: POST /api/v1/certificates/events/:eventId/issue-all - Batch issue certificates
router.post('/events/:eventId/issue-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (req.user!.role !== 'ADMIN' && event.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { only_checked_in = true } = req.body;
    const certConfig = (event.certificate_config as any) || {};
    const prefix = certConfig.certificate_no_prefix;

    const whereClause: any = {
      event_id: eventId,
      certificate_no: null,
    };
    if (only_checked_in) {
      whereClause.status = 'checked_in';
    }

    const attendeesWithoutCert = await prisma.attendee.findMany({
      where: whereClause,
      orderBy: { created_at: 'asc' },
    });

    let issuedCount = 0;
    for (const att of attendeesWithoutCert) {
      const certNo = await generateNextCertificateNumber(eventId, prefix);
      await prisma.attendee.update({
        where: { id: att.id },
        data: {
          certificate_no: certNo,
          certificate_issued_at: new Date(),
          is_certificate_eligible: true,
        },
      });
      issuedCount++;
    }

    return res.json({
      success: true,
      message: `ออกเกียรติบัตรสำเร็จจำนวน ${issuedCount} ท่าน`,
      issued_count: issuedCount,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการออกเกียรติบัตร', error: error.message });
  }
});

// 7. AUTH: POST /api/v1/certificates/attendees/:id/issue - Issue certificate for single attendee
router.post('/attendees/:id/issue', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id);
    const attendee = await prisma.attendee.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!attendee) return res.status(404).json({ success: false, message: 'ไม่พบผู้เข้าร่วม' });

    if (attendee.certificate_no) {
      return res.json({
        success: true,
        message: 'ผู้เข้าร่วมมีเลขที่เกียรติบัตรอยู่แล้ว',
        data: serializeBigInt(attendee),
      });
    }

    const certConfig = (attendee.event.certificate_config as any) || {};
    const certNo = await generateNextCertificateNumber(attendee.event_id, certConfig.certificate_no_prefix);

    const updated = await prisma.attendee.update({
      where: { id },
      data: {
        certificate_no: certNo,
        certificate_issued_at: new Date(),
        is_certificate_eligible: true,
      },
    });

    return res.json({
      success: true,
      message: `ออกเกียรติบัตรสำเร็จ: ${certNo}`,
      data: serializeBigInt(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

export default router;
