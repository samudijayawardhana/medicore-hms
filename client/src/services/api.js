// =======================================================
// MediCore HMS - API Service Client
// Centralized HTTP client connecting React to Node.js / MySQL
// =======================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getSession() {
  try {
    const raw = localStorage.getItem('hms_session');
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const token = localStorage.getItem('medicore_auth_token');
  const userRaw = localStorage.getItem('medicore_user');
  if (!token) return null;
  try {
    return { token, user: userRaw ? JSON.parse(userRaw) : null };
  } catch {
    return { token, user: null };
  }
}

async function request(path, options = {}, rawResponse = false) {
  const s = getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !options.headers?.['Content-Type'] ? { 'Content-Type': 'application/json' } : {}),
      ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (res.status === 401 && s) {
    localStorage.removeItem('hms_session');
    localStorage.removeItem('medicore_auth_token');
    localStorage.removeItem('medicore_user');
    window.dispatchEvent(new Event('hms-session-expired'));
  }
  if (rawResponse) return res;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function authFetch(url, options = {}) {
  const path = url.startsWith(API_BASE) ? url.slice(API_BASE.length) : url;
  return request(path, options, true);
}

export const api = {
  getSession,
  // System Status
  async getSystemStatus() {
    const res = await authFetch(`${API_BASE}/system/status`);
    return res.json();
  },

  async reconnectDb() {
    const res = await authFetch(`${API_BASE}/system/reconnect-db`, { method: 'POST' });
    return res.json();
  },

  // Auth & Roles
  getStoredToken() {
    return getSession()?.token || localStorage.getItem('medicore_auth_token');
  },

  getStoredUser() {
    return getSession()?.user || null;
  },

  setSession(token, user, fullLoginPayload = null) {
    if (fullLoginPayload) {
      localStorage.setItem('hms_session', JSON.stringify(fullLoginPayload));
    }
    if (token) localStorage.setItem('medicore_auth_token', token);
    if (user) localStorage.setItem('medicore_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('hms_session');
    localStorage.removeItem('medicore_auth_token');
    localStorage.removeItem('medicore_user');
  },

  async logout() {
    try {
      await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {
      /* ignore server error on logout */
    } finally {
      this.clearSession();
    }
  },

  async login(username, password) {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
    } catch (netErr) {
      throw new Error('Unable to connect to MediCore Backend Server. Please ensure the server is running on port 5000.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed. Please check your credentials.');
    if (data.token && data.user) {
      this.setSession(data.token, data.user, data);
    }
    return data;
  },

  async getMe() {
    if (!this.getStoredToken()) return null;
    try {
      const data = await request('/auth/me');
      if (data.user) {
        this.setSession(data.token || this.getStoredToken(), data.user, { ...getSession(), ...data, token: this.getStoredToken() });
        return data.user;
      }
    } catch {
      return null;
    }
    return null;
  },

  async getUsers() {
    return request('/auth/users');
  },

  // Patients
  async getPatients(search = '', district = '', includeInactive = false) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (district && district !== 'All') params.append('district', district);
    if (includeInactive) params.append('includeInactive', 'true');
    const res = await request(`/patients?${params.toString()}`);
    const list = Array.isArray(res) ? res : (res?.data || []);
    list.data = list;
    list.total = res?.total ?? list.length;
    return list;
  },

  async getPatient(id) {
    return request(`/patients/${id}`);
  },

  async createPatient(patientData) {
    return request('/patients', { method: 'POST', body: JSON.stringify(patientData) });
  },

  async updatePatient(id, patientData) {
    return request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(patientData) });
  },

  async deletePatient(id) {
    return request(`/patients/${id}`, { method: 'DELETE' });
  },

  async listDocuments(patientId) {
    return request(`/patients/${patientId}/documents`);
  },

  async uploadDocument(patientId, file, category) {
    const max = 5 * 1024 * 1024;
    if (file.size > max) throw new Error('File exceeds 5 MB limit.');
    const content_base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return request(`/patients/${patientId}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        category,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        content_base64
      })
    });
  },

  async downloadDocument(patientId, docId) {
    const res = await authFetch(`${API_BASE}/patients/${patientId}/documents/${docId}/download`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Download failed');
    }
    return res.blob();
  },

  // Doctors
  async getDoctors(department = '', search = '') {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (search) params.append('search', search);
    const res = await authFetch(`${API_BASE}/doctors?${params.toString()}`);
    return res.json();
  },

  async createDoctor(doctorData) {
    const res = await authFetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add doctor');
    return res.json();
  },

  async updateDoctor(id, doctorData) {
    const res = await authFetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    return res.json();
  },

  // Appointments
  async getAppointments(date = '', doctor_id = '', status = '') {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (status) params.append('status', status);
    const res = await authFetch(`${API_BASE}/appointments?${params.toString()}`);
    return res.json();
  },

  async createAppointment(aptData) {
    const res = await authFetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aptData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to book appointment');
    return res.json();
  },

  async updateAppointmentStatus(id, status) {
    const res = await authFetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async rescheduleAppointment(id, appointment_date, time_slot) {
    const res = await authFetch(`${API_BASE}/appointments/${id}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_date, time_slot })
    });
    return res.json();
  },

  async cancelAppointment(id, reason) {
    const res = await authFetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  // EMR & Prescriptions
  async getMedicalRecords(patient_id = '') {
    const params = new URLSearchParams();
    if (patient_id) params.append('patient_id', patient_id);
    const res = await authFetch(`${API_BASE}/emr/records?${params.toString()}`);
    return res.json();
  },

  async createMedicalRecord(recordData) {
    const res = await authFetch(`${API_BASE}/emr/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to save medical record');
    return res.json();
  },

  // Laboratory
  async getLabTests() {
    const res = await authFetch(`${API_BASE}/lab/tests`);
    return res.json();
  },

  async getLabOrders() {
    const res = await authFetch(`${API_BASE}/lab/orders`);
    return res.json();
  },

  async createLabOrder(orderData) {
    const res = await authFetch(`${API_BASE}/lab/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to order lab test');
    return res.json();
  },

  async updateLabResult(id, resultData) {
    const res = await authFetch(`${API_BASE}/lab/orders/${id}/result`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData)
    });
    return res.json();
  },

  async collectLabSample(id, sampleData) {
    const res = await authFetch(`${API_BASE}/lab/orders/${id}/sample`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleData)
    });
    return res.json();
  },

  // Pharmacy
  async getPharmacyMedicines(search = '', category = '', low_stock = false) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (low_stock) params.append('low_stock', 'true');
    const res = await authFetch(`${API_BASE}/pharmacy/medicines?${params.toString()}`);
    return res.json();
  },

  async createMedicine(medData) {
    const res = await authFetch(`${API_BASE}/pharmacy/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medData)
    });
    return res.json();
  },

  async adjustStock(id, quantity_delta) {
    const res = await authFetch(`${API_BASE}/pharmacy/medicines/${id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity_delta })
    });
    return res.json();
  },

  // Inpatient & Ward
  async getInpatientAdmissions() {
    const res = await authFetch(`${API_BASE}/inpatient/admissions`);
    return res.json();
  },

  async admitPatient(admissionData) {
    const res = await authFetch(`${API_BASE}/inpatient/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admissionData)
    });
    return res.json();
  },

  async dischargePatient(id) {
    const res = await authFetch(`${API_BASE}/inpatient/admissions/${id}/discharge`, {
      method: 'PUT'
    });
    return res.json();
  },

  // Billing & Invoices
  async getBills() {
    const res = await authFetch(`${API_BASE}/bills`);
    return res.json();
  },

  async createBill(billData) {
    const res = await authFetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create bill');
    return res.json();
  },

  async receiveBillPayment(id, paymentData) {
    const res = await authFetch(`${API_BASE}/bills/${id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return res.json();
  },

  // Staff & Employees
  async getEmployees() {
    const res = await authFetch(`${API_BASE}/staff/employees`);
    return res.json();
  },

  async getStaffAttendance() {
    const res = await authFetch(`${API_BASE}/staff/attendance`);
    return res.json();
  },

  async createEmployee(empData) {
    const res = await authFetch(`${API_BASE}/staff/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empData)
    });
    return res.json();
  },

  async clockStaffAttendance(attData) {
    const res = await authFetch(`${API_BASE}/staff/attendance/clock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attData)
    });
    return res.json();
  },

  async getStaffLeaves() {
    const res = await authFetch(`${API_BASE}/staff/leaves`);
    return res.json();
  },

  async applyStaffLeave(leaveData) {
    const res = await authFetch(`${API_BASE}/staff/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaveData)
    });
    return res.json();
  },

  async updateStaffLeaveStatus(id, status) {
    const res = await authFetch(`${API_BASE}/staff/leaves/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async getSystemBackup() {
    const res = await authFetch(`${API_BASE}/system/backup`);
    return res.json();
  },

  async getAuditLogs(module = '', search = '') {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (search) params.append('search', search);
    const res = await authFetch(`${API_BASE}/audit-logs?${params.toString()}`);
    return res.json();
  },

  // Reports Summary
  async getReportsSummary() {
    const res = await authFetch(`${API_BASE}/reports/summary`);
    return res.json();
  },

  // User Management
  async getUsers() {
    const res = await authFetch(`${API_BASE}/users`);
    return res.json();
  },

  async createUser(userData) {
    const res = await authFetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  },

  async updateUserRole(id, role) {
    const res = await authFetch(`${API_BASE}/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  async updateUserStatus(id, status) {
    const res = await authFetch(`${API_BASE}/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async resetUserPassword(id, newPassword) {
    const res = await authFetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: newPassword })
    });
    return res.json();
  },

  // Profile & Settings
  async changeUsername(userId, newUsername, currentPassword) {
    const res = await authFetch(`${API_BASE}/auth/change-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, new_username: newUsername, current_password: currentPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change username');
    return data;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  // Hospital Settings
  async getHospitalSettings() {
    const res = await authFetch(`${API_BASE}/hospital/settings`);
    return res.json();
  },

  async updateHospitalSettings(settings) {
    const res = await authFetch(`${API_BASE}/hospital/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(module = '', search = '') {
    const params = new URLSearchParams();
    if (module && module !== 'All') params.append('module', module);
    if (search) params.append('search', search);
    const res = await authFetch(`${API_BASE}/audit-logs?${params.toString()}`);
    return res.json();
  },

  async addAuditLog(entry) {
    const res = await authFetch(`${API_BASE}/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return res.json();
  },

  // Prescriptions
  async getPrescriptions(patient_id = '', doctor_id = '', status = '') {
    const params = new URLSearchParams();
    if (patient_id) params.append('patient_id', patient_id);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (status) params.append('status', status);
    const res = await authFetch(`${API_BASE}/prescriptions?${params.toString()}`);
    return res.json();
  },

  async createPrescription(rxData) {
    const res = await authFetch(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rxData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create prescription');
    return data;
  },

  async dispensePrescription(id, dispensed_by) {
    const res = await authFetch(`${API_BASE}/prescriptions/${id}/dispense`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispensed_by })
    });
    return res.json();
  },

  // Nurse: Vitals & Notes & Medication Administration
  async getVitals(patient_id = '') {
    const params = new URLSearchParams();
    if (patient_id) params.append('patient_id', patient_id);
    const res = await authFetch(`${API_BASE}/nurse/vitals?${params.toString()}`);
    return res.json();
  },

  async createVitals(vitalsData) {
    const res = await authFetch(`${API_BASE}/nurse/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalsData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record vitals');
    return data;
  },

  async getNursingNotes(patient_id = '') {
    const params = new URLSearchParams();
    if (patient_id) params.append('patient_id', patient_id);
    const res = await authFetch(`${API_BASE}/nurse/notes?${params.toString()}`);
    return res.json();
  },

  async createNursingNote(noteData) {
    const res = await authFetch(`${API_BASE}/nurse/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add nursing note');
    return data;
  },

  async getMedicationAdministration(patient_id = '') {
    const params = new URLSearchParams();
    if (patient_id) params.append('patient_id', patient_id);
    const res = await authFetch(`${API_BASE}/nurse/medications?${params.toString()}`);
    return res.json();
  },

  async createMedicationAdministration(medData) {
    const res = await authFetch(`${API_BASE}/nurse/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medData)
    });
    return res.json();
  },

  async updateMedicationAdministration(id, status, administered_by) {
    const res = await authFetch(`${API_BASE}/nurse/medications/${id}/administer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, administered_by })
    });
    return res.json();
  },

  // Pharmacy: Suppliers & Categories
  async getSuppliers() {
    const res = await authFetch(`${API_BASE}/pharmacy/suppliers`);
    return res.json();
  },

  async createSupplier(data) {
    const res = await authFetch(`${API_BASE}/pharmacy/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add supplier');
    return result;
  },

  async getCategories() {
    const res = await authFetch(`${API_BASE}/pharmacy/categories`);
    return res.json();
  },

  async createCategory(data) {
    const res = await authFetch(`${API_BASE}/pharmacy/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add category');
    return result;
  },

  // Notifications
  async getNotifications(role = 'All') {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    const res = await authFetch(`${API_BASE}/notifications?${params.toString()}`);
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
    return res.json();
  },

  // Receptionist Check-in
  async checkInPatient(id) {
    const res = await authFetch(`${API_BASE}/appointments/${id}/checkin`, { method: 'PUT' });
    return res.json();
  },

  // Financial Payments
  async getPaymentHistory() {
    const res = await authFetch(`${API_BASE}/billing/payments`);
    return res.json();
  },

  async recordPayment(paymentData) {
    const res = await authFetch(`${API_BASE}/billing/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record payment');
    return data;
  },

  // Profile
  async updateProfile(user_id, data) {
    const res = await authFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, ...data })
    });
    return res.json();
  },

  // Role Specific Dashboard Summaries
  async getRoleSummary(role, user_id = '') {
    const params = new URLSearchParams();
    if (user_id) params.append('user_id', user_id);
    const res = await authFetch(`${API_BASE}/role-summary/${encodeURIComponent(role)}?${params.toString()}`);
    return res.json();
  }
};

