// =======================================================
// MediCore HMS - Smart Cloud Demo & Offline Service
// Seamless fallback when backend API is hosted statically on Vercel
// =======================================================

import { initialData } from './mockData.js';

const STORE_VERSION = 'v2_lk_enriched_2026';

// Deep clone seed dataset into localStorage / memory store
let store = null;
function getStore() {
  if (!store) {
    try {
      const savedVersion = localStorage.getItem('medicore_store_version');
      const saved = localStorage.getItem('medicore_demo_store');
      if (saved && savedVersion === STORE_VERSION) {
        store = JSON.parse(saved);
      } else {
        store = JSON.parse(JSON.stringify(initialData));
        localStorage.setItem('medicore_demo_store', JSON.stringify(store));
        localStorage.setItem('medicore_store_version', STORE_VERSION);
      }
    } catch {
      store = JSON.parse(JSON.stringify(initialData));
    }
  }
  return store;
}

function saveStore() {
  if (store) {
    try {
      localStorage.setItem('medicore_demo_store', JSON.stringify(store));
      localStorage.setItem('medicore_store_version', STORE_VERSION);
    } catch {
      /* ignore */
    }
  }
}

// Entity helpers for relational mock lookups
function getPatient(s, id) {
  return (s.patients || []).find(p => String(p.id) === String(id));
}

function getDoctor(s, id) {
  return (s.doctors || []).find(d => String(d.id) === String(id));
}

function normalizePatient(p) {
  if (!p) return null;
  const code = p.patient_code || p.patient_no || `PAT-2026-${String(p.id).padStart(4, '0')}`;
  const dob = p.date_of_birth || p.dob || '1990-01-01';
  return {
    ...p,
    patient_code: code,
    patient_no: code,
    date_of_birth: dob,
    dob: dob,
    status: String(p.status || 'Active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
    full_name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sri Lankan Patient'
  };
}

function enrichAppointment(s, a) {
  if (!a) return null;
  const pt = getPatient(s, a.patient_id);
  const doc = getDoctor(s, a.doctor_id);
  return {
    ...a,
    patient_name: a.patient_name || pt?.full_name || 'Sri Lankan Patient',
    patient_nic: a.patient_nic || pt?.nic || '',
    patient_phone: a.patient_phone || pt?.phone || '',
    doctor_name: a.doctor_name || doc?.full_name || 'Dr. Consultant',
    doctor_specialization: a.doctor_specialization || doc?.specialization || 'Specialist',
    doctor_room: a.doctor_room || doc?.room_number || 'Room 101'
  };
}

function enrichAdmission(s, adm) {
  if (!adm) return null;
  const pt = getPatient(s, adm.patient_id);
  const doc = getDoctor(s, adm.primary_doctor_id);
  return {
    ...adm,
    patient_name: adm.patient_name || pt?.full_name || 'Sri Lankan Patient',
    patient_code: adm.patient_code || pt?.patient_code || pt?.patient_no || `PAT-2026-${String(adm.patient_id).padStart(4, '0')}`,
    patient_nic: adm.patient_nic || pt?.nic || '',
    doctor_name: adm.doctor_name || doc?.full_name || 'Dr. Consultant'
  };
}

function enrichPrescription(s, rx) {
  if (!rx) return null;
  const pt = getPatient(s, rx.patient_id);
  const doc = getDoctor(s, rx.doctor_id);
  return {
    ...rx,
    patient_name: rx.patient_name || pt?.full_name || 'Sri Lankan Patient',
    patient_nic: rx.patient_nic || pt?.nic || '',
    doctor_name: rx.doctor_name || doc?.full_name || 'Dr. Consultant'
  };
}

function enrichLabOrder(s, ord) {
  if (!ord) return null;
  const pt = getPatient(s, ord.patient_id);
  const doc = getDoctor(s, ord.doctor_id);
  const test = (s.lab_tests || []).find(t => String(t.id) === String(ord.test_id));
  return {
    ...ord,
    patient_name: ord.patient_name || pt?.full_name || 'Sri Lankan Patient',
    patient_nic: ord.patient_nic || pt?.nic || '',
    doctor_name: ord.doctor_name || doc?.full_name || 'Dr. Consultant',
    test_name: ord.test_name || test?.test_name || 'Laboratory Test'
  };
}

function enrichBill(s, b) {
  if (!b) return null;
  const pt = getPatient(s, b.patient_id);
  return {
    ...b,
    patient_name: b.patient_name || pt?.full_name || 'Sri Lankan Patient',
    patient_nic: b.patient_nic || pt?.nic || ''
  };
}

function enrichVital(s, v) {
  if (!v) return null;
  const pt = getPatient(s, v.patient_id);
  return {
    ...v,
    patient_name: v.patient_name || pt?.full_name || `Patient #${v.patient_id}`
  };
}

function enrichNote(s, n) {
  if (!n) return null;
  const pt = getPatient(s, n.patient_id);
  return {
    ...n,
    patient_name: n.patient_name || pt?.full_name || `Patient #${n.patient_id}`
  };
}

function enrichMedAdmin(s, m) {
  if (!m) return null;
  const pt = getPatient(s, m.patient_id);
  return {
    ...m,
    patient_name: m.patient_name || pt?.full_name || `Patient #${m.patient_id}`
  };
}

const ALL_PATIENT_FIELDS = [
  'full_name', 'nic', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
  'blood_group', 'allergies', 'chronic_conditions'
];
const IDENTITY_CONTACT = [
  'full_name', 'nic', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'
];
const CONTACT_MEDICAL = [
  'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
  'blood_group', 'allergies', 'chronic_conditions', 'medical_notes'
];
const BASIC_VIEW = ['full_name', 'phone', 'gender', 'date_of_birth'];
const LAB_VIEW = [...BASIC_VIEW, 'blood_group', 'allergies'];
const PHARM_VIEW = [...BASIC_VIEW, 'allergies'];
const DOC_ALL = ['id_document', 'insurance', 'lab_report', 'medical_report', 'other'];
const DOC_CLINICAL = ['lab_report', 'medical_report', 'other'];

function profile(permissions, viewFields, editableFields, docCategories) {
  return { permissions, viewFields, editableFields, docCategories };
}

const ROLE_PROFILES = {
  Administrator: profile(
    [
      'patient:view', 'patient:create', 'patient:update', 'patient:delete', 'patient:history:view',
      'document:view', 'document:upload',
      'doctor:view', 'doctor:manage',
      'appointment:view', 'appointment:book', 'appointment:status',
      'emr:view', 'emr:write',
      'lab:view', 'lab:request', 'lab:sample', 'lab:result',
      'pharmacy:view', 'pharmacy:manage', 'prescription:view', 'prescription:write', 'prescription:dispense',
      'billing:view', 'billing:manage',
      'inpatient:view', 'inpatient:admit', 'inpatient:discharge',
      'nurse:view', 'nurse:write',
      'staff:view', 'staff:manage',
      'reports:view', 'dashboard:role',
      'admin:users', 'admin:settings', 'admin:audit', 'admin:backup',
      'profile:edit'
    ],
    ALL_PATIENT_FIELDS,
    ALL_PATIENT_FIELDS,
    DOC_ALL
  ),

  Doctor: profile(
    [
      'patient:view', 'patient:history:view', 'document:view',
      'doctor:view',
      'appointment:view', 'appointment:status',
      'emr:view', 'emr:write',
      'lab:view', 'lab:request',
      'pharmacy:view', 'prescription:view', 'prescription:write',
      'inpatient:view', 'inpatient:admit', 'inpatient:discharge',
      'nurse:view',
      'dashboard:role', 'profile:edit'
    ],
    ALL_PATIENT_FIELDS,
    [],
    DOC_CLINICAL
  ),

  Nurse: profile(
    [
      'patient:view', 'patient:update', 'patient:history:view',
      'document:view', 'document:upload',
      'doctor:view',
      'appointment:view', 'appointment:status',
      'emr:view',
      'lab:view', 'lab:request', 'lab:sample',
      'pharmacy:view', 'prescription:view',
      'inpatient:view', 'inpatient:admit', 'inpatient:discharge',
      'nurse:view', 'nurse:write',
      'dashboard:role', 'profile:edit'
    ],
    ALL_PATIENT_FIELDS,
    CONTACT_MEDICAL,
    DOC_CLINICAL
  ),

  Receptionist: profile(
    [
      'patient:view', 'patient:create', 'patient:update', 'patient:delete',
      'document:view', 'document:upload',
      'doctor:view',
      'appointment:view', 'appointment:book', 'appointment:status',
      'inpatient:view', 'inpatient:admit', 'inpatient:discharge',
      'dashboard:role', 'profile:edit'
    ],
    IDENTITY_CONTACT,
    IDENTITY_CONTACT,
    ['id_document', 'insurance', 'other']
  ),

  'Laboratory Staff': profile(
    [
      'patient:view',
      'doctor:view',
      'lab:view', 'lab:sample', 'lab:result',
      'dashboard:role', 'profile:edit'
    ],
    LAB_VIEW,
    [],
    []
  ),

  Pharmacist: profile(
    [
      'patient:view',
      'doctor:view',
      'pharmacy:view', 'pharmacy:manage', 'prescription:view', 'prescription:dispense',
      'nurse:view',
      'dashboard:role', 'profile:edit'
    ],
    PHARM_VIEW,
    [],
    []
  ),

  Accountant: profile(
    [
      'patient:view',
      'billing:view', 'billing:manage',
      'reports:revenue',
      'dashboard:role', 'profile:edit'
    ],
    BASIC_VIEW,
    [],
    []
  )
};

export const mockService = {
  login(username, password, apiContext) {
    const s = getStore();
    const u = (username || '').toLowerCase().trim();

    let matchedUser = s.users.find(
      user => user.username.toLowerCase() === u || user.role.toLowerCase() === u
    );

    // Default aliases
    if (!matchedUser) {
      if (u.includes('admin')) matchedUser = s.users.find(x => x.role === 'Administrator');
      else if (u.includes('doc')) matchedUser = s.users.find(x => x.role === 'Doctor');
      else if (u.includes('nurse')) matchedUser = s.users.find(x => x.role === 'Nurse');
      else if (u.includes('recep')) matchedUser = s.users.find(x => x.role === 'Receptionist');
      else if (u.includes('lab')) matchedUser = s.users.find(x => x.role === 'Laboratory Staff');
      else if (u.includes('pharm')) matchedUser = s.users.find(x => x.role === 'Pharmacist');
      else if (u.includes('account')) matchedUser = s.users.find(x => x.role === 'Accountant');
    }

    if (!matchedUser) {
      matchedUser = s.users[0]; // fallback to admin
    }

    const roleName = matchedUser.role || 'Administrator';
    const prof = ROLE_PROFILES[roleName] || ROLE_PROFILES['Administrator'];

    const payload = {
      token: `demo-jwt-${Date.now()}-${matchedUser.id}`,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        full_name: matchedUser.full_name,
        role: roleName,
        roleSlug: roleName.toLowerCase(),
        email: matchedUser.email,
        phone: matchedUser.phone,
        department: matchedUser.department
      },
      role: roleName,
      roleSlug: roleName.toLowerCase(),
      permissions: prof.permissions,
      viewFields: prof.viewFields,
      editableFields: prof.editableFields,
      docCategories: prof.docCategories
    };

    console.info(`[MediCore HMS Cloud] Authenticated in Demo Mode as: ${matchedUser.full_name} (${roleName})`);
    if (apiContext) {
      apiContext.setSession(payload.token, payload.user, payload);
    }
    return payload;
  },

  handle(path, options = {}, rawResponse = false) {
    const s = getStore();
    const method = (options.method || 'GET').toUpperCase();
    const [cleanPath, queryString] = path.split('?');
    const searchParams = new URLSearchParams(queryString || '');

    let body = {};
    if (options.body) {
      try {
        body = JSON.parse(options.body);
      } catch {
        body = {};
      }
    }

    let result = null;

    // --- System Status ---
    if (cleanPath === '/system/status') {
      result = {
        database_connected: true,
        db_type: 'memory (cloud demo mode)',
        database_name: 'medicore_db',
        system: 'online',
        uptime: '99.9%'
      };
    }

    // --- Auth Me & Users ---
    else if (cleanPath === '/auth/me') {
      const u = JSON.parse(localStorage.getItem('medicore_user') || 'null') || s.users[0];
      result = { user: u };
    } else if (cleanPath === '/auth/users' || cleanPath === '/users') {
      result = s.users;
    }

    // --- Patients ---
    else if (cleanPath === '/patients' && method === 'GET') {
      const search = (searchParams.get('search') || '').toLowerCase().trim();
      const district = searchParams.get('district') || '';
      const includeInactive = searchParams.get('includeInactive') === 'true';

      let list = (s.patients || []).map(normalizePatient);
      if (!includeInactive) {
        list = list.filter(p => p.status !== 'inactive');
      }
      if (search) {
        list = list.filter(p =>
          (p.full_name || '').toLowerCase().includes(search) ||
          (p.patient_code || '').toLowerCase().includes(search) ||
          (p.nic || '').toLowerCase().includes(search) ||
          (p.phone || '').toLowerCase().includes(search)
        );
      }
      if (district && district !== 'All') {
        list = list.filter(p => (p.district || '').toLowerCase() === district.toLowerCase());
      }
      result = { data: list, total: list.length };
    } else if (cleanPath.match(/^\/patients\/\d+$/) && method === 'GET') {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const pt = (s.patients || []).find(p => p.id === id);
      result = pt ? normalizePatient(pt) : null;
    } else if (cleanPath === '/patients' && method === 'POST') {
      const code = `MC-P-${1000 + (s.patients.length || 0) + 1}`;
      const newPt = {
        id: (s.patients.length || 0) + 1,
        patient_code: code,
        patient_no: code,
        status: 'active',
        created_at: new Date().toISOString(),
        ...body,
        date_of_birth: body.date_of_birth || body.dob || '1990-01-01',
        dob: body.date_of_birth || body.dob || '1990-01-01'
      };
      s.patients.unshift(newPt);
      saveStore();
      result = normalizePatient(newPt);
    } else if (cleanPath.startsWith('/patients/') && method === 'PUT') {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const pt = s.patients.find(p => p.id === id);
      if (pt) Object.assign(pt, body);
      saveStore();
      result = pt ? normalizePatient(pt) : body;
    } else if (cleanPath.startsWith('/patients/') && method === 'DELETE') {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const pt = s.patients.find(p => p.id === id);
      if (pt) pt.status = 'inactive';
      saveStore();
      result = { success: true };
    } else if (cleanPath.startsWith('/patients/') && cleanPath.endsWith('/documents')) {
      result = [];
    }

    // --- Doctors ---
    else if (cleanPath === '/doctors') {
      const dept = searchParams.get('department') || '';
      const search = (searchParams.get('search') || '').toLowerCase().trim();
      let list = s.doctors || [];
      if (dept && dept !== 'All') list = list.filter(d => d.department === dept);
      if (search) list = list.filter(d => (d.full_name || '').toLowerCase().includes(search) || (d.specialization || '').toLowerCase().includes(search));
      result = list;
    }

    // --- Appointments ---
    else if (cleanPath === '/appointments' && method === 'GET') {
      const date = searchParams.get('date') || '';
      const doctorId = searchParams.get('doctor_id') || '';
      const status = searchParams.get('status') || '';

      let list = (s.appointments || []).map(a => enrichAppointment(s, a));
      if (date) list = list.filter(a => a.appointment_date === date);
      if (doctorId) list = list.filter(a => String(a.doctor_id) === String(doctorId));
      if (status && status !== 'All') list = list.filter(a => a.status === status);
      result = list;
    } else if (cleanPath === '/appointments' && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const doc = getDoctor(s, body.doctor_id);
      const newApt = {
        id: (s.appointments.length || 0) + 1,
        appointment_no: `MC-APT-2026-${Math.floor(100 + Math.random() * 900)}`,
        token_number: s.appointments.length + 1,
        status: 'Scheduled',
        ...body,
        patient_name: pt?.full_name || 'Patient',
        patient_nic: pt?.nic || '',
        patient_phone: pt?.phone || '',
        doctor_name: doc?.full_name || 'Dr. Consultant',
        doctor_specialization: doc?.specialization || 'Specialist',
        doctor_room: doc?.room_number || 'Room 101'
      };
      s.appointments.unshift(newApt);
      saveStore();
      result = newApt;
    } else if (cleanPath.startsWith('/appointments/') && cleanPath.endsWith('/status')) {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const apt = s.appointments.find(a => a.id === id);
      if (apt) apt.status = body.status || 'Completed';
      saveStore();
      result = apt ? enrichAppointment(s, apt) : { success: true };
    } else if (cleanPath.startsWith('/appointments/') && cleanPath.endsWith('/reschedule')) {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const apt = s.appointments.find(a => a.id === id);
      if (apt) {
        apt.appointment_date = body.appointment_date || apt.appointment_date;
        apt.time_slot = body.time_slot || apt.time_slot;
      }
      saveStore();
      result = apt ? enrichAppointment(s, apt) : { success: true };
    } else if (cleanPath.startsWith('/appointments/') && cleanPath.endsWith('/cancel')) {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const apt = s.appointments.find(a => a.id === id);
      if (apt) apt.status = 'Cancelled';
      saveStore();
      result = apt ? enrichAppointment(s, apt) : { success: true };
    }

    // --- Inpatient Admissions ---
    else if (cleanPath === '/inpatient/admissions' && method === 'GET') {
      result = (s.inpatient_admissions || []).map(adm => enrichAdmission(s, adm));
    } else if (cleanPath === '/inpatient/admissions' && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const doc = getDoctor(s, body.primary_doctor_id);
      const newAdm = {
        id: (s.inpatient_admissions.length || 0) + 1,
        admission_no: `MC-ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        ...body,
        patient_name: pt?.full_name || 'Patient',
        patient_code: pt?.patient_code || pt?.patient_no || '',
        patient_nic: pt?.nic || '',
        doctor_name: doc?.full_name || 'Dr. Consultant'
      };
      s.inpatient_admissions.unshift(newAdm);
      saveStore();
      result = newAdm;
    } else if (cleanPath.includes('/inpatient/admissions/') && cleanPath.endsWith('/discharge')) {
      const id = parseInt(cleanPath.split('/')[3], 10);
      const adm = s.inpatient_admissions.find(a => a.id === id);
      if (adm) {
        adm.status = 'Discharged';
        adm.discharge_date = new Date().toISOString().split('T')[0];
      }
      saveStore();
      result = { success: true, id, status: 'Discharged' };
    } else if (cleanPath === '/inpatient/beds') {
      result = { total: 120, occupied: 45, available: 75 };
    }

    // --- Nursing Care ---
    else if (cleanPath === '/nurse/vitals' && method === 'GET') {
      const patientId = searchParams.get('patient_id') || '';
      let list = (s.vital_signs || []).map(v => enrichVital(s, v));
      if (patientId) list = list.filter(v => String(v.patient_id) === String(patientId));
      result = list;
    } else if (cleanPath === '/nurse/vitals' && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const newVt = {
        id: (s.vital_signs?.length || 0) + 1,
        recorded_at: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        patient_name: pt?.full_name || `Patient #${body.patient_id}`,
        ...body
      };
      if (!s.vital_signs) s.vital_signs = [];
      s.vital_signs.unshift(newVt);
      saveStore();
      result = newVt;
    } else if (cleanPath === '/nurse/notes' && method === 'GET') {
      const patientId = searchParams.get('patient_id') || '';
      let list = (s.nursing_notes || []).map(n => enrichNote(s, n));
      if (patientId) list = list.filter(n => String(n.patient_id) === String(patientId));
      result = list;
    } else if (cleanPath === '/nurse/notes' && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const newNt = {
        id: (s.nursing_notes?.length || 0) + 1,
        created_at: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        patient_name: pt?.full_name || `Patient #${body.patient_id}`,
        ...body
      };
      if (!s.nursing_notes) s.nursing_notes = [];
      s.nursing_notes.unshift(newNt);
      saveStore();
      result = newNt;
    } else if (cleanPath === '/nurse/medications' || cleanPath === '/nurse/medication-admin') {
      const patientId = searchParams.get('patient_id') || '';
      let list = (s.medication_administration || []).map(m => enrichMedAdmin(s, m));
      if (patientId) list = list.filter(m => String(m.patient_id) === String(patientId));
      result = list;
    } else if ((cleanPath === '/nurse/medications' || cleanPath === '/nurse/medication-admin') && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const newMed = {
        id: (s.medication_administration?.length || 0) + 1,
        status: 'Scheduled',
        patient_name: pt?.full_name || `Patient #${body.patient_id}`,
        ...body
      };
      if (!s.medication_administration) s.medication_administration = [];
      s.medication_administration.unshift(newMed);
      saveStore();
      result = newMed;
    }

    // --- EMR Medical Records ---
    else if (cleanPath === '/emr/records' && method === 'GET') {
      const patientId = searchParams.get('patient_id') || '';
      let list = (s.medical_records || []).map(rec => {
        const pt = getPatient(s, rec.patient_id);
        const doc = getDoctor(s, rec.doctor_id);
        return {
          ...rec,
          patient_name: rec.patient_name || pt?.full_name || 'Patient',
          doctor_name: rec.doctor_name || doc?.full_name || 'Dr. Consultant'
        };
      });
      if (patientId) list = list.filter(r => String(r.patient_id) === String(patientId));
      result = list;
    } else if (cleanPath === '/emr/records' && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const doc = getDoctor(s, body.doctor_id);
      const newRec = {
        id: (s.medical_records?.length || 0) + 1,
        visit_date: new Date().toISOString().split('T')[0],
        patient_name: pt?.full_name || 'Patient',
        doctor_name: doc?.full_name || 'Dr. Consultant',
        ...body
      };
      if (!s.medical_records) s.medical_records = [];
      s.medical_records.unshift(newRec);
      saveStore();
      result = newRec;
    }

    // --- Prescriptions ---
    else if (cleanPath === '/prescriptions' && method === 'GET') {
      const patientId = searchParams.get('patient_id') || '';
      const doctorId = searchParams.get('doctor_id') || '';
      let list = (s.prescriptions || []).map(rx => enrichPrescription(s, rx));
      if (patientId) list = list.filter(rx => String(rx.patient_id) === String(patientId));
      if (doctorId) list = list.filter(rx => String(rx.doctor_id) === String(doctorId));
      result = list;
    } else if (cleanPath === '/prescriptions' && method === 'POST') {
      const pt = getPatient(s, body.patient_id);
      const doc = getDoctor(s, body.doctor_id);
      const newRx = {
        id: (s.prescriptions?.length || 0) + 1,
        created_at: new Date().toISOString(),
        dispense_status: 'Prescribed',
        patient_name: pt?.full_name || 'Patient',
        doctor_name: doc?.full_name || 'Dr. Consultant',
        ...body
      };
      if (!s.prescriptions) s.prescriptions = [];
      s.prescriptions.unshift(newRx);
      saveStore();
      result = newRx;
    } else if (cleanPath.startsWith('/prescriptions/') && cleanPath.endsWith('/dispense')) {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const rx = s.prescriptions.find(r => r.id === id);
      if (rx) rx.dispense_status = 'Dispensed';
      saveStore();
      result = rx ? enrichPrescription(s, rx) : { success: true };
    }

    // --- Billing ---
    else if (cleanPath === '/bills' || cleanPath === '/billing/invoices') {
      result = (s.bills || []).map(b => enrichBill(s, b));
    } else if (cleanPath === '/billing/payments' && method === 'GET') {
      result = (s.bills || []).filter(b => b.status === 'Paid').map(b => enrichBill(s, b));
    } else if (cleanPath.startsWith('/bills/') && cleanPath.endsWith('/pay')) {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const bill = (s.bills || []).find(b => b.id === id);
      if (bill) bill.status = 'Paid';
      saveStore();
      result = bill ? enrichBill(s, bill) : { success: true };
    }

    // --- Pharmacy ---
    else if (cleanPath === '/pharmacy/medicines' || cleanPath === '/pharmacy/inventory') {
      const search = (searchParams.get('search') || '').toLowerCase().trim();
      const cat = searchParams.get('category') || '';
      let list = s.pharmacy_medicines || [];
      if (cat && cat !== 'All') list = list.filter(m => m.category === cat);
      if (search) list = list.filter(m => (m.brand_name || '').toLowerCase().includes(search) || (m.generic_name || '').toLowerCase().includes(search));
      result = list;
    } else if (cleanPath === '/pharmacy/suppliers') {
      result = [
        { id: 1, name: 'State Pharmaceuticals Corporation (SPC)', contact: '011-2345678', email: 'spc@health.gov.lk' },
        { id: 2, name: 'GlaxoSmithKline Sri Lanka', contact: '011-8901234', email: 'orders@gsk.lk' },
        { id: 3, name: 'Astron Limited', contact: '011-4567890', email: 'supply@astron.lk' }
      ];
    } else if (cleanPath === '/pharmacy/categories') {
      result = ['Analgesic & Antipyretic', 'Antibiotic', 'Antidiabetic', 'Lipid Regulating', 'Antihypertensive', 'Proton Pump Inhibitor', 'Respiratory / Bronchodilator', 'Antihistamine'];
    }

    // --- Laboratory ---
    else if (cleanPath === '/laboratory/orders' || cleanPath === '/lab/orders') {
      result = (s.lab_orders || []).map(ord => enrichLabOrder(s, ord));
    } else if (cleanPath === '/laboratory/tests' || cleanPath === '/lab/tests') {
      result = s.lab_tests || [];
    }

    // --- Staff Management ---
    else if (cleanPath === '/staff/employees') {
      result = s.employees || [];
    } else if (cleanPath === '/staff/attendance') {
      result = s.staff_attendance || [];
    } else if (cleanPath === '/staff/leaves') {
      result = s.staff_leaves || [];
    }

    // --- Dashboards & Reports ---
    else if (cleanPath === '/reports/summary' || cleanPath === '/summary') {
      const enrichedApts = (s.appointments || []).map(a => enrichAppointment(s, a));
      const enrichedPts = (s.patients || []).map(normalizePatient);
      result = {
        metrics: {
          totalPatients: enrichedPts.length,
          todayAppointments: enrichedApts.filter(a => a.status !== 'Cancelled').length,
          activeDoctors: s.doctors?.length || 5,
          occupiedBeds: s.inpatient_admissions?.filter(a => a.status === 'Admitted').length || 18,
          totalRevenueLkr: 845000,
          pendingLabReports: (s.lab_orders || []).filter(o => o.sample_status !== 'Completed').length,
          lowStockMedicines: (s.pharmacy_medicines || []).filter(m => m.stock_quantity <= m.reorder_level).length,
          admittedPatients: s.inpatient_admissions?.filter(a => a.status === 'Admitted').length || 2
        },
        monthlyRegistrations: [
          { month: 'Jan', count: 12 }, { month: 'Feb', count: 18 }, { month: 'Mar', count: 24 },
          { month: 'Apr', count: 20 }, { month: 'May', count: 32 }, { month: 'Jun', count: 28 },
          { month: 'Jul', count: 35 }, { month: 'Aug', count: 42 }, { month: 'Sep', count: 38 },
          { month: 'Oct', count: 45 }
        ],
        monthlyAppointments: [
          { month: 'May', booked: 42, completed: 39 }, { month: 'Jun', booked: 50, completed: 48 },
          { month: 'Jul', booked: 62, completed: 58 }, { month: 'Aug', booked: 75, completed: 71 },
          { month: 'Sep', booked: 68, completed: 65 }, { month: 'Oct', booked: 82, completed: 77 }
        ],
        monthlyRevenue: [
          { month: 'May', amount: 480000 }, { month: 'Jun', amount: 590000 }, { month: 'Jul', amount: 670000 },
          { month: 'Aug', amount: 780000 }, { month: 'Sep', amount: 720000 }, { month: 'Oct', amount: 845000 }
        ],
        recentAppointments: enrichedApts.slice(0, 5),
        recentPatientRegistrations: enrichedPts.slice(0, 5),
        pendingTasks: [
          { title: 'Dengue NS1 Antigen Confirmation for Bed 14', priority: 'high' },
          { title: 'Pharmacy Amoxicillin 500mg Batch Re-stock', priority: 'medium' },
          { title: 'Discharge Summary Clearance for Ward 03', priority: 'normal' }
        ]
      };
    } else if (cleanPath.startsWith('/role-summary')) {
      const enrichedApts = (s.appointments || []).map(a => enrichAppointment(s, a));
      const enrichedPts = (s.patients || []).map(normalizePatient);
      const enrichedVitals = (s.vital_signs || []).map(v => enrichVital(s, v));
      result = {
        todayAppointments: enrichedApts.length,
        assignedPatients: enrichedPts.length,
        pendingAppointments: enrichedApts.filter(a => a.status === 'Scheduled').length,
        completedAppointments: enrichedApts.filter(a => a.status === 'Completed').length,
        todaySchedule: enrichedApts.slice(0, 5),
        upcomingAppointments: enrichedApts.slice(0, 5),
        activePatients: enrichedPts.slice(0, 6),
        recentVitals: enrichedVitals.slice(0, 5)
      };
    } else {
      result = [];
    }

    if (rawResponse) {
      return {
        ok: true,
        status: 200,
        json: async () => result,
        blob: async () => new Blob([JSON.stringify(result)], { type: 'application/json' })
      };
    }
    return result;
  }
};
