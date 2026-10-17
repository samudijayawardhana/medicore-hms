-- =======================================================
-- MediCore Hospital Management System (HMS) - Sri Lanka
-- MySQL Relational Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB
-- =======================================================

CREATE DATABASE IF NOT EXISTS `medicore_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `medicore_db`;

-- 1. Users & Roles (RBAC)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `role` ENUM('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Laboratory Staff', 'Pharmacist', 'Accountant') NOT NULL,
  `phone` VARCHAR(20),
  `department` VARCHAR(50),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Patients Module (Optimized for Sri Lanka: NIC, Districts, Phone)
CREATE TABLE IF NOT EXISTS `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_no` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(120) NOT NULL,
  `nic` VARCHAR(20) NOT NULL,
  `dob` DATE NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `blood_group` VARCHAR(10),
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100),
  `address` TEXT,
  `district` VARCHAR(50) DEFAULT 'Colombo',
  `emergency_contact_name` VARCHAR(100),
  `emergency_contact_phone` VARCHAR(20),
  `allergies` TEXT,
  `medical_notes` TEXT,
  `status` ENUM('Active', 'Inpatient', 'Discharged', 'Deceased') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Doctors Module (SLMC Registration, Consultation Fees in LKR)
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(120) NOT NULL,
  `slmc_reg_no` VARCHAR(30) NOT NULL UNIQUE,
  `specialization` VARCHAR(100) NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `qualification` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `room_number` VARCHAR(20),
  `consultation_fee` DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  `available_days` VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  `available_time_slot` VARCHAR(50) DEFAULT '04:00 PM - 08:00 PM',
  `max_tokens` INT DEFAULT 30,
  `status` ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Appointment & Channelling Management
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_no` VARCHAR(30) NOT NULL UNIQUE,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `appointment_date` DATE NOT NULL,
  `time_slot` VARCHAR(50) NOT NULL,
  `token_number` INT NOT NULL,
  `status` ENUM('Scheduled', 'Checked-in', 'In Consultation', 'Completed', 'Cancelled', 'Rescheduled') DEFAULT 'Scheduled',
  `reason` VARCHAR(255),
  `fee` DECIMAL(10,2) NOT NULL,
  `payment_status` ENUM('Pending', 'Paid', 'Refunded') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Electronic Medical Records (EMR)
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `appointment_id` INT,
  `visit_date` DATE NOT NULL,
  `symptoms` TEXT,
  `diagnosis` TEXT NOT NULL,
  `treatment_plan` TEXT,
  `bp` VARCHAR(20),
  `pulse` INT,
  `temperature_f` DECIMAL(4,1),
  `weight_kg` DECIMAL(5,1),
  `spo2_percent` INT,
  `doctor_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Prescriptions (linked to Medical Records & Pharmacy)
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `record_id` INT,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `medicine_name` VARCHAR(120) NOT NULL,
  `dosage` VARCHAR(50) NOT NULL,
  `frequency` VARCHAR(50) NOT NULL,
  `duration` VARCHAR(50) NOT NULL,
  `instructions` VARCHAR(255),
  `dispense_status` ENUM('Prescribed', 'Dispensed', 'Cancelled') DEFAULT 'Prescribed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Pharmacy Inventory & Stock Management
CREATE TABLE IF NOT EXISTS `pharmacy_medicines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `brand_name` VARCHAR(100) NOT NULL,
  `generic_name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50),
  `dosage_form` VARCHAR(30),
  `strength` VARCHAR(50),
  `batch_no` VARCHAR(50) NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `reorder_level` INT NOT NULL DEFAULT 20,
  `unit_price_lkr` DECIMAL(10,2) NOT NULL,
  `expiry_date` DATE NOT NULL,
  `manufacturer` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Laboratory Tests Catalog & Orders
CREATE TABLE IF NOT EXISTS `lab_tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `test_code` VARCHAR(20) NOT NULL UNIQUE,
  `test_name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `price_lkr` DECIMAL(10,2) NOT NULL,
  `normal_range` VARCHAR(100),
  `turn_around_hours` INT DEFAULT 6
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lab_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(30) NOT NULL UNIQUE,
  `patient_id` INT NOT NULL,
  `doctor_id` INT,
  `test_id` INT NOT NULL,
  `sample_type` VARCHAR(50) DEFAULT 'Blood',
  `sample_status` ENUM('Pending', 'Collected', 'In Lab') DEFAULT 'Pending',
  `result_value` VARCHAR(255),
  `result_status` ENUM('Pending', 'Normal', 'Abnormal', 'Critical') DEFAULT 'Pending',
  `comments` TEXT,
  `performed_by` VARCHAR(100),
  `test_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_id`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Inpatient & Ward Management
CREATE TABLE IF NOT EXISTS `inpatient_admissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admission_no` VARCHAR(30) NOT NULL UNIQUE,
  `patient_id` INT NOT NULL,
  `ward` VARCHAR(50) NOT NULL,
  `bed_no` VARCHAR(20) NOT NULL,
  `admission_date` DATE NOT NULL,
  `discharge_date` DATE,
  `primary_doctor_id` INT NOT NULL,
  `reason` VARCHAR(255),
  `status` ENUM('Admitted', 'Discharged', 'Transferred') DEFAULT 'Admitted',
  `daily_rate_lkr` DECIMAL(10,2) DEFAULT 3500.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`primary_doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Billing and Invoicing (LKR, Tax, Insurance)
CREATE TABLE IF NOT EXISTS `bills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bill_no` VARCHAR(30) NOT NULL UNIQUE,
  `patient_id` INT NOT NULL,
  `bill_date` DATE NOT NULL,
  `consultation_fee` DECIMAL(10,2) DEFAULT 0.00,
  `laboratory_charges` DECIMAL(10,2) DEFAULT 0.00,
  `pharmacy_charges` DECIMAL(10,2) DEFAULT 0.00,
  `admission_charges` DECIMAL(10,2) DEFAULT 0.00,
  `discount_lkr` DECIMAL(10,2) DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('Cash', 'Credit Card', 'Debit Card', 'Health Insurance', 'Online Transfer') DEFAULT 'Cash',
  `insurance_provider` VARCHAR(100),
  `status` ENUM('Unpaid', 'Paid', 'Partially Paid', 'Cancelled') DEFAULT 'Paid',
  `notes` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Staff Management
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `emp_no` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `nic` VARCHAR(20) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `designation` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100),
  `join_date` DATE NOT NULL,
  `status` ENUM('Active', 'On Leave', 'Resigned') DEFAULT 'Active',
  `salary_lkr` DECIMAL(10,2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `staff_attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `check_in` TIME,
  `check_out` TIME,
  `status` ENUM('Present', 'Late', 'Half Day', 'Absent', 'On Leave') DEFAULT 'Present',
  `remarks` VARCHAR(255),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `username` VARCHAR(50),
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
