// =======================================================
// MediCore HMS - Express Server Application
// Reusable app instance for Local Server & Serverless (Vercel)
// =======================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Fallback JWT_SECRET for serverless deployments
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 16) {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'medicore-hms-sri-lanka-jwt-production-secret-2026';
}

const app = express();

// Security Headers (Helmet-equivalent)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Brute Force Protection (max 10 failed login attempts per 5 minutes per IP)
const loginAttemptMap = new Map();
app.use('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttemptMap.get(ip) || [];
  const recentAttempts = attempts.filter(ts => now - ts < 5 * 60 * 1000);
  if (recentAttempts.length >= 10) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Please wait 5 minutes before trying again.'
    });
  }
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 400) {
      recentAttempts.push(Date.now());
      loginAttemptMap.set(ip, recentAttempts);
    } else if (res.statusCode === 200) {
      loginAttemptMap.delete(ip);
    }
  });
  next();
});

// Import API Router
const { router: apiRouter } = await import('./routes/api.js');

// API Routes
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'MediCore Hospital Management System (HMS) - Sri Lanka',
    version: '1.0.0',
    documentation: '/api/system/status'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[MediCore Server Error]:', err.message || err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected server error occurred.' : (err.message || 'Server error')
  });
});

export default app;
