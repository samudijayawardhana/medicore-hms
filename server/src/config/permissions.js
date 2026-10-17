// =======================================================
// MediCore HMS — Role Permissions (SRS / Build Guide Appendix 1 & B5)
// =======================================================

export const ALL_PATIENT_FIELDS = [
  'full_name', 'nic', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
  'blood_group', 'allergies', 'chronic_conditions'
];

// Step B5: Field Level Rules
// Receptionist edit: Identity + contact only
const IDENTITY_CONTACT = [
  'full_name', 'nic', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'
];

const CONTACT_MEDICAL = [
  'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
  'blood_group', 'allergies', 'chronic_conditions', 'medical_notes'
];

// View fields per role
const BASIC_VIEW = ['full_name', 'phone', 'gender', 'date_of_birth'];
const LAB_VIEW = [...BASIC_VIEW, 'blood_group', 'allergies'];
const PHARM_VIEW = [...BASIC_VIEW, 'allergies'];

const DOC_ALL = ['id_document', 'insurance', 'lab_report', 'medical_report', 'other'];
const DOC_CLINICAL = ['lab_report', 'medical_report', 'other'];

function profile(permissions, viewFields, editableFields, docCategories) {
  return { permissions, viewFields, editableFields, docCategories };
}

export const ROLE_PROFILES = {
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
    [], // Doctors cannot edit registry directly
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

export function roleSlug(role) {
  const map = {
    Administrator: 'administrator',
    Doctor: 'doctor',
    Nurse: 'nurse',
    Receptionist: 'receptionist',
    'Laboratory Staff': 'lab',
    Pharmacist: 'pharmacist',
    Accountant: 'accountant'
  };
  return map[role] || String(role || '').toLowerCase().replace(/\s+/g, '_');
}

export function accessProfile(role) {
  const base = ROLE_PROFILES[role] || ROLE_PROFILES.Receptionist;
  return {
    permissions: [...base.permissions],
    viewFields: [...base.viewFields],
    editableFields: [...base.editableFields],
    docCategories: [...base.docCategories],
    roleSlug: roleSlug(role)
  };
}

export function hasPermission(role, permission) {
  if (!permission) return true;
  const { permissions } = accessProfile(role);
  return permissions.includes(permission);
}
