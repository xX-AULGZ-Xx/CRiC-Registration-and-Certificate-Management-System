import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import authRouter from './modules/auth/auth.controller';
import eventRouter from './modules/events/event.controller';
import registrationRouter from './modules/registration/registration.controller';
import evaluationRouter from './modules/evaluation/evaluation.controller';
import certificateRouter from './modules/certificates/certificate.controller';
import adminRouter from './modules/admin/admin.controller';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 5060;
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || '../../storage');

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3006', 'http://localhost:3000', 'http://127.0.0.1:3006'];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file storage for certificates and signatures
app.use('/storage', express.static(STORAGE_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Registration and Certificate Management System',
    timestamp: new Date().toISOString(),
  });
});

// Public system branding settings endpoint (for Navbar logo, Favicon, footer)
app.get('/api/v1/system/public-settings', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['org_name_th', 'org_name_en', 'org_logo_url', 'org_website', 'google_client_id', 'google_login_enabled'],
        },
      },
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return res.json({
      success: true,
      data: {
        org_name_th: map['org_name_th'] || 'วิทยาลัยอาชีวศึกษาเชียงราย',
        org_name_en: map['org_name_en'] || 'Chiang Rai Vocational College',
        org_logo_url: map['org_logo_url'] || '',
        org_website: map['org_website'] || 'https://www.crvc.ac.th',
        google_client_id: map['google_client_id'] || process.env.GOOGLE_CLIENT_ID || '',
        google_login_enabled: map['google_login_enabled'] !== 'false',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Dynamic Favicon serving endpoint (serves the uploaded organization logo)
app.get('/api/v1/system/favicon.ico', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'org_logo_url' },
    });
    if (setting?.value) {
      const relativePath = setting.value.replace(/^\/storage\//, '');
      const filePath = path.resolve(STORAGE_DIR, relativePath);
      if (fs.existsSync(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.sendFile(filePath);
      }
    }
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/registration', registrationRouter);
app.use('/api/v1/evaluation', evaluationRouter);
app.use('/api/v1/certificates', certificateRouter);
app.use('/api/v1/admin', adminRouter);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Registration & Certificate API Server running on http://localhost:${PORT}`);
  console.log(`📂 Storage directory: ${STORAGE_DIR}`);
});
