// =======================================================
// MediCore HMS - RBAC Middleware & Security Enforcement
// =======================================================

import { hasPermission } from '../config/permissions.js';

/**
 * Maps HTTP method and path to the required permission key.
 * Returns undefined if only basic authentication is needed.
 */
export function permissionForRoute(method, path) {
  const p = path.split('?')[0];
  const m = method.toUpperCase();

  // Public / User Self-Management endpoints
  if (m === 'GET' && p === '/auth/me') return undefined;
  if (m === 'POST' && p === '/system/reconnect-db') return 'admin:backup';
  if (m === 'POST' && p === '/auth/change-password') return 'profile:edit';
  if (m === 'POST' && p === '/auth/change-username') return 'profile:edit';
  if (m === 'PUT' && p === '/auth/profile') return 'profile:edit';
  if (m === 'POST' && p === '/audit-logs') return undefined;

  // D1: Patients (Appendix 1)
  if (p === '/patients' || /^\/patients\/\d+$/.test(p)) {
    if (m === 'GET') return 'patient:view';
    if (m === 'POST') return 'patient:create';
    if (m === 'PUT') return 'patient:update';
    if (m === 'DELETE') return 'patient:delete';
  }
  if (/^\/patients\/\d+\/documents/.test(p)) {
    if (m === 'GET') return 'document:view';
    if (m === 'POST') return 'document:upload';
  }
  if (/^\/patients\/\d+\/documents\/\d+\/download/.test(p)) return 'document:view';

  // D2: Doctors
  if (p === '/doctors' || /^\/doctors\/\d+$/.test(p)) {
    if (m === 'GET') return 'doctor:view';
    return 'doctor:manage';
  }
  if (p === '/departments') return 'doctor:view';

  // D3: Appointments
  if (p.startsWith('/appointments')) {
    if (m === 'GET') return 'appointment:view';
    if (p.includes('/checkin') || p.includes('/cancel') || p.includes('/reschedule')) return 'appointment:book';
    if (p.includes('/status')) return 'appointment:status';
    if (m === 'POST') return 'appointment:book';
    if (m === 'DELETE') return 'appointment:book';
    if (m === 'PUT') return 'appointment:status';
  }

  // D4: EMR & Prescriptions
  if (p.startsWith('/emr')) {
    if (m === 'GET') return 'emr:view';
    return 'emr:write';
  }
  if (p.startsWith('/prescriptions')) {
    if (m === 'GET') return 'prescription:view';
    if (p.includes('/dispense')) return 'prescription:dispense';
    return 'prescription:write';
  }

  // D5: Laboratory
  if (p.startsWith('/lab/tests')) return 'lab:view';
  if (p.startsWith('/lab/orders')) {
    if (m === 'GET') return 'lab:view';
    if (p.includes('/result')) return 'lab:result';
    if (p.includes('/sample')) return 'lab:sample';
    return 'lab:request';
  }

  // D6: Pharmacy
  if (p.startsWith('/pharmacy')) {
    if (m === 'GET') return 'pharmacy:view';
    return 'pharmacy:manage';
  }

  // D7: Billing and Payments
  if (p.startsWith('/bills') || p.startsWith('/billing')) {
    if (m === 'GET') return 'billing:view';
    return 'billing:manage';
  }

  // D8: Inpatient / Wards
  if (p.startsWith('/inpatient')) {
    if (m === 'GET') return 'inpatient:view';
    if (p.includes('/discharge')) return 'inpatient:discharge';
    return 'inpatient:admit';
  }

  // D9: Nurse Care
  if (p.startsWith('/nurse')) {
    if (m === 'GET') return 'nurse:view';
    return 'nurse:write';
  }

  // D10: Staff Management
  if (p.startsWith('/staff')) {
    if (p.includes('/attendance/clock') || (p === '/staff/leaves' && m === 'POST')) return 'profile:edit';
    if (p.includes('/leaves/') && p.includes('/status')) return 'staff:manage';
    if (m === 'GET') return 'staff:view';
    return 'staff:manage';
  }

  // D11: Reports & Dashboards
  if (p === '/reports/summary') return 'reports:view';
  if (p === '/reports/revenue') return 'reports:revenue';
  if (p.startsWith('/role-summary')) return 'dashboard:role';

  // D12: Admin & Settings
  if (p.startsWith('/users')) return 'admin:users';
  if (p.startsWith('/hospital/settings')) return 'admin:settings';
  if (p === '/audit-logs') return 'admin:audit';
  if (p.startsWith('/system/backup')) return 'admin:backup';

  if (p.startsWith('/notifications')) return undefined;
  if (p === '/auth/users') return 'admin:users';

  return undefined;
}

export function enforceAccess(req, res, next) {
  const perm = permissionForRoute(req.method, req.path);
  if (!perm) return next();

  if (!req.user?.role) {
    return res.status(401).json({ error: 'Unauthorized. Authentication session required.' });
  }

  if (!hasPermission(req.user.role, perm)) {
    return res.status(403).json({
      error: `Forbidden: Your role (${req.user.role}) does not have permission for this resource.`
    });
  }

  // Step C0 Rule #2: A user can ONLY request their OWN role summary.
  // Doctor requesting Pharmacist or Admin dashboard data must return 403 Forbidden!
  if (req.path.startsWith('/role-summary/')) {
    const requestedRole = decodeURIComponent(req.path.replace('/role-summary/', '').split('?')[0]);
    if (req.user.role !== requestedRole) {
      return res.status(403).json({
        error: `Forbidden: You can only access the dashboard for your own role (${req.user.role}).`
      });
    }
  }

  next();
}

export function toDateStr(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}
