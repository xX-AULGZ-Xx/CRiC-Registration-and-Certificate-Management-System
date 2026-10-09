import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRouter from './modules/auth/auth.controller';
import eventRouter from './modules/events/event.controller';
import registrationRouter from './modules/registration/registration.controller';
import evaluationRouter from './modules/evaluation/evaluation.controller';
import certificateRouter from './modules/certificates/certificate.controller';

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

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/registration', registrationRouter);
app.use('/api/v1/evaluation', evaluationRouter);
app.use('/api/v1/certificates', certificateRouter);

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
