import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'reg-cert-mgmt-system-secret-key-2026';
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || '../../storage');
const SIGNATURES_DIR = path.join(STORAGE_DIR, 'signatures');

if (!fs.existsSync(SIGNATURES_DIR)) {
  fs.mkdirSync(SIGNATURES_DIR, { recursive: true });
}

const sigStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SIGNATURES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `sig-${uniqueSuffix}${ext}`);
  },
});

const uploadSig = multer({
  storage: sigStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) เท่านั้น'));
    }
  },
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: username.trim() }],
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        token,
        user: serializeBigInt({
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          position: user.position,
          organization: user.organization,
          signature_img: user.signature_img,
        }),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message });
  }
});

// POST /api/v1/auth/google (Google SSO Login & Auto-registration)
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูล Google Credential' });
    }

    // 1. Verify Google token with Google's tokeninfo API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return res.status(401).json({
        success: false,
        message: 'การตรวจสอบข้อมูลกับ Google ล้มเหลว กรุณาลองใหม่อีกครั้ง',
      });
    }

    const payload: any = await googleRes.json();
    const { email, email_verified, name } = payload;

    if (!email || (email_verified !== 'true' && email_verified !== true)) {
      return res.status(400).json({ success: false, message: 'อีเมล Google บัญชีนี้ยังไม่ได้รับการยืนยันความถูกต้อง' });
    }

    // 2. Fetch System Settings for Google SSO
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['google_login_enabled', 'google_client_id', 'google_auto_register'] },
      },
    });
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    if (settingsMap.google_login_enabled === 'false') {
      return res.status(403).json({ success: false, message: 'ระบบปิดการเข้าสู่ระบบด้วย Google ชั่วคราว' });
    }

    // 3. Find user by email or username
    const normalizedEmail = email.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedEmail }],
      },
    });

    if (!user) {
      // Check if auto register is enabled (defaults to true)
      const autoRegister = settingsMap.google_auto_register !== 'false';
      if (!autoRegister) {
        return res.status(403).json({
          success: false,
          message: `ไม่พบบัญชีผู้ใช้ที่ผูกกับอีเมล ${normalizedEmail} ในระบบ กรุณาติดต่อผู้ดูแลระบบ`,
        });
      }

      // Generate a clean unique username
      const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
      let usernameCandidate = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: usernameCandidate } })) {
        usernameCandidate = `${baseUsername.slice(0, 24)}_${counter}`;
        counter++;
      }

      // Random secure password hash
      const randomSecret = Math.random().toString(36).slice(-8) + Date.now().toString(36);
      const randomPasswordHash = await bcrypt.hash(randomSecret, 10);

      user = await prisma.user.create({
        data: {
          username: usernameCandidate,
          password_hash: randomPasswordHash,
          email: normalizedEmail,
          full_name: name || normalizedEmail.split('@')[0],
          role: 'ORGANIZER',
          organization: 'วิทยาลัยอาชีวศึกษาเชียงราย',
          position: 'ผู้จัดกิจกรรม',
          is_active: true,
        },
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'เข้าสู่ระบบด้วย Google สำเร็จ',
      data: {
        token,
        user: serializeBigInt({
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          position: user.position,
          organization: user.organization,
          signature_img: user.signature_img,
        }),
      },
    });
  } catch (error: any) {
    console.error('Google SSO error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการประมวลผล Google SSO', error: error.message });
  }
});

// POST /api/v1/auth/register (First Admin setup or Admin creates new Organizer)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, full_name, email, role, position, organization } = req.body;
    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    const userCount = await prisma.user.count();
    // If users already exist, only authenticated admin can register new users
    if (userCount > 0) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มผู้ใช้งานใหม่ได้' });
      }
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์สร้างผู้ใช้งานใหม่' });
        }
      } catch {
        return res.status(401).json({ success: false, message: 'เซสชันไม่ถูกต้อง' });
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, ...(email ? [{ email: email.trim() }] : [])],
      },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้งานหรืออีเมลนี้มีอยู่ในระบบแล้ว' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const assignedRole = userCount === 0 ? 'ADMIN' : (role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER');

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password_hash,
        email: email ? email.trim() : null,
        full_name: full_name.trim(),
        role: assignedRole,
        position: position || null,
        organization: organization || 'วิทยาลัยอาชีวศึกษาเชียงราย',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้งานสำเร็จ',
      data: serializeBigInt({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        position: newUser.position,
        organization: newUser.organization,
      }),
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน', error: error.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        position: true,
        organization: true,
        signature_img: true,
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }

    return res.json({ success: true, data: serializeBigInt(user) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// PUT /api/v1/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, email, position, organization, password } = req.body;

    const dataToUpdate: any = {};
    if (full_name) dataToUpdate.full_name = full_name.trim();
    if (email !== undefined) dataToUpdate.email = email ? email.trim() : null;
    if (position !== undefined) dataToUpdate.position = position;
    if (organization !== undefined) dataToUpdate.organization = organization;
    if (password && password.trim().length >= 6) {
      dataToUpdate.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        position: true,
        organization: true,
        signature_img: true,
      },
    });

    return res.json({ success: true, message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ', data: serializeBigInt(updated) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลได้', error: error.message });
  }
});

// POST /api/v1/auth/signature
router.post('/signature', authenticate, uploadSig.single('signature'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'ไม่พบไฟล์รูปภาพลายเซ็น' });
    }

    const sigUrl = `/storage/signatures/${req.file.filename}`;
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { signature_img: sigUrl },
    });

    return res.json({ success: true, message: 'อัปโหลดลายเซ็นสำเร็จ', data: { signature_url: sigUrl } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น', error: error.message });
  }
});

// GET /api/v1/auth/users (Admin only)
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
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
        _count: { select: { events: true } },
      },
    });

    return res.json({ success: true, data: serializeBigInt(users) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

export default router;
