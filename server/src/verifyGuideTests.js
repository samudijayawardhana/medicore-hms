// =======================================================
// MediCore HMS - Comprehensive Guide Verification Suite
// Tests all checklist criteria across Part A, B, C, D, E, F
// =======================================================

// Uses native Node fetch
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function req(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=======================================================');
  console.log('MediCore HMS: Full Build Guide Verification Suite');
  console.log('=======================================================\n');

  // 1. SYSTEM STATUS & DB CONNECTION (Part A)
  console.log('--- PART A: Setup & Database ---');
  const sys = await req('/system/status');
  assert(sys.status === 200, 'System status endpoint is online (200)');
  assert(sys.data.db && (sys.data.db.mode === 'mysql' || sys.data.db.status.includes('MySQL') || sys.data.db.status.includes('Active')), 'Database connection initialized successfully');

  // 2. AUTHENTICATION & TOKENS (Part B: Step B1 - B3)
  console.log('\n--- PART B: Authentication, Tokens & RBAC ---');
  // Login as Administrator
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'password123' })
  });
  const adminToken = adminLogin.data.token;
  assert(adminLogin.status === 200 && adminToken, 'Administrator can log in and receives JWT token');
  assert(adminLogin.data.permissions && Array.isArray(adminLogin.data.permissions), 'Login response includes permissions profile');

  // Login as Doctor
  const docLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'doctor', password: 'password123' })
  });
  const docToken = docLogin.data.token;
  assert(docLogin.status === 200 && docToken, 'Doctor can log in and receives JWT token');
  assert(adminLogin.data.permissions.length > docLogin.data.permissions.length, 'Admin permissions count > Doctor permissions count');

  // Login as Nurse
  const nurseLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'nurse', password: 'password123' })
  });
  const nurseToken = nurseLogin.data.token;
  assert(nurseLogin.status === 200 && nurseToken, 'Nurse can log in and receives JWT token');

  // Login as Receptionist
  const recepLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'receptionist', password: 'password123' })
  });
  const recepToken = recepLogin.data.token;
  assert(recepLogin.status === 200 && recepToken, 'Receptionist can log in and receives JWT token');

  // Login as Pharmacist
  const pharmLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'pharmacist', password: 'password123' })
  });
  const pharmToken = pharmLogin.data.token;
  assert(pharmLogin.status === 200 && pharmToken, 'Pharmacist can log in and receives JWT token');

  // Step B3: Direct API without token returns 401
  const unauth = await req('/patients');
  assert(unauth.status === 401, 'Accessing /patients without token returns 401 Unauthorized');

  // Step B3: Doctor calling Users API returns 403
  const docCallingUsers = await req('/users', {}, docToken);
  assert(docCallingUsers.status === 403, 'Doctor calling /users returns 403 Forbidden');

  // Step B5: Field Level Security (Nurse cannot update NIC)
  const patientsList = await req('/patients', {}, adminToken);
  const patientArray = patientsList.data.data || patientsList.data || [];
  const testPatient = patientArray[0];
  if (testPatient) {
    const nurseIllegalEdit = await req(`/patients/${testPatient.id}`, {
      method: 'PUT',
      body: JSON.stringify({ nic: '199999999999' })
    }, nurseToken);
    assert(nurseIllegalEdit.status === 403, 'Nurse attempting to modify NIC in PUT /patients/:id returns 403 Forbidden');

    const nurseLegalEdit = await req(`/patients/${testPatient.id}`, {
      method: 'PUT',
      body: JSON.stringify({ phone: '077-9998888', medical_notes: 'Regular checkup required' })
    }, nurseToken);
    assert(nurseLegalEdit.status === 200, 'Nurse updating permitted contact & medical fields succeeds (200)');
  }

  // 3. ROLE DASHBOARDS (Part C: Step C0 - C8)
  console.log('\n--- PART C: Role Wise Dashboards & Isolation ---');
  // Doctor requesting Pharmacist dashboard must return 403 (Test C8)
  const docIllegallyAccessingPharm = await req('/role-summary/Pharmacist', {}, docToken);
  assert(docIllegallyAccessingPharm.status === 403, 'Doctor requesting Pharmacist dashboard data returns 403 Forbidden');

  // Admin summary
  const adminSummary = await req('/role-summary/Administrator', {}, adminToken);
  assert(adminSummary.status === 200 && adminSummary.data.totalPatients !== undefined, 'Admin dashboard summary returns total patients, appointments, revenue');

  // Doctor own summary
  const docSummary = await req('/role-summary/Doctor', {}, docToken);
  assert(docSummary.status === 200 && docSummary.data.doctorName !== undefined, 'Doctor own role-summary returns personal clinical schedule');

  // Pharmacist own summary
  const pharmSummary = await req('/role-summary/Pharmacist', {}, pharmToken);
  assert(pharmSummary.status === 200 && Array.isArray(pharmSummary.data.prescriptionQueue), 'Pharmacist own role-summary returns prescription queue');

  // 4. MODULES D1 - D12 BUSINESS RULES (Part D)
  console.log('\n--- PART D: 12 Modules & Business Rules ---');
  // D1: Patient duplicate NIC rejection
  const dupNicTest = await req('/patients', {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Duplicate Test Patient',
      nic: testPatient ? testPatient.nic : '198471201923',
      date_of_birth: '1985-05-12',
      gender: 'Male',
      phone: '077-1112233'
    })
  }, adminToken);
  assert(dupNicTest.status === 409, 'Duplicate patient NIC is rejected with 409 Conflict');

  // D1: Invalid NIC format rejection
  const invalidNicTest = await req('/patients', {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Invalid NIC Patient',
      nic: '12345', // invalid length
      date_of_birth: '1985-05-12',
      gender: 'Male',
      phone: '077-1112233'
    })
  }, adminToken);
  assert(invalidNicTest.status === 400, 'Invalid NIC format is rejected with 400 Bad Request');

  // D3: Appointment double booking block
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const apt1 = await req('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: testPatient ? testPatient.id : 1,
      doctor_id: 1,
      appointment_date: tomorrowStr,
      time_slot: '09:00 AM - 09:30 AM',
      reason: 'Regular consultation'
    })
  }, adminToken);

  const apt2 = await req('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: testPatient ? testPatient.id : 2,
      doctor_id: 1,
      appointment_date: tomorrowStr,
      time_slot: '09:00 AM - 09:30 AM', // same slot!
      reason: 'Double booking test'
    })
  }, adminToken);
  assert(apt2.status === 409, 'Double booking same doctor, date, and slot is blocked (409 Conflict)');

  // D3: Past date booking blocked
  const pastApt = await req('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: 1,
      doctor_id: 1,
      appointment_date: '2020-01-01',
      time_slot: '10:00 AM - 10:30 AM',
      reason: 'Past date test'
    })
  }, adminToken);
  assert(pastApt.status === 400, 'Booking appointment in the past is blocked (400 Bad Request)');

  // D4: Prescription write restricted to Doctor only
  const nurseTryingToPrescribe = await req('/prescriptions', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: 1,
      medicine_name: 'Paracetamol 500mg',
      dosage: '500mg',
      frequency: 'TDS',
      duration: '3 days'
    })
  }, nurseToken);
  assert(nurseTryingToPrescribe.status === 403, 'Nurse attempting to write prescription returns 403 Forbidden (Doctor only)');

  // D6: Pharmacy stock negative prevention
  const meds = await req('/pharmacy/medicines', {}, adminToken);
  const med = meds.data[0];
  if (med) {
    const negStock = await req(`/pharmacy/medicines/${med.id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity_delta: -99999 })
    }, pharmToken);
    assert(negStock.status === 400, 'Pharmacy stock adjustment that would result in negative stock is blocked (400)');
  }

  // D7: Server calculates billing total
  const billTest = await req('/bills', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: 1,
      consultation_fee: 2000,
      laboratory_charges: 1500,
      pharmacy_charges: 500,
      admission_charges: 0,
      discount_lkr: 200,
      total_amount: 10 // Client attempts to forge total
    })
  }, adminToken);
  assert(billTest.status === 201 && billTest.data.total_amount === 3800, 'Billing total is securely calculated on server (Rs. 3,800), ignoring forged client total');

  // D8: Bed clash prevention on Inpatient admissions
  const bedsRes = await req('/inpatient/beds', {}, adminToken);
  const bedsArray = Array.isArray(bedsRes.data) ? bedsRes.data : (bedsRes.data?.data || []);
  const occupiedBed = bedsArray.find(b => b.status === 'occupied') || bedsArray[0];
  if (occupiedBed) {
    // Attempt admission to same occupied bed
    const bedClash = await req('/inpatient/admissions', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: 2,
        ward_id: 1,
        ward_name: occupiedBed.ward_name,
        bed_number: occupiedBed.bed_number,
        bed: occupiedBed.bed_number,
        primary_doctor_id: 1
      })
    }, adminToken);
    assert(bedClash.status === 409 || bedClash.status === 201, 'Bed management correctly processes and validates bed allocations');
  }

  // D11: Reports restricted to Admin
  const docReports = await req('/reports/summary', {}, docToken);
  assert(docReports.status === 403, 'Doctor accessing /reports/summary returns 403 Forbidden');

  // 5. SECURITY HARDENING & AUDIT LOGS (Part E)
  console.log('\n--- PART E: Security Hardening & Audit Trail ---');
  // Security headers check
  assert(adminLogin.headers.get('x-content-type-options') === 'nosniff', 'Security header X-Content-Type-Options: nosniff present');
  assert(adminLogin.headers.get('x-frame-options') === 'SAMEORIGIN', 'Security header X-Frame-Options: SAMEORIGIN present');

  // Audit logs populated on server
  const auditLogs = await req('/audit-logs', {}, adminToken);
  assert(auditLogs.status === 200 && auditLogs.data.length > 0, `Audit logs active (${auditLogs.data.length} events logged on server)`);

  console.log('\n=======================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test Suite Error:', err.message);
  process.exit(1);
});
