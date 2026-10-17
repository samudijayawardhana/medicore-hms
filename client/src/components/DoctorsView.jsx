import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  X,
  CreditCard,
  Edit2,
  CalendarDays,
  Building,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const DEPARTMENTS = [
  'All',
  'Cardiology',
  'Pediatrics',
  'General Medicine',
  'Obstetrics & Gynecology',
  'Orthopedics',
  'General Surgery',
  'Neurology',
  'Dermatology',
  'ETU / Emergency Care'
];

export default function DoctorsView({ onBookDoctorAppointment }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    slmc_reg_no: 'SLMC-',
    specialization: '',
    department: 'General Medicine',
    qualification: 'MBBS (Colombo), MD',
    phone: '077-',
    email: '',
    room_number: 'Room 101',
    consultation_fee: 3000,
    available_days: 'Mon, Tue, Wed, Thu, Fri',
    available_time_slot: '04:30 PM - 08:30 PM',
    max_tokens: 30
  });

  const [scheduleData, setScheduleData] = useState({
    available_days: 'Mon, Wed, Fri',
    available_time_slot: '04:30 PM - 08:30 PM',
    max_tokens: 30,
    room_number: 'Room 101'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctors(selectedDept, searchTerm);
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedDept, searchTerm]);

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      slmc_reg_no: 'SLMC-',
      specialization: '',
      department: 'General Medicine',
      qualification: 'MBBS (Colombo), MD',
      phone: '077-1234567',
      email: '',
      room_number: 'Room 101',
      consultation_fee: 3000,
      available_days: 'Mon, Wed, Fri',
      available_time_slot: '04:30 PM - 08:30 PM',
      max_tokens: 30
    });
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (doc) => {
    setSelectedDoctor(doc);
    setFormData({
      full_name: doc.full_name || '',
      slmc_reg_no: doc.slmc_reg_no || '',
      specialization: doc.specialization || '',
      department: doc.department || 'General Medicine',
      qualification: doc.qualification || '',
      phone: doc.phone || '',
      email: doc.email || '',
      room_number: doc.room_number || '',
      consultation_fee: doc.consultation_fee || 3000,
      available_days: doc.available_days || 'Mon, Wed, Fri',
      available_time_slot: doc.available_time_slot || '04:30 PM - 08:30 PM',
      max_tokens: doc.max_tokens || 30
    });
    setFormError('');
    setFormSuccess('');
    setShowEditModal(true);
  };

  const handleOpenSchedule = (doc) => {
    setSelectedDoctor(doc);
    setScheduleData({
      available_days: doc.available_days || 'Mon, Wed, Fri',
      available_time_slot: doc.available_time_slot || '04:30 PM - 08:30 PM',
      max_tokens: doc.max_tokens || 30,
      room_number: doc.room_number || 'Room 101'
    });
    setFormError('');
    setFormSuccess('');
    setShowScheduleModal(true);
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.full_name || !formData.slmc_reg_no || !formData.specialization) {
      setFormError('Doctor full name, SLMC registration number, and specialization are required.');
      return;
    }

    try {
      await api.createDoctor(formData);
      setFormSuccess('Doctor consultant registered successfully to channelling roster!');
      setTimeout(() => {
        setShowAddModal(false);
        fetchDoctors();
      }, 900);
    } catch (err) {
      setFormError(err.message || 'Error creating doctor');
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.updateDoctor(selectedDoctor.id, formData);
      setFormSuccess('Doctor details and department assignment updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        fetchDoctors();
      }, 900);
    } catch (err) {
      setFormError(err.message || 'Failed to update doctor details');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.updateDoctor(selectedDoctor.id, {
        ...selectedDoctor,
        available_days: scheduleData.available_days,
        available_time_slot: scheduleData.available_time_slot,
        max_tokens: scheduleData.max_tokens,
        room_number: scheduleData.room_number
      });
      setFormSuccess(`Channelling schedule for ${selectedDoctor.full_name} updated successfully!`);
      setTimeout(() => {
        setShowScheduleModal(false);
        fetchDoctors();
      }, 900);
    } catch (err) {
      setFormError(err.message || 'Failed to update schedule');
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
              Doctor Management
            </h2>
            <span className="badge badge-info">{doctors.length} Specialists</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            SLMC registered specialist consultants, department assignments, and clinic schedules (PDF Section 3.3).
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Consultant Doctor
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by doctor name, SLMC reg no, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="input-field"
          style={{ width: '220px' }}
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept === 'All' ? 'All Departments' : dept}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            Loading doctor directories...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            No doctors found matching filters.
          </div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                borderLeft: '4px solid var(--brand-blue)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                      {doc.full_name}
                    </h3>
                    <div style={{ fontSize: '0.825rem', color: 'var(--brand-blue)', fontWeight: '700', marginTop: '2px' }}>
                      {doc.specialization}
                    </div>
                  </div>
                  <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
                    {doc.slmc_reg_no}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {doc.qualification}
                </div>

                {/* Details Pills */}
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--brand-teal)' }} />
                    <span>{doc.room_number || 'Room 101'} • Dept: <strong>{doc.department}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} style={{ color: 'var(--brand-teal)' }} />
                    <span>Days: <strong>{doc.available_days}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Clock size={14} style={{ color: 'var(--brand-teal)' }} />
                    <span>{doc.available_time_slot} (Max {doc.max_tokens || 30} Tokens)</span>
                  </div>
                </div>
              </div>

              {/* Fee & Action Footer */}
              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Channelling Fee</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-success)' }}>
                    {formatLKR(doc.consultation_fee)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="btn btn-secondary btn-sm"
                    title="Update Doctor Details & Department"
                  >
                    <Edit2 size={13} /> Edit
                  </button>

                  <button
                    onClick={() => handleOpenSchedule(doc)}
                    className="btn btn-secondary btn-sm"
                    title="Manage Consultation Schedule & Slots"
                  >
                    <Clock size={13} /> Schedule
                  </button>

                  <button
                    onClick={() => onBookDoctorAppointment && onBookDoctorAppointment(doc)}
                    className="btn btn-primary btn-sm"
                    title="Issue Patient Channelling Token"
                  >
                    <Calendar size={13} /> Book
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Add Doctor (PDF 3.3) */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Add Doctor Consultant</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Register specialist to MediCore channelling roster</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} style={{ padding: '24px' }}>
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
                  <label className="form-label">Doctor Full Name (with prefix) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Asela Wickramasinghe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SLMC Registration No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SLMC-38491"
                    value={formData.slmc_reg_no}
                    onChange={(e) => setFormData({ ...formData, slmc_reg_no: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consultant Cardiologist"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
                    {DEPARTMENTS.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS (Col), MD, FRCP"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consultation Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 104"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consultation Fee (LKR)</label>
                  <input
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Available Clinic Days</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon, Wed, Fri"
                    value={formData.available_days}
                    onChange={(e) => setFormData({ ...formData, available_days: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinic Time Slot</label>
                  <input
                    type="text"
                    placeholder="04:30 PM - 08:30 PM"
                    value={formData.available_time_slot}
                    onChange={(e) => setFormData({ ...formData, available_time_slot: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Token Capacity</label>
                  <input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Update Doctor Details & Department Assignment (PDF 3.3) */}
      {showEditModal && selectedDoctor && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Update Doctor Details</h3>
                  <span className="badge badge-info">{selectedDoctor.slmc_reg_no}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Department Assignment & Clinical Details (PDF Section 3.3)
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} style={{ padding: '24px' }}>
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
                  <label className="form-label">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department Assignment (PDF 3.3) *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                  >
                    {DEPARTMENTS.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Consultation Fee (LKR)</label>
                  <input
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Doctor Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Schedule Management (PDF Section 3.3: Schedule Management) */}
      {showScheduleModal && selectedDoctor && (
        <div className="modal-backdrop" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Schedule Management</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', fontWeight: '600', margin: '2px 0 0 0' }}>
                  {selectedDoctor.full_name} ({selectedDoctor.specialization})
                </p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} style={{ padding: '24px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Available Channelling Days (PDF 3.3)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mon, Tue, Thu, Sat"
                    value={scheduleData.available_days}
                    onChange={(e) => setScheduleData({ ...scheduleData, available_days: e.target.value })}
                    className="input-field"
                  />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Separate days with commas (e.g. Mon, Wed, Fri)</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinic Session Time Slot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM - 09:00 PM"
                    value={scheduleData.available_time_slot}
                    onChange={(e) => setScheduleData({ ...scheduleData, available_time_slot: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Max Token Slots</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="100"
                      value={scheduleData.max_tokens}
                      onChange={(e) => setScheduleData({ ...scheduleData, max_tokens: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Allocated Room</label>
                    <input
                      type="text"
                      required
                      value={scheduleData.room_number}
                      onChange={(e) => setScheduleData({ ...scheduleData, room_number: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
