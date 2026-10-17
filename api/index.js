// =======================================================
// MediCore HMS - Vercel Serverless Function Entrypoint
// Handles all /api/* requests on Vercel
// =======================================================

import app from '../server/src/app.js';
import { initDatabase } from '../server/src/db.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
    } catch (err) {
      console.warn('[Vercel DB Init Notice]:', err.message);
    }
    isDbInitialized = true;
  }
  return app(req, res);
}
