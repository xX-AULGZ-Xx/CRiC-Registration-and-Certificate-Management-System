import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: bigint;
    username: string;
    role: string;
    full_name: string;
    email?: string | null;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'reg-cert-mgmt-system-secret-key-2026';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) },
      select: { id: true, username: true, role: true, full_name: true, email: true, is_active: true },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'บัญชีผู้ใช้งานไม่ถูกต้องหรือถูกระงับ' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ (เฉพาะผู้ดูแลระบบ)' });
  }
  next();
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) },
      select: { id: true, username: true, role: true, full_name: true, email: true, is_active: true },
    });

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
      };
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
};
