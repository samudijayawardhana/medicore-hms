// =======================================================
// MediCore HMS - Schema Alignment Migration Script
// Aligns medicore_db with the 12-Module Guide Specifications
// =======================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export async function runAlignmentMigration() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'medicore_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  console.log(`[MediCore Alignment] Checking MySQL database at ${host}:${port}...`);
  const conn = await mysql.createConnection({ host, user, password, database, port });

  async function addColumnIfNotExists(table, column, definition) {
    try {
      const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
      if (cols.length === 0) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`  + Added column \`${column}\` to \`${table}\``);
      }
    } catch (err) {
      console.warn(`  Notice for ${table}.${column}:`, err.message);
    }
  }

  try {
    // 1. Align Patients table
    console.log('[MediCore Alignment] Aligning patients table...');
    await addColumnIfNotExists('patients', 'patient_no', 'VARCHAR(30) NULL');
    await addColumnIfNotExists('patients', 'full_name', 'VARCHAR(150) NULL');
    await addColumnIfNotExists('patients', 'district', 'VARCHAR(50) DEFAULT "Colombo"');
    await addColumnIfNotExists('patients', 'emergency_contact_name', 'VARCHAR(100) NULL');
    await addColumnIfNotExists('patients', 'emergency_contact_phone', 'VARCHAR(30) NULL');
    await addColumnIfNotExists('patients', 'emergency_contact_relationship', 'VARCHAR(50) NULL');
    await addColumnIfNotExists('patients', 'allergies', 'TEXT NULL');
    await addColumnIfNotExists('patients', 'medical_notes', 'TEXT NULL');
    await addColumnIfNotExists('patients', 'status', 'VARCHAR(30) DEFAULT "Active"');

    // Populate full_name and patient_no if empty
    await conn.query(`
      UPDATE patients 
      SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))),
          patient_no = COALESCE(patient_no, patient_code, CONCAT('PAT-2026-', LPAD(id, 4, '0')))
      WHERE full_name IS NULL OR full_name = '' OR patient_no IS NULL;
    `);

    // 2. Align Appointments table
    console.log('[MediCore Alignment] Aligning appointments table...');
    await addColumnIfNotExists('appointments', 'cancel_reason', 'VARCHAR(255) NULL');
    await addColumnIfNotExists('appointments', 'appointment_no', 'VARCHAR(30) NULL');
    await addColumnIfNotExists('appointments', 'fee', 'DECIMAL(10,2) DEFAULT 3000.00');

    // 3. Align Doctors table
    console.log('[MediCore Alignment] Aligning doctors table...');
    await addColumnIfNotExists('doctors', 'full_name', 'VARCHAR(120) NULL');
    await addColumnIfNotExists('doctors', 'slmc_reg_no', 'VARCHAR(50) NULL');
    await addColumnIfNotExists('doctors', 'available_days', 'VARCHAR(100) DEFAULT "Mon, Tue, Wed, Thu, Fri"');
    await addColumnIfNotExists('doctors', 'available_time_slot', 'VARCHAR(50) DEFAULT "04:30 PM - 08:30 PM"');
    await addColumnIfNotExists('doctors', 'max_tokens', 'INT DEFAULT 30');

    // 4. Align Medical Records table
    console.log('[MediCore Alignment] Aligning medical_records table...');
    await addColumnIfNotExists('medical_records', 'bp', 'VARCHAR(20) DEFAULT "120/80"');
    await addColumnIfNotExists('medical_records', 'pulse', 'INT DEFAULT 72');
    await addColumnIfNotExists('medical_records', 'temperature_f', 'DECIMAL(4,1) DEFAULT 98.6');
    await addColumnIfNotExists('medical_records', 'weight_kg', 'DECIMAL(5,1) DEFAULT 65.0');
    await addColumnIfNotExists('medical_records', 'spo2_percent', 'INT DEFAULT 98');
    await addColumnIfNotExists('medical_records', 'doctor_notes', 'TEXT NULL');

    // 5. Align Billing Invoices table
    console.log('[MediCore Alignment] Aligning billing_invoices table...');
    await addColumnIfNotExists('billing_invoices', 'bill_no', 'VARCHAR(30) NULL');
    await addColumnIfNotExists('billing_invoices', 'consultation_fee', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('billing_invoices', 'laboratory_charges', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('billing_invoices', 'pharmacy_charges', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('billing_invoices', 'admission_charges', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('billing_invoices', 'discount_lkr', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('billing_invoices', 'payment_method', 'VARCHAR(50) DEFAULT "Cash"');
    await addColumnIfNotExists('billing_invoices', 'receipt_number', 'VARCHAR(50) NULL');

    // 5b. Align Admissions table
    console.log('[MediCore Alignment] Aligning admissions table...');
    await addColumnIfNotExists('admissions', 'daily_rate_lkr', 'DECIMAL(10,2) DEFAULT 3800.00');

    // 6. Ensure Leaves table exists
    console.log('[MediCore Alignment] Ensuring staff leaves table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS staff_leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(255) NOT NULL,
        leave_type VARCHAR(50) DEFAULT 'Annual',
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        approved_by VARCHAR(100) NULL,
        rejection_reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Ensure Patient Documents table exists
    console.log('[MediCore Alignment] Ensuring patient_documents table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS patient_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'other',
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INT DEFAULT 0,
        uploaded_by VARCHAR(100) NOT NULL,
        file_path VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('[MediCore Alignment] Database alignment completed successfully!');
    await conn.end();
    return true;
  } catch (err) {
    console.error('[MediCore Alignment Error]:', err.message);
    await conn.end();
    throw err;
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('dbMigrationGuide.js')) {
  runAlignmentMigration().catch(console.error);
}
