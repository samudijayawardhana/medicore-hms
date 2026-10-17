import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Plus,
  User,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
  Stethoscope,
  HeartPulse,
  LogOut,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';

const WARDS = [
  'Ward 01 - Surgical',
  'Ward 02 - Pediatric',
  'Ward 03 - Medical (Intermediate)',
  'ETU / High Dependency Unit',
  'Private Luxury Suite'
];

export default function InpatientView() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    ward: 'Ward 03 - Medical (Intermediate)',
    bed_no: 'Bed 05',
    primary_doctor_id: '',
    reason: 'Clinical observation & IV hydration therapy',
    daily_rate_lkr: 3800.00
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [admList, ptList, docList] = await Promise.all([
        api.getInpatientAdmissions(),
        api.getPatients(),
        api.getDoctors()
      ]);
      setAdmissions(admList);
      setPatients(ptList);
      setDoctors(docList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDischarge = async (id) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;
    try {
      await api.dischargePatient(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Error discharging patient');
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.primary_doctor_id) {
      alert('Patient and Consultant Doctor are required.');
      return;
    }
    try {
      await api.admitPatient(formData);
      setShowAdmitModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error admitting patient');
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Inpatient Ward & Bed Management</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Admission, bed allocations, ETU emergency monitoring, and discharge summaries.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              patient_id: patients[0]?.id || '',
              ward: 'Ward 03 - Medical (Intermediate)',
              bed_no: `Bed ${Math.floor(10 + Math.random() * 20)}`,
              primary_doctor_id: doctors[0]?.id || '',
              reason: 'Observation & inpatient clinical management',
              daily_rate_lkr: 3800.00
            });
            setShowAdmitModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> Admit Patient to Ward
        </button>
      </div>

      {/* Ward Status Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {WARDS.map((ward, i) => {
          const count = admissions.filter(a => a.ward === ward && a.status === 'Admitted').length;
          return (
            <div key={i} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{ward}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: count > 0 ? 'var(--brand-blue)' : 'var(--text-muted)' }}>
                {count} Occupied
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>24/7 Nursing lead on duty</div>
            </div>
          );
        })}
      </div>

      {/* Current Inpatient Admissions Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Active Admitted Inpatients</h3>
          <span className="badge badge-info">{admissions.filter(a => a.status === 'Admitted').length} Currently in Wards</span>
        </div>

        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Patient Details</th>
                <th>Ward & Bed Allocation</th>
                <th>Consultant Doctor</th>
                <th>Admission Date</th>
                <th>Daily Rate (LKR)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    Loading ward admissions...
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No patient admissions logged.
                  </td>
                </tr>
              ) : (
                admissions.map((adm) => (
                  <tr key={adm.id}>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--brand-blue)', fontSize: '0.8rem' }}>
                        {adm.admission_no}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{adm.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIC: {adm.patient_nic} • {adm.patient_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--brand-teal)' }}>{adm.ward}</div>
                      <span className="badge badge-secondary">{adm.bed_no}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{adm.doctor_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>{adm.admission_date}</div>
                      {adm.discharge_date && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discharged: {adm.discharge_date}</div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-success)' }}>{formatLKR(adm.daily_rate_lkr)}/day</strong>
                    </td>
                    <td>
                      <span className={`badge ${adm.status === 'Admitted' ? 'badge-warning' : 'badge-success'}`}>
                        {adm.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {adm.status === 'Admitted' && (
                        <button
                          onClick={() => handleDischarge(adm.id)}
                          className="btn btn-secondary btn-sm"
                          title="Process Hospital Discharge"
                        >
                          <LogOut size={13} /> Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Admit Patient */}
      {showAdmitModal && (
        <div className="modal-overlay" onClick={() => setShowAdmitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Inpatient Hospital Admission</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allocate ward bed and primary consultant</p>
              </div>
              <button onClick={() => setShowAdmitModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    <option key={p.id} value={p.id}>{p.full_name} ({p.nic})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Hospital Ward *</label>
                  <select
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="form-select"
                  >
                    {WARDS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bed No *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bed 08"
                    value={formData.bed_no}
                    onChange={(e) => setFormData({ ...formData, bed_no: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Primary Consultant Doctor *</label>
                  <select
                    value={formData.primary_doctor_id}
                    onChange={(e) => setFormData({ ...formData, primary_doctor_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Consultant --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Daily Bed Rate (LKR)</label>
                  <input
                    type="number"
                    value={formData.daily_rate_lkr}
                    onChange={(e) => setFormData({ ...formData, daily_rate_lkr: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Indication for Admission</label>
                <input
                  type="text"
                  placeholder="e.g. Dengue observation, post-operative recovery, IV antibiotic course"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAdmitModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Admission & Assign Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
