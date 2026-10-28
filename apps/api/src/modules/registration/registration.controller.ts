import { Router, Request, Response } from 'express';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middlewares/auth';

const router = Router();

// Helper to check event organizer access
async function checkEventAccess(eventId: bigint, user: { id: bigint; role: string }) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (user.role !== 'ADMIN' && event.organizer_id !== user.id) return 'FORBIDDEN';
  return event;
}

// 1. PUBLIC: GET /api/v1/registration/events/:eventId/public-info
router.get('/events/:eventId/public-info', async (req: Request, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: { select: { full_name: true, organization: true } },
        _count: { select: { attendees: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    }

    const now = new Date();
    let isOpen = event.status === 'OPEN';
    if (event.registration_start && now < new Date(event.registration_start)) isOpen = false;
    if (event.registration_end && now > new Date(event.registration_end)) isOpen = false;
    if (event.max_attendees > 0 && event._count.attendees >= event.max_attendees) isOpen = false;

    return res.json({
      success: true,
      data: serializeBigInt({
        event: {
          id: event.id,
          event_code: event.event_code,
          title: event.title,
          description: event.description,
          location: event.location,
          start_date: event.start_date,
          end_date: event.end_date,
          start_time: (event as any).start_time,
          end_time: (event as any).end_time,
          registration_start: event.registration_start,
          registration_end: event.registration_end,
          max_attendees: event.max_attendees,
          current_attendees: event._count.attendees,
          status: event.status,
          banner_url: event.banner_url,
          registration_config: event.registration_config,
          organizer: event.organizer,
          is_registration_open: isOpen,
        },
      }),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 2. PUBLIC: POST /api/v1/registration/events/:eventId/register
router.post('/events/:eventId/register', async (req: Request, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { attendees: true } } },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    }

    if (event.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'กิจกรรมนี้ปิดรับลงทะเบียนแล้ว' });
    }

    const now = new Date();
    if (event.registration_start && now < new Date(event.registration_start)) {
      return res.status(400).json({ success: false, message: 'ยังไม่ถึงช่วงเวลาเปิดรับลงทะเบียน' });
    }
    if (event.registration_end && now > new Date(event.registration_end)) {
      return res.status(400).json({ success: false, message: 'สิ้นสุดช่วงเวลาการรับลงทะเบียนแล้ว' });
    }
    if (event.max_attendees > 0 && event._count.attendees >= event.max_attendees) {
      return res.status(400).json({ success: false, message: 'ผู้ลงทะเบียนเต็มจำนวนแล้ว' });
    }

    const { title_name, full_name, position, organization, phone, email, citizen_id, custom_data } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ-นามสกุล' });
    }

    // Check duplicate registration
    const trimmedPhone = phone ? phone.trim().replace(/-/g, '') : null;
    const trimmedCitizen = citizen_id ? citizen_id.trim().replace(/-/g, '') : null;

    if (trimmedPhone || trimmedCitizen) {
      const orConditions: any[] = [];
      if (trimmedPhone) orConditions.push({ phone: trimmedPhone });
      if (trimmedCitizen) orConditions.push({ citizen_id: trimmedCitizen });

      const duplicate = await prisma.attendee.findFirst({
        where: {
          event_id: eventId,
          OR: orConditions,
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'เบอร์โทรศัพท์หรือเลขประจำตัวประชาชนนี้ลงทะเบียนในกิจกรรมนี้เรียบร้อยแล้ว',
          attendee_id: duplicate.id.toString(),
        });
      }
    }

    const attendee = await prisma.attendee.create({
      data: {
        event_id: eventId,
        title_name: title_name || null,
        full_name: full_name.trim(),
        position: position || null,
        organization: organization || null,
        phone: trimmedPhone,
        email: email ? email.trim() : null,
        citizen_id: trimmedCitizen,
        status: 'registered',
        custom_data: custom_data || {},
      },
    });

    return res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จเรียบร้อยแล้ว',
      data: serializeBigInt({
        attendee,
        event: {
          id: event.id,
          title: event.title,
          location: event.location,
          start_date: event.start_date,
        },
      }),
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน', error: error.message });
  }
});

// 3. AUTH: GET /api/v1/registration/events/:eventId/attendees
router.get('/events/:eventId/attendees', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const access = await checkEventAccess(eventId, req.user!);
    if (!access) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (access === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึง' });

    const { search, status } = req.query;
    const where: any = { event_id: eventId };

    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { full_name: { contains: q } },
        { phone: { contains: q } },
        { citizen_id: { contains: q } },
        { organization: { contains: q } },
        { certificate_no: { contains: q } },
      ];
    }

    const attendees = await prisma.attendee.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { evaluation_responses: true } },
      },
    });

    return res.json({ success: true, data: serializeBigInt(attendees) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 4. AUTH: POST /api/v1/registration/events/:eventId/check-in
router.post('/events/:eventId/check-in', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const access = await checkEventAccess(eventId, req.user!);
    if (!access) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (access === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    const { attendee_id, phone, citizen_id } = req.body;
    let attendee = null;

    if (attendee_id) {
      attendee = await prisma.attendee.findFirst({
        where: { id: BigInt(attendee_id), event_id: eventId },
      });
    } else if (phone || citizen_id) {
      attendee = await prisma.attendee.findFirst({
        where: {
          event_id: eventId,
          OR: [
            ...(phone ? [{ phone: phone.trim().replace(/-/g, '') }] : []),
            ...(citizen_id ? [{ citizen_id: citizen_id.trim().replace(/-/g, '') }] : []),
          ],
        },
      });
    }

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายชื่อผู้ลงทะเบียน' });
    }

    const updated = await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        status: 'checked_in',
        checked_in_at: new Date(),
        is_certificate_eligible: true,
      },
    });

    return res.json({
      success: true,
      message: `เช็คชื่อสำเร็จ: ${attendee.full_name}`,
      data: serializeBigInt(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเช็คชื่อ', error: error.message });
  }
});

// 5. AUTH: POST /api/v1/registration/events/:eventId/batch-check-in
router.post('/events/:eventId/batch-check-in', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const access = await checkEventAccess(eventId, req.user!);
    if (!access) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (access === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    const { attendee_ids } = req.body;
    if (!Array.isArray(attendee_ids) || attendee_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรายชื่อที่ต้องการเช็คชื่อ' });
    }

    const bigIntIds = attendee_ids.map((id) => BigInt(id));

    const result = await prisma.attendee.updateMany({
      where: {
        id: { in: bigIntIds },
        event_id: eventId,
      },
      data: {
        status: 'checked_in',
        checked_in_at: new Date(),
        is_certificate_eligible: true,
      },
    });

    return res.json({ success: true, message: `เช็คชื่อสำเร็จจำนวน ${result.count} ท่าน` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 6. AUTH: PUT /api/v1/registration/attendees/:id
router.put('/attendees/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id);
    const attendee = await prisma.attendee.findUnique({ where: { id } });
    if (!attendee) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ลงทะเบียน' });

    const access = await checkEventAccess(attendee.event_id, req.user!);
    if (access === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    const { title_name, full_name, position, organization, phone, email, citizen_id, status } = req.body;
    const dataToUpdate: any = {};
    if (title_name !== undefined) dataToUpdate.title_name = title_name;
    if (full_name !== undefined) dataToUpdate.full_name = full_name.trim();
    if (position !== undefined) dataToUpdate.position = position;
    if (organization !== undefined) dataToUpdate.organization = organization;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim().replace(/-/g, '') : null;
    if (email !== undefined) dataToUpdate.email = email ? email.trim() : null;
    if (citizen_id !== undefined) dataToUpdate.citizen_id = citizen_id ? citizen_id.trim().replace(/-/g, '') : null;
    if (status !== undefined) dataToUpdate.status = status;

    const updated = await prisma.attendee.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({ success: true, message: 'บันทึกข้อมูลเรียบร้อย', data: serializeBigInt(updated) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 7. AUTH: DELETE /api/v1/registration/attendees/:id
router.delete('/attendees/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id);
    const attendee = await prisma.attendee.findUnique({ where: { id } });
    if (!attendee) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });

    const access = await checkEventAccess(attendee.event_id, req.user!);
    if (access === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    await prisma.attendee.delete({ where: { id } });
    return res.json({ success: true, message: 'ลบรายชื่อผู้ลงทะเบียนสำเร็จ' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// 8. AUTH: POST /api/v1/registration/events/:eventId/import-csv - Batch import attendees from CSV
router.post('/events/:eventId/import-csv', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = BigInt(req.params.eventId);
    const access = await checkEventAccess(eventId, req.user!);
    if (!access) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    if (access === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงกิจกรรมนี้' });

    const { attendees, initial_status } = req.body;
    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลรายชื่อที่ต้องการนำเข้า' });
    }

    const isCheckedIn = initial_status === 'checked_in';
    const now = new Date();

    // Fetch existing attendees to detect duplicates in this event
    const existingAttendees = await prisma.attendee.findMany({
      where: { event_id: eventId },
      select: { full_name: true, phone: true, citizen_id: true },
    });

    const existingPhones = new Set(existingAttendees.map((a) => a.phone).filter(Boolean));
    const existingCitizens = new Set(existingAttendees.map((a) => a.citizen_id).filter(Boolean));
    const existingNames = new Set(existingAttendees.map((a) => a.full_name.trim().toLowerCase()));

    const batchPhones = new Set<string>();
    const batchCitizens = new Set<string>();
    const batchNames = new Set<string>();

    const validToInsert: any[] = [];
    let skippedCount = 0;

    for (const item of attendees) {
      const rawName = item.full_name ? String(item.full_name).trim() : '';
      if (!rawName) {
        skippedCount++;
        continue;
      }

      const cleanPhone = item.phone ? String(item.phone).trim().replace(/[-\s]/g, '') : null;
      const cleanCitizen = item.citizen_id ? String(item.citizen_id).trim().replace(/[-\s]/g, '') : null;
      const nameKey = rawName.toLowerCase();

      // Check duplicates
      const isDupPhone = cleanPhone && (existingPhones.has(cleanPhone) || batchPhones.has(cleanPhone));
      const isDupCitizen = cleanCitizen && (existingCitizens.has(cleanCitizen) || batchCitizens.has(cleanCitizen));
      const isDupName = (existingNames.has(nameKey) || batchNames.has(nameKey)) && !cleanPhone && !cleanCitizen;

      if (isDupPhone || isDupCitizen || isDupName) {
        skippedCount++;
        continue;
      }

      if (cleanPhone) batchPhones.add(cleanPhone);
      if (cleanCitizen) batchCitizens.add(cleanCitizen);
      batchNames.add(nameKey);

      validToInsert.push({
        event_id: eventId,
        title_name: item.title_name ? String(item.title_name).trim() : null,
        full_name: rawName,
        position: item.position ? String(item.position).trim() : null,
        organization: item.organization ? String(item.organization).trim() : null,
        phone: cleanPhone,
        email: item.email ? String(item.email).trim() : null,
        citizen_id: cleanCitizen,
        status: isCheckedIn ? 'checked_in' : 'registered',
        checked_in_at: isCheckedIn ? now : null,
        is_certificate_eligible: isCheckedIn,
        custom_data: item.custom_data || {},
      });
    }

    if (validToInsert.length > 0) {
      await prisma.attendee.createMany({
        data: validToInsert,
      });
    }

    return res.json({
      success: true,
      message: `นำเข้ารายชื่อสำเร็จ ${validToInsert.length} ท่าน (ข้ามรายการซ้ำ/ไม่สมบูรณ์ ${skippedCount} ท่าน)`,
      data: {
        imported_count: validToInsert.length,
        skipped_count: skippedCount,
        total_rows: attendees.length,
      },
    });
  } catch (error: any) {
    console.error('Import CSV error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล CSV', error: error.message });
  }
});

export default router;
