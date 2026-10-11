import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { prisma } from '../../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../../middlewares/auth';

const router = Router();

// Ensure upload directories exist
const LOGOS_DIR = path.resolve(process.env.STORAGE_DIR || '../../storage', 'logos');
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

const SIGNATURES_DIR = path.resolve(process.env.STORAGE_DIR || '../../storage', 'signatures');
if (!fs.existsSync(SIGNATURES_DIR)) {
  fs.mkdirSync(SIGNATURES_DIR, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, LOGOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, SVG) เท่านั้น'));
    }
  },
});

const sigStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SIGNATURES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `default-sig-${uniqueSuffix}${ext}`);
  },
});

const uploadDefaultSig = multer({
  storage: sigStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) เท่านั้น'));
    }
  },
});

// Helper for BigInt serialization
function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

// All endpoints in this controller require ADMIN
router.use(authenticate);
router.use(requireAdmin);

// POST /api/v1/admin/upload-logo - Upload Organization Logo
router.post('/upload-logo', uploadLogo.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'ไม่พบไฟล์รูปภาพโลโก้' });
    }

    const logoUrl = `/storage/logos/${req.file.filename}`;

    await prisma.systemSetting.upsert({
      where: { key: 'org_logo_url' },
      update: { value: logoUrl },
      create: { key: 'org_logo_url', value: logoUrl, description: 'Organization Logo URL' },
    });

    return res.json({
      success: true,
      message: 'อัปโหลดโลโก้สำเร็จ',
      data: { file_url: logoUrl },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดโลโก้', error: error.message });
  }
});

// POST /api/v1/admin/upload-signature - Upload Default Certificate Signature
router.post('/upload-signature', uploadDefaultSig.single('signature'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'ไม่พบไฟล์รูปภาพลายเซ็น' });
    }

    const sigUrl = `/storage/signatures/${req.file.filename}`;

    await prisma.systemSetting.upsert({
      where: { key: 'default_signature_img' },
      update: { value: sigUrl },
      create: { key: 'default_signature_img', value: sigUrl, description: 'Default Certificate Signature' },
    });

    return res.json({
      success: true,
      message: 'อัปโหลดรูปลายเซ็นสำเร็จ',
      data: { file_url: sigUrl },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น', error: error.message });
  }
});

// ==========================================
// 1. SYSTEM SETTINGS (Key-Value)
// ==========================================

// GET /api/v1/admin/settings
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    // Default fallbacks if not yet initialized
    const defaultSettings: Record<string, string> = {
      org_name_th: 'วิทยาลัยอาชีวศึกษาเชียงราย',
      org_name_en: 'Chiang Rai Vocational College',
      org_address: 'ถนนบรรพปราการ ตำบลเวียง อำเภอเมืองเชียงราย จังหวัดเชียงราย 57000',
      org_phone: '053-711580',
      org_website: 'https://www.crvc.ac.th',
      org_logo_url: '',
      default_cert_prefix: 'วอศ.ชร-2569',
      default_signatory_name: 'ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย',
      default_signatory_title: 'ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย',
      default_signature_img: '',
      default_font_family: 'sarabun',
    };

    return res.json({
      success: true,
      data: {
        ...defaultSettings,
        ...settingsMap,
      },
    });
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า', error: error.message });
  }
});

// PUT /api/v1/admin/settings
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settingsPayload: Record<string, string> = req.body;

    for (const [key, value] of Object.entries(settingsPayload)) {
      if (typeof key === 'string' && value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    return res.json({
      success: true,
      message: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error saving system settings:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', error: error.message });
  }
});

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

// GET /api/v1/admin/users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        position: true,
        organization: true,
        is_active: true,
        created_at: true,
        _count: {
          select: { events: true },
        },
      },
    });

    return res.json({ success: true, data: serializeBigInt(users) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายชื่อผู้ใช้งาน', error: error.message });
  }
});

// POST /api/v1/admin/users - Create User
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, full_name, role, position, organization, is_active } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้ รหัสผ่าน และชื่อ-นามสกุลให้ครบถ้วน' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, ...(email ? [{ email: email.trim() }] : [])],
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้งานหรืออีเมลนี้มีอยู่ในระบบแล้ว' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password_hash: passwordHash,
        email: email ? email.trim() : null,
        full_name: full_name.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER',
        position: position ? position.trim() : null,
        organization: organization ? organization.trim() : 'วิทยาลัยอาชีวศึกษาเชียงราย',
        is_active: is_active !== false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        position: true,
        organization: true,
        is_active: true,
        created_at: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'สร้างบัญชีผู้ใช้งานสำเร็จ',
      data: serializeBigInt(newUser),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน', error: error.message });
  }
});

// PUT /api/v1/admin/users/:id - Update User
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = BigInt(req.params.id);
    const { full_name, email, role, position, organization, is_active, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งาน' });
    }

    // Check unique email if changing
    if (email && email.trim() !== existingUser.email) {
      const emailDup = await prisma.user.findFirst({
        where: { email: email.trim(), id: { not: userId } },
      });
      if (emailDup) {
        return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' });
      }
    }

    const updateData: any = {
      full_name: full_name ? full_name.trim() : existingUser.full_name,
      email: email !== undefined ? (email ? email.trim() : null) : existingUser.email,
      role: role !== undefined ? role : existingUser.role,
      position: position !== undefined ? (position ? position.trim() : null) : existingUser.position,
      organization: organization !== undefined ? (organization ? organization.trim() : null) : existingUser.organization,
      is_active: is_active !== undefined ? is_active : existingUser.is_active,
    };

    if (password && password.trim().length >= 6) {
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        position: true,
        organization: true,
        is_active: true,
        updated_at: true,
      },
    });

    return res.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
      data: serializeBigInt(updatedUser),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้งาน', error: error.message });
  }
});

// DELETE /api/v1/admin/users/:id - Delete User
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = BigInt(req.params.id);

    // Prevent self-deletion
    if (req.user!.id === userId) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้' });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { events: true } } },
    });

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานที่ต้องการลบ' });
    }

    if (userToDelete._count.events > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบผู้ใช้งานนี้ได้เนื่องจากมีกิจกรรมในระบบจำนวน ${userToDelete._count.events} รายการ (แนะนำให้ปิดการใช้งานแทน)`,
      });
    }

    await prisma.user.delete({ where: { id: userId } });

    return res.json({ success: true, message: 'ลบผู้ใช้งานเรียบร้อยแล้ว' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน', error: error.message });
  }
});

// ==========================================
// 3. MASTER SURVEY TEMPLATES MANAGEMENT
// ==========================================

// GET /api/v1/admin/evaluation-templates
router.get('/evaluation-templates', async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.evaluationTemplate.findMany({
      orderBy: { id: 'asc' },
    });
    return res.json({ success: true, data: serializeBigInt(templates) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงแม่แบบ', error: error.message });
  }
});

// POST /api/v1/admin/evaluation-templates - Create Template
router.post('/evaluation-templates', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, target_responses, theme_config, sections, is_default, is_active } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อแม่แบบแบบประเมิน' });
    }

    if (is_default) {
      await prisma.evaluationTemplate.updateMany({
        where: { is_default: true },
        data: { is_default: false },
      });
    }

    const template = await prisma.evaluationTemplate.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        category: category || 'GENERAL',
        target_responses: parseInt(target_responses) || 50,
        theme_config: theme_config || {},
        sections: sections || [],
        is_default: is_default ?? false,
        is_active: is_active ?? true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'สร้างแม่แบบแบบประเมินสำเร็จ',
      data: serializeBigInt(template),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างแม่แบบ', error: error.message });
  }
});

// PUT /api/v1/admin/evaluation-templates/:id - Update Template
router.put('/evaluation-templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const { title, description, category, target_responses, theme_config, sections, is_default, is_active } = req.body;

    const existing = await prisma.evaluationTemplate.findUnique({ where: { id: templateId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบแม่แบบที่ต้องการแก้ไข' });
    }

    if (is_default) {
      await prisma.evaluationTemplate.updateMany({
        where: { is_default: true, id: { not: templateId } },
        data: { is_default: false },
      });
    }

    const updated = await prisma.evaluationTemplate.update({
      where: { id: templateId },
      data: {
        title: title ? title.trim() : existing.title,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        category: category !== undefined ? category : existing.category,
        target_responses: target_responses !== undefined ? parseInt(target_responses) : existing.target_responses,
        theme_config: theme_config !== undefined ? theme_config : existing.theme_config,
        sections: sections !== undefined ? sections : existing.sections,
        is_default: is_default !== undefined ? is_default : existing.is_default,
        is_active: is_active !== undefined ? is_active : existing.is_active,
      },
    });

    return res.json({
      success: true,
      message: 'บันทึกแม่แบบแบบประเมินเรียบร้อยแล้ว',
      data: serializeBigInt(updated),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขแม่แบบ', error: error.message });
  }
});

// DELETE /api/v1/admin/evaluation-templates/:id - Delete Template
router.delete('/evaluation-templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    await prisma.evaluationTemplate.delete({ where: { id: templateId } });
    return res.json({ success: true, message: 'ลบแม่แบบแบบประเมินเรียบร้อยแล้ว' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบแม่แบบ', error: error.message });
  }
});

export default router;
