// =======================================================
// MediCore HMS - Express Server Entrypoint
// Sri Lanka Hospital Management System
// Status: Active
// =======================================================

import 'dotenv/config';
import app from './app.js';
import { initDatabase, db } from './db.js';
import { runAlignmentMigration } from './dbMigrationGuide.js';

const PORT = process.env.PORT || 5000;

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
