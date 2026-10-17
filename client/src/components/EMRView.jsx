import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Activity,
  Heart,
  Pill,
  User,
  Stethoscope,
  CheckCircle,
  Calendar,
  AlertTriangle,
  X,
  FileCheck2,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

export default function EMRView({ activeAppointment, onPrescriptionCreated }) {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);

  // New Record Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    visit_date: '2026-10-15',
    symptoms: '',
    diagnosis: '',
    treatment_plan: '',
    bp: '120/80',
    pulse: '72',
    temperature_f: '98.4',
    weight_kg: '68',
    spo2_percent: '99',
    doctor_notes: '',
    prescriptions: []
  });

  // Current Prescription item being drafted
  const [rxDraft, setRxDraft] = useState({
    medicine_name: 'Panadol (Paracetamol) 500mg',
    dosage: '1-2 tablets',
    frequency: 'TDS (Three times daily)',
    duration: '3 Days',
    instructions: 'Take after meals for fever / body ache'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [recList, ptList, docList, medList] = await Promise.all([
        api.getMedicalRecords(selectedPatientId),
        api.getPatients(),
        api.getDoctors(),
        api.getPharmacyMedicines()
      ]);
      setRecords(recList);
      setPatients(ptList);
      setDoctors(docList);
      setMedicines(medList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  useEffect(() => {
    if (activeAppointment) {
      setFormData(prev => ({
        ...prev,
        patient_id: activeAppointment.patient_id,
        doctor_id: activeAppointment.doctor_id,
        appointment_id: activeAppointment.id,
        symptoms: activeAppointment.reason || ''
      }));
      setShowNewRecordModal(true);
    }
  }, [activeAppointment]);

  const handleAddPrescriptionToEncounter = () => {
    if (!rxDraft.medicine_name) return;
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { ...rxDraft, id: Date.now() }]
    }));
  };

  const handleRemovePrescription = (id) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }));
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.patient_id || !formData.doctor_id || !formData.diagnosis.trim()) {
      setFormError('Patient, Doctor, and Diagnosis are required.');
      return;
    }

    try {
      await api.createMedicalRecord(formData);
      setFormSuccess('Clinical encounter & prescription logged to EMR!');
      setTimeout(() => {
        setShowNewRecordModal(false);
        loadData();
      }, 900);
    } catch (err) {
      setFormError(err.message || 'Error creating medical record');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Electronic Medical Records (EMR)</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Clinical consultations, patient vitals, diagnosis, and prescription management.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              patient_id: patients[0]?.id || '',
              doctor_id: doctors[0]?.id || '',
              visit_date: '2026-10-15',
              symptoms: '',
              diagnosis: '',
              treatment_plan: '',
              bp: '120/80',
              pulse: '74',
              temperature_f: '98.4',
              weight_kg: '68',
              spo2_percent: '99',
              doctor_notes: '',
              prescriptions: []
            });
            setShowNewRecordModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> New Clinical Encounter
        </button>
      </div>

      {/* Patient Filter */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
          <User size={16} style={{ color: 'var(--brand-blue)' }} />
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="form-select"
          >
            <option value="">-- All Patient Consultation Records --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.nic}) - {p.patient_no}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* EMR Records List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading electronic medical records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No EMR encounters found.
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.id}
              className="glass-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderLeft: '4px solid var(--brand-teal)'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {rec.patient_name}
                    </h3>
                    <span className="badge badge-info">{rec.patient_nic}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', fontWeight: '600', marginTop: '2px' }}>
                    {rec.doctor_name} ({rec.doctor_specialization})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <Calendar size={14} /> Encounter Date: <strong style={{ color: 'var(--text-main)' }}>{rec.visit_date}</strong>
                </div>
              </div>

              {/* Vitals Ribbon */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
                  <Heart size={15} style={{ color: '#ef4444' }} />
                  <span>BP: <strong>{rec.bp}</strong> mmHg</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
                  <Activity size={15} style={{ color: '#3b82f6' }} />
                  <span>Pulse: <strong>{rec.pulse}</strong> bpm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
                  <span>Temp: <strong>{rec.temperature_f}°F</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
                  <span>Weight: <strong>{rec.weight_kg} kg</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
                  <span>SpO2: <strong style={{ color: 'var(--color-success)' }}>{rec.spo2_percent}%</strong></span>
                </div>
              </div>

              {/* Diagnosis and Treatment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                <div style={{ padding: '12px', background: 'rgba(2, 132, 199, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--brand-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Clinical Diagnosis
                  </div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{rec.diagnosis}</div>
                  {rec.symptoms && (
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Symptoms: {rec.symptoms}
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Treatment Plan & Advice
                  </div>
                  <div style={{ color: 'var(--text-main)' }}>{rec.treatment_plan || 'Standard conservative management'}</div>
                  {rec.doctor_notes && (
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Notes: {rec.doctor_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Prescriptions Table */}
              {rec.prescriptions && rec.prescriptions.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Pill size={15} style={{ color: 'var(--brand-teal)' }} /> Prescribed Medications (NMRA Standard):
                  </div>
                  <div className="table-container">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Instructions</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rec.prescriptions.map((rx, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '700', color: 'var(--brand-blue)' }}>{rx.medicine_name}</td>
                            <td>{rx.dosage}</td>
                            <td>{rx.frequency}</td>
                            <td>{rx.duration}</td>
                            <td>{rx.instructions}</td>
                            <td>
                              <span className={`badge ${rx.dispense_status === 'Dispensed' ? 'badge-success' : 'badge-warning'}`}>
                                {rx.dispense_status || 'Prescribed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: New EMR Encounter */}
      {showNewRecordModal && (
        <div className="modal-overlay" onClick={() => setShowNewRecordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Clinical Encounter & Prescription</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log patient diagnosis, vitals, and electronic prescription</p>
              </div>
              <button onClick={() => setShowNewRecordModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitRecord} style={{ padding: '20px' }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '0.825rem' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '10px 14px', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '0.825rem' }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.nic})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Consultant Doctor *</label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>

                {/* Vitals row */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Patient Vitals Triage</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BP (mmHg)</span>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={formData.bp}
                        onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pulse (bpm)</span>
                      <input
                        type="number"
                        placeholder="72"
                        value={formData.pulse}
                        onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temp (°F)</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98.4"
                        value={formData.temperature_f}
                        onChange={(e) => setFormData({ ...formData, temperature_f: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weight (kg)</span>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="65"
                        value={formData.weight_kg}
                        onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SpO2 (%)</span>
                      <input
                        type="number"
                        placeholder="99"
                        value={formData.spo2_percent}
                        onChange={(e) => setFormData({ ...formData, spo2_percent: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Clinical Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Type 2 Diabetes Mellitus / Dengue Fever / Acute Bronchitis"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Presenting Symptoms</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. High fever for 3 days, arthralgia, retro-orbital headache"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Treatment Plan / Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bed rest, Oral fluid intake 2.5L/day, Repeat FBC tomorrow"
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                {/* Prescription Section */}
                <div style={{ gridColumn: 'span 2', padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pill size={16} style={{ color: 'var(--brand-teal)' }} /> Add Prescription to Encounter
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drug / Medicine</span>
                      <select
                        value={rxDraft.medicine_name}
                        onChange={(e) => setRxDraft({ ...rxDraft, medicine_name: e.target.value })}
                        className="form-select"
                      >
                        {medicines.map(m => (
                          <option key={m.id} value={`${m.brand_name} ${m.strength}`}>
                            {m.brand_name} ({m.generic_name}) {m.strength}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dosage</span>
                      <input
                        type="text"
                        placeholder="1 tab"
                        value={rxDraft.dosage}
                        onChange={(e) => setRxDraft({ ...rxDraft, dosage: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Frequency</span>
                      <select
                        value={rxDraft.frequency}
                        onChange={(e) => setRxDraft({ ...rxDraft, frequency: e.target.value })}
                        className="form-select"
                      >
                        <option value="Mane (Morning)">Mane (Morning)</option>
                        <option value="Nocte (Night)">Nocte (Night)</option>
                        <option value="BD (Twice daily)">BD (Twice daily)</option>
                        <option value="TDS (Three times)">TDS (Three times)</option>
                        <option value="QDS (Four times)">QDS (Four times)</option>
                        <option value="PRN (When needed)">PRN (When needed)</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration</span>
                      <input
                        type="text"
                        placeholder="5 Days"
                        value={rxDraft.duration}
                        onChange={(e) => setRxDraft({ ...rxDraft, duration: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPrescriptionToEncounter}
                      className="btn btn-primary btn-sm"
                      style={{ height: '38px' }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>

                  {/* Added Prescriptions List */}
                  {formData.prescriptions.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {formData.prescriptions.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 12px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div>
                            <strong>{p.medicine_name}</strong> — {p.dosage} • {p.frequency} • {p.duration}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePrescription(p.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)', padding: '2px 6px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowNewRecordModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Encounter & Prescribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
