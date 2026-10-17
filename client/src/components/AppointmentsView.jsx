import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  Printer,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  CreditCard,
  Ticket,
  Calendar as CalendarIcon,
  RotateCcw,
  Ban,
  Check,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { api } from '../services/api';

export default function AppointmentsView({
  preselectedPatient,
  preselectedDoctor,
  onConsultNow,
  activeTab = '',
  currentRole = '',
  currentUser = null
}) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: Queue List vs Calendar View (PDF Section 7 Specification)
  const [viewMode, setViewMode] = useState('queue'); // 'queue' | 'calendar'
  const isDoctor = currentRole === 'Doctor';

  // Filter States
  const [filterDoctor, setFilterDoctor] = useState(() => {
    if (preselectedDoctor) return String(preselectedDoctor.id);
    if (activeTab === 'doctor-appointments' || currentRole === 'Doctor') return currentUser?.id ? String(currentUser.id) : '';
    return '';
  });
  const [filterStatus, setFilterStatus] = useState(() => {
    if (activeTab === 'patient-checkin') return 'Scheduled';
    return 'All';
  });
  const [selectedDate, setSelectedDate] = useState('2026-10-15');

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '2026-10-15',
    time_slot: '',
    reason: 'Specialist Consultation'
  });

  // Reschedule Modal (PDF 3.4)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    appointment_date: '2026-10-16',
    time_slot: '05:00 PM - 05:30 PM'
  });

  // Cancel Modal (PDF 3.4)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');

  // Token Print Modal
  const [tokenSlip, setTokenSlip] = useState(null);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Calendar Navigation (Year 2026, Month October)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(9); // 0-indexed (9 = October)

  const loadData = async () => {
    setLoading(true);
    try {
      const [apts, docs, pts] = await Promise.all([
        api.getAppointments(viewMode === 'calendar' ? '' : selectedDate, filterDoctor, filterStatus),
        api.getDoctors(),
        api.getPatients()
      ]);
      setAppointments(Array.isArray(apts) ? apts : (apts?.data || []));
      setDoctors(Array.isArray(docs) ? docs : (docs?.data || []));
      setPatients(Array.isArray(pts) ? pts : (pts?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, filterDoctor, filterStatus, viewMode]);

  useEffect(() => {
    if (preselectedDoctor || preselectedPatient) {
      setFormData(prev => ({
        ...prev,
        doctor_id: preselectedDoctor ? preselectedDoctor.id : prev.doctor_id,
        patient_id: preselectedPatient ? preselectedPatient.id : prev.patient_id,
        time_slot: preselectedDoctor?.available_time_slot || prev.time_slot
      }));
      setShowBookModal(true);
    }
  }, [preselectedDoctor, preselectedPatient]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReschedule = (apt) => {
    setReschedulingApt(apt);
    setRescheduleData({
      appointment_date: apt.appointment_date || '2026-10-16',
      time_slot: apt.time_slot || '04:30 PM - 05:00 PM'
    });
    setFormError('');
    setFormSuccess('');
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.rescheduleAppointment(
        reschedulingApt.id,
        rescheduleData.appointment_date,
        rescheduleData.time_slot
      );
      setFormSuccess(`Appointment #${reschedulingApt.appointment_no} rescheduled successfully!`);
      setTimeout(() => {
        setShowRescheduleModal(false);
        loadData();
      }, 800);
    } catch (err) {
      setFormError(err.message || 'Failed to reschedule appointment');
    }
  };

  const handleOpenCancel = (apt) => {
    setCancellingApt(apt);
    setCancelReason('Patient requested cancellation due to personal reasons');
    setFormError('');
    setFormSuccess('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.cancelAppointment(cancellingApt.id, cancelReason);
      setFormSuccess(`Appointment #${cancellingApt.appointment_no} cancelled.`);
      setTimeout(() => {
        setShowCancelModal(false);
        loadData();
      }, 800);
    } catch (err) {
      setFormError(err.message || 'Failed to cancel appointment');
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.patient_id || !formData.doctor_id) {
      setFormError('Please select both Patient and Doctor.');
      return;
    }

    try {
      const booked = await api.createAppointment(formData);
      setFormSuccess(`Token #${booked.token_number} issued successfully!`);
      setTimeout(() => {
        setShowBookModal(false);
        loadData();
      }, 800);
    } catch (err) {
      setFormError(err.message || 'Failed to book appointment');
    }
  };

  const formatLKR = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString('en-LK');
  };

  // Calendar Matrix Generator
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 for Sunday
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayAppointments = appointments.filter(a => (a.appointment_date || '').startsWith(dStr));
    calendarDays.push({ day: d, dateStr: dStr, appointments: dayAppointments });
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Mode Toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Appointment Management
            </h2>
            <span className="badge badge-info">{appointments.length} Total</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isDoctor
              ? 'Consultant OPD clinical queue and patient schedule (Doctor View-Only).'
              : 'Schedule, reschedule, cancel, and track OPD patient queue & calendar (PDF Section 3.4 & 7).'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Tab View Toggle (PDF Section 7: Calendar View vs Queue) */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('queue')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'queue' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'queue' ? 'var(--brand-blue)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'queue' ? '700' : '500',
                fontSize: '0.825rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'queue' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <List size={15} /> Queue List
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'calendar' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--brand-blue)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'calendar' ? '700' : '500',
                fontSize: '0.825rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'calendar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <CalendarDays size={15} /> Calendar View
            </button>
          </div>

          {!isDoctor && (
            <button
              onClick={() => {
                setFormData({
                  patient_id: patients[0]?.id || '',
                  doctor_id: doctors[0]?.id || '',
                  appointment_date: selectedDate,
                  time_slot: doctors[0]?.available_time_slot || '04:30 PM - 08:30 PM',
                  reason: 'Consultant Clinical Review'
                });
                setShowBookModal(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Schedule Appointment
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Consultation Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
            style={{ width: '160px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Doctor Selection (PDF Section 7)
          </label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="input-field"
            style={{ width: '230px' }}
          >
            <option value="">All Consultant Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Queue Status (PDF 3.4)
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
            style={{ width: '170px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Checked-in">Checked-in</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: CALENDAR VIEW (PDF Section 7 Specification) */}
      {viewMode === 'calendar' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                {monthNames[calMonth]} {calYear}
              </h3>
              <span className="badge badge-info">Monthly Clinic Overview</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(calYear - 1);
                  } else {
                    setCalMonth(calMonth - 1);
                  }
                }}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => {
                  setCalMonth(9);
                  setCalYear(2026);
                }}
                className="btn btn-secondary btn-sm"
              >
                Current Month
              </button>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(calYear + 1);
                  } else {
                    setCalMonth(calMonth + 1);
                  }
                }}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px'
                }}
              >
                {d}
              </div>
            ))}

            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    style={{
                      minHeight: '90px',
                      background: 'rgba(241, 245, 249, 0.4)',
                      borderRadius: '8px'
                    }}
                  />
                );
              }

              const isSelected = selectedDate === cell.dateStr;
              const count = cell.appointments.length;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  style={{
                    minHeight: '95px',
                    padding: '8px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--brand-blue)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(2, 132, 199, 0.05)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: isSelected ? '800' : '600', fontSize: '0.85rem', color: isSelected ? 'var(--brand-blue)' : 'var(--text-main)' }}>
                      {cell.day}
                    </span>
                    {count > 0 && (
                      <span className="badge badge-info" style={{ fontSize: '0.675rem', padding: '2px 6px' }}>
                        {count} apt{count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {cell.appointments.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        style={{
                          fontSize: '0.675rem',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: a.status === 'Completed' ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
                          color: a.status === 'Completed' ? 'var(--color-success)' : 'var(--brand-blue)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: '600'
                        }}
                      >
                        #{a.token_number} {a.patient_name}
                      </div>
                    ))}
                    {count > 2 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        +{count - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Selected date: <strong>{selectedDate}</strong> ({appointments.filter(a => (a.appointment_date || '').startsWith(selectedDate)).length} appointments)</span>
            <button onClick={() => setViewMode('queue')} className="btn btn-secondary btn-sm">
              Show Queue for Selected Date
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: QUEUE CARDS VIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            Loading OPD channelling queue...
          </div>
        ) : appointments.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            No appointments scheduled for this date & filter criteria.
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                borderTop: apt.status === 'In Consultation' ? '4px solid var(--color-warning)' : apt.status === 'Completed' ? '4px solid var(--color-success)' : apt.status === 'Cancelled' ? '4px solid var(--color-danger)' : '4px solid var(--brand-blue)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--brand-gradient)',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    #{apt.token_number}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {apt.appointment_no}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '1px 0' }}>
                      {apt.patient_name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      NIC: {apt.patient_nic} • {apt.patient_phone}
                    </div>
                  </div>
                </div>

                <span
                  className={`badge ${
                    apt.status === 'Completed'
                      ? 'badge-success'
                      : apt.status === 'In Consultation'
                      ? 'badge-warning'
                      : apt.status === 'Checked-in'
                      ? 'badge-info'
                      : apt.status === 'Cancelled'
                      ? 'badge-danger'
                      : apt.status === 'Rescheduled'
                      ? 'badge-warning'
                      : 'badge-secondary'
                  }`}
                >
                  {apt.status}
                </span>
              </div>

              {/* Consultation Details */}
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.825rem' }}>
                <div style={{ fontWeight: '700', color: 'var(--brand-blue)' }}>
                  {apt.doctor_name}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {apt.doctor_specialization} • {apt.doctor_room || 'OPD Room 101'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>Slot: {apt.time_slot}</span>
                  <span>Fee: <strong>{formatLKR(apt.fee || 3000)}</strong></span>
                </div>
                {apt.cancellation_reason && (
                  <div style={{ fontSize: '0.725rem', color: 'var(--color-danger)', fontWeight: '600', marginTop: '2px' }}>
                    Reason: {apt.cancellation_reason}
                  </div>
                )}
              </div>

              {/* Queue Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setTokenSlip(apt)}
                  className="btn btn-secondary btn-sm"
                  title="Print Channelling Token Slip"
                >
                  <Printer size={13} /> Token Slip
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {!isDoctor && apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                    <>
                      <button
                        onClick={() => handleOpenReschedule(apt)}
                        className="btn btn-secondary btn-sm"
                        title="Reschedule Appointment Date & Slot (PDF 3.4)"
                      >
                        <RotateCcw size={13} /> Reschedule
                      </button>

                      <button
                        onClick={() => handleOpenCancel(apt)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        title="Cancel Appointment (PDF 3.4)"
                      >
                        <Ban size={13} /> Cancel
                      </button>
                    </>
                  )}

                  {apt.status === 'Scheduled' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'Checked-in')}
                      className="btn btn-secondary btn-sm"
                    >
                      Check-In
                    </button>
                  )}
                  {apt.status === 'Checked-in' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'In Consultation')}
                      className="btn btn-primary btn-sm"
                    >
                      Call In
                    </button>
                  )}
                  {apt.status === 'In Consultation' && (
                    <button
                      onClick={() => {
                        handleStatusChange(apt.id, 'Completed');
                        if (onConsultNow) onConsultNow(apt);
                      }}
                      className="btn btn-success btn-sm"
                    >
                      <CheckCircle size={13} /> Complete Visit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Book Channelling Token (PDF 3.4 & 7) */}
      {showBookModal && (
        <div className="modal-backdrop" onClick={() => setShowBookModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Schedule Appointment (Token)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Automated Token generation & consultation roster (PDF 3.4)</p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBook} style={{ padding: '24px' }}>
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
                  <label className="form-label">Select Registered Patient *</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">-- Choose Patient (NIC) --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.nic}) - {p.patient_no}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor Selection (PDF Section 7) *</label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => {
                      const doc = doctors.find(d => d.id === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        doctor_id: e.target.value,
                        time_slot: doc?.available_time_slot || '04:30 PM - 08:30 PM'
                      });
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">-- Choose Consultant Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.specialization}) - {formatLKR(d.consultation_fee)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Appointment Date</label>
                    <input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Time Slot</label>
                    <input
                      type="text"
                      value={formData.time_slot}
                      onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Clinical Chief Complaint</label>
                  <input
                    type="text"
                    placeholder="e.g. Regular review, Blood pressure check, Follow up"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Token Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reschedule Appointment (PDF Section 3.4: Reschedule Appointment) */}
      {showRescheduleModal && reschedulingApt && (
        <div className="modal-backdrop" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Reschedule Appointment</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', fontWeight: '600', margin: '2px 0 0 0' }}>
                  Token #{reschedulingApt.token_number} - {reschedulingApt.patient_name}
                </p>
              </div>
              <button onClick={() => setShowRescheduleModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} style={{ padding: '24px' }}>
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
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Current: <strong>{reschedulingApt.appointment_date}</strong> at <strong>{reschedulingApt.time_slot}</strong> with {reschedulingApt.doctor_name}
                </div>

                <div className="form-group">
                  <label className="form-label">New Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleData.appointment_date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, appointment_date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Clinic Time Slot *</label>
                  <input
                    type="text"
                    required
                    value={rescheduleData.time_slot}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, time_slot: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Cancel Appointment (PDF Section 3.4: Cancel Appointment) */}
      {showCancelModal && cancellingApt && (
        <div className="modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--color-danger)' }}>
                  Cancel Appointment
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Token #{cancellingApt.token_number} - {cancellingApt.patient_name}
                </p>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} style={{ padding: '24px' }}>
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

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Are you sure you want to cancel this channelling appointment? The slot will be released back to the hospital token pool.
              </p>

              <div className="form-group">
                <label className="form-label">Cancellation Reason *</label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Patient requested, Consultant emergency, Rescheduled"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCancelModal(false)} className="btn btn-secondary">
                  Back
                </button>
                <button type="submit" className="btn btn-danger">
                  Cancel Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Printable Token Slip */}
      {tokenSlip && (
        <div className="modal-backdrop" onClick={() => setTokenSlip(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%', padding: '24px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--brand-blue)' }}>MEDICORE HOSPITAL</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No. 452, Galle Road, Colombo 03 • Tel: 011-2345678</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '8px' }}>OPD CHANNELLING TOKEN</div>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOKEN NUMBER</div>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--brand-blue)', lineHeight: 1.1 }}>
                #{tokenSlip.token_number}
              </div>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>
                {tokenSlip.status}
              </span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Patient:</strong> {tokenSlip.patient_name}</div>
              <div><strong>NIC:</strong> {tokenSlip.patient_nic}</div>
              <div><strong>Doctor:</strong> {tokenSlip.doctor_name}</div>
              <div><strong>Specialization:</strong> {tokenSlip.doctor_specialization}</div>
              <div><strong>Date & Time:</strong> {tokenSlip.appointment_date} • {tokenSlip.time_slot}</div>
              <div><strong>Room:</strong> {tokenSlip.doctor_room || 'Room 101'}</div>
              <div><strong>Fee:</strong> {formatLKR(tokenSlip.fee || 3000)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setTokenSlip(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Close
              </button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
                <Printer size={15} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
