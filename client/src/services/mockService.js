// =======================================================
// MediCore HMS - Smart Cloud Demo & Offline Service
// Seamless fallback when backend API is hosted statically on Vercel
// =======================================================

import { initialData } from './mockData.js';

// Deep clone seed dataset into localStorage / memory store
let store = null;
function getStore() {
  if (!store) {
    try {
      const saved = localStorage.getItem('medicore_demo_store');
      if (saved) {
        store = JSON.parse(saved);
      } else {
        store = JSON.parse(JSON.stringify(initialData));
        localStorage.setItem('medicore_demo_store', JSON.stringify(store));
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
    } catch {
      /* ignore */
    }
  }
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
    const cleanPath = path.split('?')[0];
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
      const list = s.patients || [];
      result = { data: list, total: list.length };
    } else if (cleanPath === '/patients' && method === 'POST') {
      const newPt = {
        id: (s.patients.length || 0) + 1,
        patient_code: `PAT-2026-${String(s.patients.length + 1).padStart(4, '0')}`,
        status: 'active',
        created_at: new Date().toISOString(),
        ...body
      };
      s.patients.unshift(newPt);
      saveStore();
      result = newPt;
    } else if (cleanPath.startsWith('/patients/') && method === 'PUT') {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const pt = s.patients.find(p => p.id === id);
      if (pt) Object.assign(pt, body);
      saveStore();
      result = pt || body;
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
      result = s.doctors || [];
    }

    // --- Appointments ---
    else if (cleanPath === '/appointments' && method === 'GET') {
      result = s.appointments || [];
    } else if (cleanPath === '/appointments' && method === 'POST') {
      const newApt = {
        id: (s.appointments.length || 0) + 1,
        appointment_no: `MC-APT-2026-${Math.floor(100 + Math.random() * 900)}`,
        token_number: s.appointments.length + 1,
        status: 'Scheduled',
        ...body
      };
      s.appointments.unshift(newApt);
      saveStore();
      result = newApt;
    } else if (cleanPath.startsWith('/appointments/') && cleanPath.endsWith('/status')) {
      const id = parseInt(cleanPath.split('/')[2], 10);
      const apt = s.appointments.find(a => a.id === id);
      if (apt) apt.status = body.status || 'Completed';
      saveStore();
      result = apt || { success: true };
    }

    // --- Inpatient Admissions ---
    else if (cleanPath === '/inpatient/admissions' && method === 'GET') {
      result = s.inpatient_admissions || [];
    } else if (cleanPath === '/inpatient/admissions' && method === 'POST') {
      const newAdm = {
        id: (s.inpatient_admissions.length || 0) + 1,
        admission_no: `MC-ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        ...body
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
      result = s.vital_signs || [];
    } else if (cleanPath === '/nurse/vitals' && method === 'POST') {
      const newVt = { id: (s.vital_signs?.length || 0) + 1, recorded_at: new Date().toISOString(), ...body };
      if (!s.vital_signs) s.vital_signs = [];
      s.vital_signs.unshift(newVt);
      saveStore();
      result = newVt;
    } else if (cleanPath === '/nurse/notes' && method === 'GET') {
      result = s.nursing_notes || [];
    } else if (cleanPath === '/nurse/notes' && method === 'POST') {
      const newNt = { id: (s.nursing_notes?.length || 0) + 1, created_at: new Date().toISOString(), ...body };
      if (!s.nursing_notes) s.nursing_notes = [];
      s.nursing_notes.unshift(newNt);
      saveStore();
      result = newNt;
    } else if (cleanPath === '/nurse/medication-admin') {
      result = s.medication_administration || [];
    }

    // --- Prescriptions ---
    else if (cleanPath === '/prescriptions' && method === 'GET') {
      result = s.prescriptions || [];
    } else if (cleanPath === '/prescriptions' && method === 'POST') {
      const newRx = { id: (s.prescriptions?.length || 0) + 1, created_at: new Date().toISOString(), ...body };
      if (!s.prescriptions) s.prescriptions = [];
      s.prescriptions.unshift(newRx);
      saveStore();
      result = newRx;
    }

    // --- Billing ---
    else if (cleanPath === '/bills' || cleanPath === '/billing/invoices') {
      result = s.bills || [];
    }

    // --- Pharmacy ---
    else if (cleanPath === '/pharmacy/inventory') {
      result = s.pharmacy_inventory || [];
    } else if (cleanPath === '/pharmacy/suppliers') {
      result = [];
    } else if (cleanPath === '/pharmacy/categories') {
      result = [];
    }

    // --- Laboratory ---
    else if (cleanPath === '/laboratory/orders' || cleanPath === '/lab/orders') {
      result = s.lab_orders || [];
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
      result = {
        metrics: {
          totalPatients: s.patients?.length || 10,
          todayAppointments: 4,
          activeDoctors: s.doctors?.length || 4,
          occupiedBeds: 18,
          totalRevenueLkr: 845000,
          pendingLabReports: 6,
          lowStockMedicines: 3,
          admittedPatients: 14
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
        recentAppointments: (s.appointments || []).slice(0, 5),
        recentPatientRegistrations: (s.patients || []).slice(0, 5),
        pendingTasks: [
          { title: 'Dengue NS1 Antigen Confirmation for Bed 14', priority: 'high' },
          { title: 'Pharmacy Amoxicillin 500mg Batch Re-stock', priority: 'medium' },
          { title: 'Discharge Summary Clearance for Ward 03', priority: 'normal' }
        ]
      };
    } else if (cleanPath.startsWith('/role-summary')) {
      result = {
        todayAppointments: 4,
        assignedPatients: 8,
        pendingAppointments: 3,
        completedAppointments: 5,
        todaySchedule: (s.appointments || []).slice(0, 4),
        upcomingAppointments: (s.appointments || []).slice(4, 7),
        activePatients: s.patients?.slice(0, 4) || [],
        recentVitals: s.vital_signs?.slice(0, 4) || []
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
