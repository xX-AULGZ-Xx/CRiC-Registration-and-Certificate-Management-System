import { Router, Request, Response } from 'express';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { authenticate, optionalAuthenticate, AuthRequest } from '../../middlewares/auth';
import { EventStatus } from '@prisma/client';

const router = Router();

// Helper to generate running event code
async function generateNextEventCode(): Promise<string> {
  const year = new Date().getFullYear() + 543;
  const count = await prisma.event.count();
  return `EVT-${year}-${String(count + 1).padStart(4, '0')}`;
}

// 1. PUBLIC: GET /api/v1/events/public - List open events for public registration
router.get('/public', async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: { in: [EventStatus.OPEN, EventStatus.CLOSED] },
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        event_code: true,
        title: true,
        description: true,
        location: true,
        start_date: true,
        end_date: true,
        start_time: true,
        end_time: true,
        registration_start: true,
        registration_end: true,
        max_attendees: true,
        status: true,
        banner_url: true,
        organizer: {
          select: {
            full_name: true,
            organization: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    return res.json({ success: true, data: serializeBigInt(events) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดกิจกรรม', error: error.message });
  }
});

// 2. PUBLIC: GET /api/v1/events/:id/public - Public event details
router.get('/:id/public', async (req: Request, res: Response) => {
  try {
    const eventId = BigInt(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            full_name: true,
            position: true,
            organization: true,
            email: true,
          },
        },
        evaluation_form: {
          select: {
            id: true,
            title: true,
            is_active: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมที่ระบุ' });
    }

    return res.json({ success: true, data: serializeBigInt(event) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 3. AUTH: GET /api/v1/events - List events for dashboard
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isOrganizerOnly = req.user!.role !== 'ADMIN';
    const whereClause: any = isOrganizerOnly ? { organizer_id: req.user!.id } : {};

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        organizer: {
          select: {
            id: true,
            full_name: true,
            organization: true,
          },
        },
        evaluation_form: {
          select: {
            id: true,
            title: true,
            _count: { select: { responses: true } },
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    return res.json({ success: true, data: serializeBigInt(events) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดรายการกิจกรรม', error: error.message });
  }
});

// 4. AUTH: GET /api/v1/events/:id - Get single event management detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organization: true,
            position: true,
          },
        },
        evaluation_form: {
          select: {
            id: true,
            title: true,
            description: true,
            theme_config: true,
            is_active: true,
            target_responses: true,
            _count: { select: { responses: true, sections: true } },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมที่ระบุ' });
    }

    if (req.user!.role !== 'ADMIN' && event.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงกิจกรรมนี้' });
    }

    return res.json({ success: true, data: serializeBigInt(event) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 5. AUTH: POST /api/v1/events - Create new event
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      project_ref_code,
      location,
      start_date,
      end_date,
      start_time,
      end_time,
      registration_start,
      registration_end,
      max_attendees,
      status,
      banner_url,
      registration_config,
      certificate_config,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อกิจกรรม' });
    }

    const event_code = await generateNextEventCode();

    const newEvent = await prisma.event.create({
      data: {
        event_code,
        title: title.trim(),
        description: description || null,
        project_ref_code: project_ref_code ? project_ref_code.trim() : null,
        organizer_id: req.user!.id,
        location: location || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        start_time: start_time ? start_time.trim() : null,
        end_time: end_time ? end_time.trim() : null,
        registration_start: registration_start ? new Date(registration_start) : null,
        registration_end: registration_end ? new Date(registration_end) : null,
        max_attendees: max_attendees ? parseInt(max_attendees) : 0,
        status: status || EventStatus.OPEN,
        banner_url: banner_url || null,
        registration_config: registration_config || {},
        certificate_config: certificate_config || {},
      },
    });

    return res.status(201).json({ success: true, message: 'สร้างกิจกรรมสำเร็จ', data: serializeBigInt(newEvent) });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม', error: error.message });
  }
});

// 6. AUTH: PUT /api/v1/events/:id - Update event
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id: eventId } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    }

    if (req.user!.role !== 'ADMIN' && existing.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้' });
    }

    const {
      title,
      description,
      project_ref_code,
      location,
      start_date,
      end_date,
      start_time,
      end_time,
      registration_start,
      registration_end,
      max_attendees,
      status,
      banner_url,
      registration_config,
      certificate_config,
    } = req.body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description;
    if (project_ref_code !== undefined) dataToUpdate.project_ref_code = project_ref_code;
    if (location !== undefined) dataToUpdate.location = location;
    if (start_date !== undefined) dataToUpdate.start_date = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) dataToUpdate.end_date = end_date ? new Date(end_date) : null;
    if (start_time !== undefined) dataToUpdate.start_time = start_time ? start_time.trim() : null;
    if (end_time !== undefined) dataToUpdate.end_time = end_time ? end_time.trim() : null;
    if (registration_start !== undefined) dataToUpdate.registration_start = registration_start ? new Date(registration_start) : null;
    if (registration_end !== undefined) dataToUpdate.registration_end = registration_end ? new Date(registration_end) : null;
    if (max_attendees !== undefined) dataToUpdate.max_attendees = parseInt(max_attendees) || 0;
    if (status !== undefined) dataToUpdate.status = status;
    if (banner_url !== undefined) dataToUpdate.banner_url = banner_url;
    if (registration_config !== undefined) dataToUpdate.registration_config = registration_config;
    if (certificate_config !== undefined) dataToUpdate.certificate_config = certificate_config;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: dataToUpdate,
    });

    return res.json({ success: true, message: 'บันทึกการแก้ไขกิจกรรมสำเร็จ', data: serializeBigInt(updated) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม', error: error.message });
  }
});

// 7. AUTH: DELETE /api/v1/events/:id - Delete event
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id: eventId } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    }

    if (req.user!.role !== 'ADMIN' && existing.organizer_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบกิจกรรมนี้' });
    }

    await prisma.event.delete({ where: { id: eventId } });

    return res.json({ success: true, message: 'ลบกิจกรรมสำเร็จ' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบกิจกรรม', error: error.message });
  }
});

// 8. AUTH: GET /api/v1/events/:id/stats - Event summary statistics
router.get('/:id/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.id);

    const [totalAttendees, checkedInCount, certIssuedCount, evalForm] = await Promise.all([
      prisma.attendee.count({ where: { event_id: eventId } }),
      prisma.attendee.count({ where: { event_id: eventId, status: 'checked_in' } }),
      prisma.attendee.count({ where: { event_id: eventId, certificate_no: { not: null } } }),
      prisma.evaluationForm.findUnique({
        where: { event_id: eventId },
        include: { _count: { select: { responses: true } } },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        total_attendees: totalAttendees,
        checked_in: checkedInCount,
        certificates_issued: certIssuedCount,
        evaluation_responses: evalForm?._count?.responses || 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

export default router;
