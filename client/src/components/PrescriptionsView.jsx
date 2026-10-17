import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  User,
  Clock,
  Filter,
  RefreshCw,
  Stethoscope
} from 'lucide-react';
import { api } from '../services/api';

export default function PrescriptionsView({ currentUser, currentRole = 'Doctor' }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    patient_id: '',
    medicine_name: '',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '7 days',
    instructions: 'Take after meals with water'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxData, ptData, medData] = await Promise.all([
        api.getPrescriptions(),
        api.getPatients(),
        api.getPharmacyMedicines()
      ]);
      setPrescriptions(rxData || []);
      setPatients(ptData || []);
      setMedicines(medData || []);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
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

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.medicine_name) {
      showNotification('Please select patient and specify medicine.', 'error');
      return;
    }
    try {
      await api.createPrescription({
        ...form,
        doctor_id: currentUser?.id || 1
      });
      showNotification('Prescription issued successfully!');
      setShowCreateModal(false);
      setForm({
        patient_id: '',
        medicine_name: '',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '7 days',
        instructions: 'Take after meals with water'
      });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to issue prescription', 'error');
    }
  };

  const handleDispense = async (id) => {
    try {
      await api.dispensePrescription(id, currentUser?.full_name || 'Pharmacist');
      showNotification('Prescription dispensed and logged in pharmacy records!');
      loadData();
    } catch (err) {
      showNotification('Failed to dispense prescription', 'error');
    }
  };

  const filtered = prescriptions.filter(p => {
    const matchSearch = !search ||
      (p.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.medicine_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.doctor_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.dispense_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Electronic Prescriptions & Dispensary Management
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: '4px 0 0 0' }}>
            Prescriptions Management
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          {['Doctor', 'Administrator'].includes(currentRole) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Create Prescription</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner */}
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

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by patient, medicine, or prescribing doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Prescribed', 'Dispensed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: statusFilter === st ? '#0284c7' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#475569',
                fontWeight: statusFilter === st ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Rx ID</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Prescribing Doctor</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Medicine & Dosage</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Schedule</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Dispense Status</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(rx => (
              <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>
                  RX-{String(rx.id).padStart(4, '0')}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{rx.patient_name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>NIC: {rx.patient_nic || 'N/A'}</div>
                  {rx.patient_allergies && !/^none/i.test(rx.patient_allergies) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px', marginTop: '3px', fontWeight: '700' }}>
                      ⚠️ Allergy: {rx.patient_allergies}
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 20px', color: '#334155', fontWeight: '500' }}>
                  {rx.doctor_name}
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{rx.doctor_specialization}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{rx.medicine_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#0284c7' }}>{rx.dosage}</div>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#475569' }}>
                  <div>{rx.frequency} • {rx.duration}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>{rx.instructions}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span className={`badge ${rx.dispense_status === 'Dispensed' ? 'badge-success' : 'badge-warning'}`}>
                    {rx.dispense_status}
                  </span>
                  {rx.dispensed_by && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      By: {rx.dispensed_by}
                    </div>
                  )}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setSelectedRx(rx)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      View
                    </button>
                    {['Pharmacist', 'Administrator'].includes(currentRole) && rx.dispense_status !== 'Dispensed' && (
                      <button
                        onClick={() => handleDispense(rx.id)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Dispense
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No prescriptions found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Prescription */}
      {showCreateModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '560px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>Issue New Prescription</h3>
            <form onSubmit={handleCreatePrescription}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Select Patient *</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_no})</option>
                  ))}
                </select>
                {(() => {
                  const pObj = patients.find(p => String(p.id) === String(form.patient_id));
                  if (!pObj) return null;
                  const hasAllergy = pObj.allergies && !/^none/i.test(pObj.allergies);
                  return (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: hasAllergy ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${hasAllergy ? '#fca5a5' : '#bbf7d0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.825rem'
                    }}>
                      <AlertCircle size={16} color={hasAllergy ? '#dc2626' : '#16a34a'} />
                      <span style={{ fontWeight: '700', color: hasAllergy ? '#991b1b' : '#166534' }}>
                        {hasAllergy ? `⚠️ Known Patient Allergies: ${pObj.allergies}` : '✓ No recorded drug allergies'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Medicine Name *</label>
                <input
                  type="text"
                  list="medicine-options"
                  placeholder="Type or select medicine (e.g. Atorvastatin 20mg)"
                  value={form.medicine_name}
                  onChange={(e) => setForm({ ...form, medicine_name: e.target.value })}
                  className="input-field"
                  required
                />
                <datalist id="medicine-options">
                  {medicines.map(m => (
                    <option key={m.id} value={`${m.brand_name} (${m.generic_name})`} />
                  ))}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Dosage *</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 1 tablet"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Frequency *</label>
                  <input
                    type="text"
                    placeholder="e.g. Once daily, TDS, BD"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Duration *</label>
                <input
                  type="text"
                  placeholder="e.g. 7 days, 30 days"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Special Instructions</label>
                <textarea
                  rows="3"
                  placeholder="Take after meals, avoid dairy..."
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pill size={16} />
                  <span>Issue Prescription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Prescription Details */}
      {selectedRx && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '520px', width: '92%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                Prescription Details (RX-{String(selectedRx.id).padStart(4, '0')})
              </h3>
              <span className={`badge ${selectedRx.dispense_status === 'Dispensed' ? 'badge-success' : 'badge-warning'}`}>
                {selectedRx.dispense_status}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '18px', fontSize: '0.9rem', lineHeight: 1.8 }}>
              <div><strong>Patient:</strong> {selectedRx.patient_name}</div>
              <div><strong>NIC / Contact:</strong> {selectedRx.patient_nic || 'N/A'} • {selectedRx.patient_phone || 'N/A'}</div>
              <div style={{
                margin: '8px 0',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: selectedRx.patient_allergies && !/^none/i.test(selectedRx.patient_allergies) ? '#fee2e2' : '#f0fdf4',
                color: selectedRx.patient_allergies && !/^none/i.test(selectedRx.patient_allergies) ? '#991b1b' : '#166534',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                Patient Known Allergies: {selectedRx.patient_allergies || 'No known allergies'}
              </div>
              <div><strong>Prescribing Doctor:</strong> {selectedRx.doctor_name} ({selectedRx.doctor_specialization})</div>
              <div><strong>Prescribed Date:</strong> {selectedRx.prescription_date}</div>
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
              <div><strong>Medicine:</strong> <span style={{ color: '#0284c7', fontWeight: '700' }}>{selectedRx.medicine_name}</span></div>
              <div><strong>Dosage & Frequency:</strong> {selectedRx.dosage} • {selectedRx.frequency}</div>
              <div><strong>Duration:</strong> {selectedRx.duration}</div>
              <div><strong>Instructions:</strong> {selectedRx.instructions || 'None'}</div>
              {selectedRx.dispensed_by && (
                <div><strong>Dispensed By:</strong> {selectedRx.dispensed_by} at {selectedRx.dispensed_at}</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} />
                <span>Print Rx</span>
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['Pharmacist', 'Administrator'].includes(currentRole) && selectedRx.dispense_status !== 'Dispensed' && (
                  <button
                    onClick={() => {
                      handleDispense(selectedRx.id);
                      setSelectedRx(null);
                    }}
                    className="btn btn-primary"
                  >
                    Dispense Now
                  </button>
                )}
                <button onClick={() => setSelectedRx(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
