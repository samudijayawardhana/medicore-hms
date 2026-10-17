import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  Thermometer,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Pill,
  User,
  Calendar,
  Save,
  Filter,
  RefreshCw,
  BedDouble,
  Stethoscope
} from 'lucide-react';
import { api } from '../services/api';

export default function NurseCareView({ activeTab = 'nurse-patients', currentUser }) {
  const normalizeTab = (tab) => (!tab || tab === 'nurse-care' ? 'nurse-patients' : tab);
  const [currentTab, setCurrentTab] = useState(() => normalizeTab(activeTab));
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modal / Form states
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Vitals form
  const [vitalForm, setVitalForm] = useState({
    patient_id: '',
    temperature: 98.6,
    blood_pressure: '120/80',
    pulse: 72,
    respiratory_rate: 18,
    spo2: 98,
    notes: ''
  });

  // Note form
  const [noteForm, setNoteForm] = useState({
    patient_id: '',
    notes: '',
    observations: ''
  });

  useEffect(() => {
    setCurrentTab(normalizeTab(activeTab));
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ptData, admData, vtData, ntData, medData, aptData] = await Promise.all([
        api.getPatients(),
        api.getInpatientAdmissions(),
        api.getVitals(),
        api.getNursingNotes(),
        api.getMedicationAdministration(),
        api.getAppointments()
      ]);
      setPatients(Array.isArray(ptData) ? ptData : (ptData?.data || []));
      setAdmissions(Array.isArray(admData) ? admData : (admData?.data || []));
      setVitals(Array.isArray(vtData) ? vtData : (vtData?.data || []));
      setNotes(Array.isArray(ntData) ? ntData : (ntData?.data || []));
      setMedications(Array.isArray(medData) ? medData : (medData?.data || []));
      setAppointments(Array.isArray(aptData) ? aptData : (aptData?.data || []));
    } catch (err) {
      console.error('Error loading nursing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    if (!vitalForm.patient_id) {
      showNotification('Please select a patient.', 'error');
      return;
    }
    try {
      await api.createVitals({
        ...vitalForm,
        recorded_by_name: currentUser?.full_name || 'Staff Nurse'
      });
      showNotification('Vital signs recorded successfully!');
      setShowVitalModal(false);
      setVitalForm({
        patient_id: '',
        temperature: 98.6,
        blood_pressure: '120/80',
        pulse: 72,
        respiratory_rate: 18,
        spo2: 98,
        notes: ''
      });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to record vitals', 'error');
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteForm.patient_id || !noteForm.notes.trim()) {
      showNotification('Please select a patient and enter nursing notes.', 'error');
      return;
    }
    try {
      await api.createNursingNote({
        ...noteForm,
        nurse_name: currentUser?.full_name || 'Staff Nurse'
      });
      showNotification('Nursing note saved successfully!');
      setShowNoteModal(false);
      setNoteForm({ patient_id: '', notes: '', observations: '' });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to save note', 'error');
    }
  };

  const handleAdministerMed = async (id, status) => {
    try {
      await api.updateMedicationAdministration(id, status, currentUser?.full_name || 'Staff Nurse');
      showNotification(`Medication marked as ${status}!`);
      loadData();
    } catch (err) {
      showNotification('Failed to update medication administration', 'error');
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nurse Station & Clinical Inpatient Care
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: '4px 0 0 0' }}>
            {currentTab === 'nurse-patients' && 'Assigned Inpatient Ward'}
            {currentTab === 'patient-care' && 'Patient Care & Daily Rounds'}
            {currentTab === 'vital-signs' && 'Patient Vital Signs Recording'}
            {currentTab === 'nursing-notes' && 'Clinical Nursing Notes & Observations'}
            {currentTab === 'medication-admin' && 'Medication Administration Record (MAR)'}
            {currentTab === 'nurse-schedule' && 'Ward & Patient Care Schedule'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          {currentTab === 'vital-signs' && (
            <button
              onClick={() => setShowVitalModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Record Vital Signs</span>
            </button>
          )}
          {currentTab === 'nursing-notes' && (
            <button
              onClick={() => setShowNoteModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Add Nursing Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'nurse-patients', label: 'Assigned Patients', icon: BedDouble },
          { id: 'patient-care', label: 'Patient Care', icon: Heart },
          { id: 'vital-signs', label: 'Vital Signs', icon: Thermometer },
          { id: 'nursing-notes', label: 'Nursing Notes', icon: FileText },
          { id: 'medication-admin', label: 'Medication Administration', icon: Pill },
          { id: 'nurse-schedule', label: 'Care Schedule', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.9rem',
                color: isActive ? '#0284c7' : '#64748b',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification banner */}
      {msg.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: msg.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: msg.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{msg.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search patients, ward, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>
      </div>

      {/* Tab 1: Assigned Patients */}
      {currentTab === 'nurse-patients' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Admission No</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient Name</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Ward & Bed</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Primary Doctor</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Diagnosis / Reason</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Care Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions
                .filter(a => !search || (a.patient_name || '').toLowerCase().includes(search.toLowerCase()) || (a.ward || '').toLowerCase().includes(search.toLowerCase()))
                .map(adm => (
                  <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{adm.admission_no}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{adm.patient_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>NIC: {adm.patient_nic || 'N/A'} • {adm.patient_phone || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-info">{adm.ward} - {adm.bed_no}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', fontWeight: '500' }}>{adm.doctor_name || 'Dr. Consultant'}</td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>{adm.reason || 'Medical Observation'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${adm.status === 'Admitted' ? 'badge-success' : 'badge-secondary'}`}>
                        {adm.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setVitalForm(prev => ({ ...prev, patient_id: adm.patient_id }));
                          setShowVitalModal(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Record Vitals
                      </button>
                    </td>
                  </tr>
                ))}
              {admissions.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No assigned inpatients found in ward.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Patient Care */}
      {currentTab === 'patient-care' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {admissions.map(adm => {
            const patientVitals = vitals.filter(v => v.patient_id === adm.patient_id);
            const latestVital = patientVitals[0];
            return (
              <div key={adm.id} className="card" style={{ padding: '20px', borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{adm.patient_name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{adm.ward} • {adm.bed_no}</div>
                  </div>
                  <span className="badge badge-success">{adm.status}</span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>
                  <strong>Attending:</strong> {adm.doctor_name} <br />
                  <strong>Diagnosis:</strong> {adm.reason}
                </div>

                {latestVital ? (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.825rem' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Latest Vitals:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>BP: <strong style={{ color: '#0284c7' }}>{latestVital.blood_pressure}</strong></div>
                      <div>Temp: <strong>{latestVital.temperature}°F</strong></div>
                      <div>Pulse: <strong>{latestVital.pulse} bpm</strong></div>
                      <div>SpO2: <strong style={{ color: '#16a34a' }}>{latestVital.spo2}%</strong></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#b45309' }}>
                    No vitals recorded today. Immediate measurement recommended.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setVitalForm(prev => ({ ...prev, patient_id: adm.patient_id }));
                      setShowVitalModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                  >
                    + Vitals
                  </button>
                  <button
                    onClick={() => {
                      setNoteForm(prev => ({ ...prev, patient_id: adm.patient_id }));
                      setShowNoteModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                  >
                    + Note
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Vital Signs */}
      {currentTab === 'vital-signs' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Temperature</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Blood Pressure</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Pulse (bpm)</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Resp. Rate</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>SpO2 (%)</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Recorded By & Time</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Observations</th>
              </tr>
            </thead>
            <tbody>
              {vitals
                .filter(v => !search || (v.patient_name || '').toLowerCase().includes(search.toLowerCase()) || (v.recorded_by_name || '').toLowerCase().includes(search.toLowerCase()))
                .map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f172a' }}>
                      {v.patient_name || `Patient #${v.patient_id}`}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: '600', color: v.temperature > 99.5 ? '#dc2626' : '#334155' }}>
                        {v.temperature}°F
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{v.blood_pressure}</td>
                    <td style={{ padding: '14px 20px' }}>{v.pulse} bpm</td>
                    <td style={{ padding: '14px 20px' }}>{v.respiratory_rate} /min</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${v.spo2 >= 95 ? 'badge-success' : 'badge-danger'}`}>
                        {v.spo2}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#64748b' }}>
                      <div>{v.recorded_by_name}</div>
                      <div>{v.recorded_at}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#475569' }}>
                      {v.notes || 'Normal clinical findings'}
                    </td>
                  </tr>
                ))}
              {vitals.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No vital signs recorded yet. Click "Record Vital Signs" to record first measurement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Nursing Notes */}
      {currentTab === 'nursing-notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notes
            .filter(n => !search || (n.patient_name || '').toLowerCase().includes(search.toLowerCase()) || (n.notes || '').toLowerCase().includes(search.toLowerCase()))
            .map(n => (
              <div key={n.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                      {n.patient_name || `Patient #${n.patient_id}`}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Recorded by <strong>{n.nurse_name}</strong> on {n.created_at}
                    </span>
                  </div>
                </div>
                <p style={{ margin: '8px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                  {n.notes}
                </p>
                {n.observations && (
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '0.825rem', color: '#475569', marginTop: '10px' }}>
                    <strong>Clinical Observations:</strong> {n.observations}
                  </div>
                )}
              </div>
            ))}
          {notes.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No nursing notes added yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Medication Administration */}
      {currentTab === 'medication-admin' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Medication & Dosage</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Scheduled Time</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Administered By</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications
                .filter(m => !search || (m.patient_name || '').toLowerCase().includes(search.toLowerCase()) || (m.medication_name || '').toLowerCase().includes(search.toLowerCase()))
                .map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f172a' }}>
                      {m.patient_name || `Patient #${m.patient_id}`}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0284c7' }}>
                      {m.medication_name}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                      {m.scheduled_time}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${m.status === 'Given' ? 'badge-success' : m.status === 'Missed' ? 'badge-danger' : 'badge-warning'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.85rem' }}>
                      {m.administered_by || 'Pending'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {m.status !== 'Given' ? (
                        <button
                          onClick={() => handleAdministerMed(m.id, 'Given')}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Mark as Given
                        </button>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: '700' }}>✓ Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              {medications.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No medications scheduled for administration.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Care Schedule */}
      {currentTab === 'nurse-schedule' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Appointment / Task</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Attending Doctor</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Scheduled Time</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 10).map(apt => (
                <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{apt.appointment_no}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '600' }}>{apt.patient_name}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{apt.doctor_name}</td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>{apt.appointment_date} {apt.time_slot}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-info">{apt.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Record Vital Signs */}
      {showVitalModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '520px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>Record Patient Vital Signs</h3>
            <form onSubmit={handleSaveVitals}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Select Patient *</label>
                <select
                  value={vitalForm.patient_id}
                  onChange={(e) => setVitalForm({ ...vitalForm, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_no})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Blood Pressure (mmHg) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 120/80"
                    value={vitalForm.blood_pressure}
                    onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Temperature (°F) *</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 98.6"
                    value={vitalForm.temperature}
                    onChange={(e) => setVitalForm({ ...vitalForm, temperature: parseFloat(e.target.value) })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Pulse (bpm)</label>
                  <input
                    type="number"
                    value={vitalForm.pulse}
                    onChange={(e) => setVitalForm({ ...vitalForm, pulse: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Resp. Rate</label>
                  <input
                    type="number"
                    value={vitalForm.respiratory_rate}
                    onChange={(e) => setVitalForm({ ...vitalForm, respiratory_rate: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitalForm.spo2}
                    onChange={(e) => setVitalForm({ ...vitalForm, spo2: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Clinical Notes</label>
                <textarea
                  rows="3"
                  placeholder="Patient comfort, rhythm, breathing notes..."
                  value={vitalForm.notes}
                  onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowVitalModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span>Save Vitals</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Nursing Note */}
      {showNoteModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '520px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>Add Nursing Note</h3>
            <form onSubmit={handleSaveNote}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Select Patient *</label>
                <select
                  value={noteForm.patient_id}
                  onChange={(e) => setNoteForm({ ...noteForm, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_no})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Nursing Notes & Summary *</label>
                <textarea
                  rows="4"
                  placeholder="Record nursing interventions, patient responses, oral fluid intake..."
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  className="input-field"
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Observations (IV Site, Mobility, Mental State)</label>
                <textarea
                  rows="2"
                  placeholder="Cannula site clean, alert & oriented x3..."
                  value={noteForm.observations}
                  onChange={(e) => setNoteForm({ ...noteForm, observations: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowNoteModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
