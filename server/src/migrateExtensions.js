// =======================================================
// MediCore HMS - Database Extensions Migration
// Creates supplementary tables for Nursing, Prescriptions,
// Pharmacy Categories/Suppliers, and Notifications
// =======================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function migrateExtensions() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'medicore_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  console.log(`[MediCore Migration] Connecting to MySQL at ${host}:${port}...`);

  try {
    const conn = await mysql.createConnection({ host, user, password, database, port });

    // 1. Prescriptions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        record_id INT NULL,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        medicine_name VARCHAR(150) NOT NULL,
        dosage VARCHAR(50) NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        instructions TEXT NULL,
        dispense_status ENUM('Prescribed', 'Dispensed', 'Cancelled') DEFAULT 'Prescribed',
        dispensed_by VARCHAR(100) NULL,
        dispensed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Vital Signs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS vital_signs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        recorded_by_name VARCHAR(100) NOT NULL,
        temperature DECIMAL(4,1) NOT NULL DEFAULT 98.6,
        blood_pressure VARCHAR(20) NOT NULL DEFAULT '120/80',
        pulse INT NOT NULL DEFAULT 72,
        respiratory_rate INT NOT NULL DEFAULT 18,
        spo2 INT NOT NULL DEFAULT 98,
        notes TEXT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Nursing Notes Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS nursing_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        nurse_name VARCHAR(100) NOT NULL,
        notes TEXT NOT NULL,
        observations TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Medication Administration Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS medication_administration (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        medication_name VARCHAR(150) NOT NULL,
        scheduled_time VARCHAR(50) NOT NULL,
        status ENUM('Given', 'Scheduled', 'Missed', 'Refused') DEFAULT 'Scheduled',
        administered_by VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Pharmacy Suppliers Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pharmacy_suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_name VARCHAR(150) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Pharmacy Categories Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pharmacy_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. System Notifications Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_role VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed Suppliers if empty
    const [suppRows] = await conn.query('SELECT COUNT(*) as count FROM pharmacy_suppliers');
    if (suppRows[0].count === 0) {
      await conn.query(`
        INSERT INTO pharmacy_suppliers (supplier_name, contact_person, phone, email, address) VALUES
        ('State Pharmaceuticals Corporation (SPC)', 'Mr. Sunil Jayawardena', '+94 11 232 0356', 'procurement@spc.lk', '75 Sir Baron Jayathilaka Mawatha, Colombo 01'),
        ('Baurs Healthcare Sri Lanka', 'Ms. Dilrukshi Silva', '+94 11 472 8700', 'pharma@baurs.com', '621 Kandy Road, Kelaniya'),
        ('Hemas Pharmaceuticals (Pvt) Ltd', 'Mr. Rohan Alwis', '+94 11 473 1731', 'orders@hemas.com', 'Hemas House, Braybrooke Place, Colombo 02'),
        ('Emerchemie NB (Ceylon) Ltd', 'Dr. Mohan Weerakkody', '+94 11 268 9000', 'supplies@emerchemie.lk', '109 Kynsey Road, Colombo 08');
      `);
    }

    // Seed Pharmacy Categories if empty
    const [catRows] = await conn.query('SELECT COUNT(*) as count FROM pharmacy_categories');
    if (catRows[0].count === 0) {
      await conn.query(`
        INSERT INTO pharmacy_categories (category_name, description) VALUES
        ('Antibiotics', 'Broad and narrow spectrum antibacterial agents'),
        ('Cardiovascular', 'Antihypertensives, beta blockers, and statins'),
        ('Analgesics & Antipyretics', 'Pain relief and fever reduction medications'),
        ('Antidiabetics', 'Oral hypoglycemics and insulin formulations'),
        ('Respiratory', 'Bronchodilators, inhalers, and antihistamines'),
        ('Gastrointestinal', 'Proton pump inhibitors and antacids');
      `);
    }

    // Seed Prescriptions if empty
    const [rxRows] = await conn.query('SELECT COUNT(*) as count FROM prescriptions');
    if (rxRows[0].count === 0) {
      await conn.query(`
        INSERT INTO prescriptions (patient_id, doctor_id, medicine_name, dosage, frequency, duration, instructions, dispense_status) VALUES
        (1, 1, 'Atorvastatin 20mg', '20mg', 'Once daily at night', '30 days', 'Take after dinner. Monitor lipid profile.', 'Dispensed'),
        (1, 1, 'Amlodipine 5mg', '5mg', 'Once daily in the morning', '30 days', 'Take after breakfast.', 'Prescribed'),
        (2, 2, 'Amoxicillin 500mg', '500mg', 'Three times daily', '7 days', 'Complete full course after meals.', 'Prescribed'),
        (3, 1, 'Metformin 500mg', '500mg', 'Twice daily', '60 days', 'Take with meals.', 'Prescribed');
      `);
    }

    // Seed Vital Signs if empty
    const [vsRows] = await conn.query('SELECT COUNT(*) as count FROM vital_signs');
    if (vsRows[0].count === 0) {
      await conn.query(`
        INSERT INTO vital_signs (patient_id, recorded_by_name, temperature, blood_pressure, pulse, respiratory_rate, spo2, notes) VALUES
        (1, 'Nurse Kasun Wickrama', 98.4, '125/82', 74, 18, 99, 'Patient resting comfortably. Normal cardiac rhythm.'),
        (2, 'Nurse Kasun Wickrama', 99.1, '118/76', 80, 19, 98, 'Mild fever noted. Oral fluids encouraged.'),
        (3, 'Nurse Kasun Wickrama', 98.6, '130/85', 72, 16, 99, 'Routine pre-consultation vitals recorded.');
      `);
    }

    // Seed Nursing Notes if empty
    const [nnRows] = await conn.query('SELECT COUNT(*) as count FROM nursing_notes');
    if (nnRows[0].count === 0) {
      await conn.query(`
        INSERT INTO nursing_notes (patient_id, nurse_name, notes, observations) VALUES
        (1, 'Nurse Kasun Wickrama', 'Patient awake and oriented. Denies chest pain or shortness of breath.', 'Vitals stable. IV cannula site clean and patent.'),
        (2, 'Nurse Kasun Wickrama', 'Administered morning antibiotic dose. Patient tolerated oral intake well.', 'No adverse allergic reaction observed.');
      `);
    }

    // Seed Medication Administration if empty
    const [maRows] = await conn.query('SELECT COUNT(*) as count FROM medication_administration');
    if (maRows[0].count === 0) {
      await conn.query(`
        INSERT INTO medication_administration (patient_id, medication_name, scheduled_time, status, administered_by, notes) VALUES
        (1, 'Atorvastatin 20mg', '08:00 PM', 'Given', 'Nurse Kasun Wickrama', 'Given with water after dinner'),
        (1, 'Amlodipine 5mg', '08:00 AM', 'Given', 'Nurse Kasun Wickrama', 'BP checked beforehand (125/82)'),
        (2, 'Amoxicillin 500mg', '02:00 PM', 'Given', 'Nurse Kasun Wickrama', 'Dose 2 of 3 for the day'),
        (2, 'Amoxicillin 500mg', '10:00 PM', 'Scheduled', NULL, 'Pending evening ward round');
      `);
    }

    // Seed Notifications if empty
    const [notifRows] = await conn.query('SELECT COUNT(*) as count FROM notifications');
    if (notifRows[0].count === 0) {
      await conn.query(`
        INSERT INTO notifications (target_role, title, message, type) VALUES
        ('All', 'System Maintenance Notice', 'Automated database backups scheduled daily at 02:00 AM.', 'system'),
        ('Administrator', 'New User Registration', 'Account created for Dr. Kanishka Silva (Cardiology).', 'auth'),
        ('Doctor', 'Laboratory Result Ready', 'Full Blood Count (FBC) result ready for Patient #1001.', 'lab'),
        ('Doctor', 'New Appointment Scheduled', 'Rashmi Wickramasinghe booked token #4 for today.', 'appointment'),
        ('Nurse', 'Vitals Check Due', 'Ward 03 Bed 01 requires 2:00 PM vitals measurement.', 'system'),
        ('Receptionist', 'New Patient Check-in', 'Patient #1002 marked as arrived for Consultation.', 'appointment'),
        ('Laboratory Staff', 'Pending Test Order', 'Urgent Dengue NS1 test requested for OPD patient.', 'lab'),
        ('Pharmacist', 'Low Stock Alert', 'Paracetamol 500mg inventory below reorder threshold (18 remaining).', 'pharmacy'),
        ('Pharmacist', 'New Prescription Issued', 'Dr. Rohan issued prescription for Patient #1001.', 'prescription'),
        ('Accountant', 'Outstanding Balance Alert', 'Invoice #MC-INV-2026-004 has outstanding balance of Rs. 4,500.', 'billing');
      `);
    }

    console.log('[MediCore Migration] Extension tables successfully created and seeded!');
    await conn.end();
  } catch (err) {
    console.error('[MediCore Migration Error]:', err.message);
  }
}

migrateExtensions();
