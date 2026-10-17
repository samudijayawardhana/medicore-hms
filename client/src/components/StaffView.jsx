import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Building,
  Award,
  X,
  CalendarCheck,
  Calendar,
  FileText,
  Check,
  AlertCircle,
  LogIn,
  LogOut,
  Ban,
  CheckCircle2,
  Users
} from 'lucide-react';
import { api } from '../services/api';

const DEPARTMENTS = [
  'General Administration',
  'Nursing Services',
  'Pharmacy Services',
  'Laboratory & Diagnostics',
  'Finance & Cashier',
  'OPD & Channelling',
  'Emergency Care (ETU)',
  'Maintenance & Biomedical'
];

export default function StaffView() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'employees' | 'attendance' | 'leaves' (PDF 3.9)
  const [activeTab, setActiveTab] = useState('employees');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClockModal, setShowClockModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Form: Register Employee
  const [formData, setFormData] = useState({
    full_name: '',
    nic: '',
    role: 'Nurse',
    department: 'Nursing Services',
    designation: 'Staff Nurse',
    phone: '077-',
    email: '',
    salary_lkr: 145000
  });

  // Form: Clock In / Attendance
  const [clockForm, setClockForm] = useState({
    employee_name: '',
    designation: 'Staff Nurse',
    shift: 'Morning Shift (07:00 AM - 03:00 PM)',
    check_in: '07:30 AM',
    status: 'Present'
  });

  // Form: Apply Leave (PDF 3.9)
  const [leaveForm, setLeaveForm] = useState({
    employee_name: '',
    department: 'Nursing Services',
    leave_type: 'Casual Leave',
    start_date: '2026-10-20',
    end_date: '2026-10-21',
    days: 1,
    reason: 'Family urgent requirement'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [empList, attList, leaveList] = await Promise.all([
        api.getEmployees(),
        api.getStaffAttendance(),
        api.getStaffLeaves()
      ]);
      setEmployees(empList || []);
      setAttendance(attList || []);
      setLeaves(leaveList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.full_name || !formData.nic) {
      setFormError('Full name and NIC are required.');
      return;
    }

    try {
      await api.createEmployee(formData);
      setFormSuccess('Hospital employee registered successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        loadData();
      }, 900);
    } catch (err) {
      setFormError(err.message || 'Error adding staff');
    }
  };

  const handleClockAttendance = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.clockStaffAttendance(clockForm);
      setFormSuccess('Shift attendance marked successfully!');
      setTimeout(() => {
        setShowClockModal(false);
        loadData();
      }, 800);
    } catch (err) {
      setFormError(err.message || 'Error clocking attendance');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.applyStaffLeave(leaveForm);
      setFormSuccess('Staff leave request submitted successfully!');
      setTimeout(() => {
        setShowLeaveModal(false);
        loadData();
      }, 800);
    } catch (err) {
      setFormError(err.message || 'Error submitting leave');
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await api.updateStaffLeaveStatus(id, status);
      loadData();
    } catch (err) {
      alert('Error updating leave: ' + err.message);
    }
  };

  const formatLKR = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString('en-LK');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Staff Management
            </h2>
            <span className="badge badge-info">{employees.length} Personnel</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Employee registration, daily shift attendance, department assignments, and leave records (PDF Section 3.9).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setClockForm({
                employee_name: employees[0]?.full_name || 'Staff Nurse',
                designation: employees[0]?.designation || 'Staff Nurse',
                shift: 'Morning Shift (07:00 AM - 03:00 PM)',
                check_in: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                status: 'Present'
              });
              setShowClockModal(true);
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={16} /> Mark Shift Attendance
          </button>

          <button
            onClick={() => {
              setLeaveForm({
                employee_name: employees[0]?.full_name || 'Staff Member',
                department: employees[0]?.department || 'Nursing Services',
                leave_type: 'Casual Leave',
                start_date: '2026-10-20',
                end_date: '2026-10-21',
                days: 1,
                reason: 'Personal leave request'
              });
              setShowLeaveModal(true);
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calendar size={16} /> Apply Leave
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Register Employee
          </button>
        </div>
      </div>

      {/* Navigation Tabs (PDF Section 3.9: Registration, Attendance, Leave Records) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('employees')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'employees' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'employees' ? 'var(--brand-blue)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'employees' ? '700' : '500',
            fontSize: '0.875rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'employees' ? '3px solid var(--brand-blue)' : '3px solid transparent'
          }}
        >
          <Users size={16} /> Employee Directory ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'attendance' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'attendance' ? 'var(--brand-blue)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'attendance' ? '700' : '500',
            fontSize: '0.875rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'attendance' ? '3px solid var(--brand-blue)' : '3px solid transparent'
          }}
        >
          <Clock size={16} /> Attendance Logs ({attendance.length})
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'leaves' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'leaves' ? 'var(--brand-blue)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'leaves' ? '700' : '500',
            fontSize: '0.875rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'leaves' ? '3px solid var(--brand-blue)' : '3px solid transparent'
          }}
        >
          <CalendarCheck size={16} /> Leave Records & Requests ({leaves.length})
        </button>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Registered Hospital Personnel</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department Assignment & Payroll profiles</span>
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Full Name</th>
                  <th>National ID (NIC)</th>
                  <th>Department Assignment (PDF 3.9)</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Salary (LKR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                      Loading staff directory...
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <span style={{ fontWeight: '800', color: 'var(--brand-blue)', fontSize: '0.825rem', fontFamily: 'monospace' }}>
                          {emp.emp_no}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{emp.full_name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Joined: {emp.join_date}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {emp.nic}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: '600' }}>
                          {emp.department}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{emp.designation}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{emp.role}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem' }}>{emp.phone}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                          {formatLKR(emp.salary_lkr)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success">{emp.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE LOGS (PDF Section 3.9: Attendance) */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick attendance stat ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL PRESENT TODAY</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success)', marginTop: '4px' }}>
                {attendance.filter(a => a.status === 'Present').length} Staff
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Clocked in for duty</div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>ON APPROVED LEAVE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--brand-blue)', marginTop: '4px' }}>
                {leaves.filter(l => l.status === 'Approved').length} Staff
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Official leave roster</div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>ACTIVE CLINICAL SHIFTS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--brand-teal)', marginTop: '4px' }}>
                Morning Shift
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>07:00 AM - 03:00 PM</div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Clinical Shift Attendance Log</h3>
              <button
                onClick={() => setShowClockModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Record Clock-In
              </button>
            </div>

            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>Assigned Shift</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Date</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => (
                    <tr key={att.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-muted)' }}>
                          #{att.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{att.employee_name}</div>
                      </td>
                      <td>{att.designation}</td>
                      <td>{att.shift || 'Morning Shift'}</td>
                      <td>
                        <span style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                          {att.check_in}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: att.check_out === 'On Duty' ? 'var(--brand-blue)' : 'var(--text-secondary)', fontWeight: '600' }}>
                          {att.check_out}
                        </span>
                      </td>
                      <td>{att.date || '2026-10-15'}</td>
                      <td>
                        <span className={`badge ${att.status === 'Present' ? 'badge-success' : 'badge-warning'}`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE RECORDS (PDF Section 3.9: Leave Records) */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Statutory Leave Balances Card */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} style={{ color: 'var(--brand-blue)' }} /> Sri Lankan Healthcare Statutory Leave Entitlements
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>CASUAL LEAVE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--brand-blue)', marginTop: '2px' }}>7 Days / Yr</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Personal & urgent matters</div>
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>ANNUAL / VACATION</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-success)', marginTop: '2px' }}>14 Days / Yr</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Planned annual holidays</div>
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>MEDICAL LEAVE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--brand-teal)', marginTop: '2px' }}>14 Days / Yr</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>With government medical certificate</div>
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>DUTY & MATERNITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#9333ea', marginTop: '2px' }}>Standard MoH</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ministry of Health policy</div>
              </div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Staff Leave Records & Pending Approvals</h3>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> New Leave Request
              </button>
            </div>

            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Leave Category</th>
                    <th>Date Period</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-muted)' }}>
                          #L-{l.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{l.employee_name}</div>
                      </td>
                      <td>{l.department}</td>
                      <td>
                        <span className="badge badge-info">{l.leave_type}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                          {l.start_date} to {l.end_date}
                        </span>
                      </td>
                      <td>
                        <strong>{l.days} day(s)</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {l.reason}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            l.status === 'Approved'
                              ? 'badge-success'
                              : l.status === 'Rejected'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {l.status === 'Pending' ? (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleUpdateLeaveStatus(l.id, 'Approved')}
                              className="btn btn-success btn-sm"
                              title="Approve Leave"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateLeaveStatus(l.id, 'Rejected')}
                              className="btn btn-danger btn-sm"
                              title="Reject Leave"
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Decision Logged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Register Employee (PDF Section 3.9) */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Register Hospital Employee</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Staff Management Specification (PDF Section 3.9)</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} style={{ padding: '24px' }}>
              {formError && (
                <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 14px', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nursing Officer Dilani Perera"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">National ID (NIC) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 198941201923"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hospital Department Assignment *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation / Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Nurse, Pharmacist, MLT"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Access Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Laboratory Staff">Laboratory Staff</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="077-XXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Base Salary (LKR)</label>
                  <input
                    type="number"
                    value={formData.salary_lkr}
                    onChange={(e) => setFormData({ ...formData, salary_lkr: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Mark Shift Attendance (PDF Section 3.9: Attendance) */}
      {showClockModal && (
        <div className="modal-backdrop" onClick={() => setShowClockModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Mark Shift Attendance</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Biometric & Manual Attendance Logging</p>
              </div>
              <button onClick={() => setShowClockModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleClockAttendance} style={{ padding: '24px' }}>
              {formError && (
                <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 14px', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select
                    value={clockForm.employee_name}
                    onChange={(e) => setClockForm({ ...clockForm, employee_name: e.target.value })}
                    className="input-field"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.full_name}>
                        {emp.full_name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Shift</label>
                  <select
                    value={clockForm.shift}
                    onChange={(e) => setClockForm({ ...clockForm, shift: e.target.value })}
                    className="input-field"
                  >
                    <option value="Morning Shift (07:00 AM - 03:00 PM)">Morning Shift (07:00 AM - 03:00 PM)</option>
                    <option value="Evening Shift (01:00 PM - 09:00 PM)">Evening Shift (01:00 PM - 09:00 PM)</option>
                    <option value="Night Duty (08:00 PM - 08:00 AM)">Night Duty (08:00 PM - 08:00 AM)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Check In Timestamp</label>
                  <input
                    type="text"
                    value={clockForm.check_in}
                    onChange={(e) => setClockForm({ ...clockForm, check_in: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={clockForm.status}
                    onChange={(e) => setClockForm({ ...clockForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="Present">Present (On-Time)</option>
                    <option value="Late">Late Check-in</option>
                    <option value="On Duty">On Duty (Ward / ETU)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowClockModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Apply Leave (PDF Section 3.9: Leave Records) */}
      {showLeaveModal && (
        <div className="modal-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Apply Staff Leave</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Leave Records & Approval Request (PDF 3.9)</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} style={{ padding: '24px' }}>
              {formError && (
                <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 14px', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select
                    value={leaveForm.employee_name}
                    onChange={(e) => {
                      const emp = employees.find(em => em.full_name === e.target.value);
                      setLeaveForm({
                        ...leaveForm,
                        employee_name: e.target.value,
                        department: emp?.department || leaveForm.department
                      });
                    }}
                    className="input-field"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.full_name}>
                        {emp.full_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Category (PDF 3.9) *</label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="Casual Leave">Casual Leave (Short duration)</option>
                    <option value="Annual Leave">Annual / Vacation Leave</option>
                    <option value="Medical Leave">Medical Leave (Sick cert)</option>
                    <option value="Duty Leave">Duty / Official Training Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Working Days</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={leaveForm.days}
                    onChange={(e) => setLeaveForm({ ...leaveForm, days: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Leave Request *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Attending family function, Doctor appointment, Rest"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
