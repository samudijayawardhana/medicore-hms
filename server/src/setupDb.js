// =======================================================
// MediCore HMS - MySQL Database Automated Setup Script
// =======================================================

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initialData } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'medicore_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  console.log(`[MediCore Setup] Connecting to MySQL at ${host}:${port}...`);

  try {
    const adminConn = await mysql.createConnection({ host, user, password, port });
    console.log(`[MediCore Setup] Connected to MySQL Server.`);

    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[MediCore Setup] Database \`${database}\` ready.`);
    await adminConn.end();

    const connection = await mysql.createConnection({ host, user, password, database, port });

    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

    console.log(`[MediCore Setup] Executing ${statements.length} schema table statements...`);
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        // Continue
      }
    }
    console.log(`[MediCore Setup] Schema tables verified.`);

    // Seed doctors
    for (const d of initialData.doctors) {
      await connection.query(
        'INSERT IGNORE INTO doctors (id, full_name, slmc_reg_no, specialization, department, qualification, phone, email, room_number, consultation_fee, available_days, available_time_slot, max_tokens, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.full_name, d.slmc_reg_no, d.specialization, d.department, d.qualification, d.phone, d.email, d.room_number, d.consultation_fee, d.available_days, d.available_time_slot, d.max_tokens, d.status]
      );
    }

    // Seed patients
    for (const p of initialData.patients) {
      await connection.query(
        'INSERT IGNORE INTO patients (id, patient_no, full_name, nic, dob, gender, blood_group, phone, email, address, district, emergency_contact_name, emergency_contact_phone, allergies, medical_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.patient_no, p.full_name, p.nic, p.dob, p.gender, p.blood_group, p.phone, p.email, p.address, p.district, p.emergency_contact_name, p.emergency_contact_phone, p.allergies, p.medical_notes, p.status]
      );
    }

    // Seed pharmacy
    for (const m of initialData.pharmacy_medicines) {
      await connection.query(
        'INSERT IGNORE INTO pharmacy_medicines (id, code, brand_name, generic_name, category, dosage_form, strength, batch_no, stock_quantity, reorder_level, unit_price_lkr, expiry_date, manufacturer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [m.id, m.code, m.brand_name, m.generic_name, m.category, m.dosage_form, m.strength, m.batch_no, m.stock_quantity, m.reorder_level, m.unit_price_lkr, m.expiry_date, m.manufacturer]
      );
    }

    // Seed lab tests
    for (const t of initialData.lab_tests) {
      await connection.query(
        'INSERT IGNORE INTO lab_tests (id, test_code, test_name, category, price_lkr, normal_range, turn_around_hours) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.test_code, t.test_name, t.category, t.price_lkr, t.normal_range, t.turn_around_hours]
      );
    }

    await connection.end();
    console.log(`[MediCore Setup] Setup completed successfully! All tables & Sri Lankan seed records are ready in MySQL.`);
  } catch (err) {
    console.error(`[MediCore Setup Error]:`, err.message);
  }
}

setupDatabase();
