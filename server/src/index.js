// =======================================================
// MediCore HMS - Express Server Entrypoint
// Sri Lanka Hospital Management System
// Status: Active
// =======================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, db } from './db.js';
import { runAlignmentMigration } from './dbMigrationGuide.js';

// Step B1 fail-fast check: JWT_SECRET must be defined
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.trim().length < 16) {
  console.error('FATAL: JWT_SECRET missing or too short in server/.env. Server cannot start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers (Step E1 & Helmet-equivalent)
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
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clientOrigin = process.env.CLIENT_ORIGIN;
    if (!clientOrigin || clientOrigin === '*' || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app') || origin === clientOrigin) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Step E1: Brute Force Protection (max 10 failed login attempts per 5 minutes per IP)
const loginAttemptMap = new Map();
app.use('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttemptMap.get(ip) || [];
  // Filter attempts in the last 5 minutes (300,000 ms)
  const recentAttempts = attempts.filter(ts => now - ts < 5 * 60 * 1000);
  if (recentAttempts.length >= 10) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Please wait 5 minutes before trying again.'
    });
  }
  // Store reference to record attempt on failure
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

// Import API Router after verifying env
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

// Error handling middleware (Step E4: Sensitive data protection - suppress SQL and stack details)
app.use((err, req, res, next) => {
  console.error('[MediCore Server Error]:', err.message || err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected server error occurred.' : (err.message || 'Server error')
  });
});

// Startup
async function startServer() {
  await initDatabase();
  try {
    await runAlignmentMigration();
  } catch (migErr) {
    console.warn('[MediCore DB Alignment Notice]:', migErr.message);
  }

  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🏥 MediCore HMS Backend API Server is running!`);
    console.log(`📡 URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`💾 Database Mode: ${db.getMode().toUpperCase()}`);
    console.log(`🇱🇰 Tailored for Sri Lankan Healthcare Standards`);
    console.log(`====================================================`);
  });
}

startServer();
