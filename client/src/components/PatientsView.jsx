import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Filter, Edit2, FileText, Calendar, AlertCircle,
  Upload, Check, X, HeartPulse, Download, FolderOpen, FileCheck, Trash2
} from 'lucide-react';
import { api } from '../services/api';

const SL_DISTRICTS = [
  'All', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara',
  'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara',
  'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala',
  'Ratnapura', 'Kegalle'
];

// Backend document categories -> labels
const DOC_LABELS = {
  id_document: 'ID Document',
  insurance: 'Insurance Document',
  lab_report: 'Lab Report',
  medical_report: 'Medical Report / Scan / Discharge Summary',
  other: 'Other'
};

// Every field the backend accepts for a patient
const ALL_FIELDS = [
  'full_name', 'nic', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'district',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
  'blood_group', 'allergies', 'chronic_conditions'
];

// NOTE: no risky defaults (no pre-selected blood group / DOB / "None reported").
// A wrong default in a medical record is worse than an empty field.
const EMPTY_FORM = {
  full_name: '', nic: '', date_of_birth: '', gender: 'male', phone: '', email: '',
  address: '', district: 'Colombo',
  emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_phone: '',
  blood_group: '', allergies: '', chronic_conditions: ''
};

const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');

function Field({ label, span, hint, children }) {
  return (
    <div className="form-group" style={span ? { gridColumn: 'span 2' } : undefined}>
      <label className="form-label">{label}</label>
      {children}
      {hint && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

export default function PatientsView({ onSelectPatientForAppointment, initialSearch = '', openRegistrationModal = false }) {
  // ---------- who is logged in, and what may they do (all comes from the backend login response) ----------
  const session = api.getSession();
  const role = session?.roleSlug || session?.user?.roleSlug || '';
  const can = (perm) => !!session?.permissions?.includes(perm);
  const sees = (field) => (session?.viewFields || []).includes(field);
  const editableFields = session?.editableFields || [];
  const docCategories = session?.docCategories || [];
  const isEmergencyOnly = role === 'nurse'; // nurses may only register emergency patients

  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [query, setQuery] = useState(initialSearch || ''); // debounced copy
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Delete / deactivation state
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // Add / Edit modal
  const [formMode, setFormMode] = useState(null); // null | 'add' | 'edit'
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // History / documents modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [historyTab, setHistoryTab] = useState('records');
  const [patientRecords, setPatientRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docsError, setDocsError] = useState('');
  const [docCategory, setDocCategory] = useState(docCategories[0] || 'other');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Debounce: every search is written to the audit log, so don't fire on each keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { if (initialSearch) setSearchTerm(initialSearch); }, [initialSearch]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const res = await api.getPatients(query, selectedDistrict, includeInactive);
      setPatients(res.data);
      setTotal(res.total);
    } catch (err) {
      setListError(err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedDistrict, includeInactive]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.deletePatient(deletingPatient.id);
      setDeleteSuccess(`Patient ${deletingPatient.full_name} (${deletingPatient.patient_code}) successfully deactivated.`);
      setTimeout(() => setDeleteSuccess(''), 4000);
      setDeletingPatient(null);
      fetchPatients();
    } catch (err) {
      setDeleteError(err.message || 'Failed to deactivate patient.');
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (openRegistrationModal && can('patient:create')) openAdd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRegistrationModal]);

  // ---------- form helpers ----------
  const bind = (key) => ({
    className: 'input-field',
    value: formData[key] ?? '',
    onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
    // In edit mode, fields this role may not change are greyed out
    disabled: formMode === 'edit' && !editableFields.includes(key)
  });

  const showField = (key) => sees(key); // hide fields this role may not even see

  const validateNIC = (nic) => /^[0-9]{9}[vVxX]$/.test(nic.trim()) || /^[0-9]{12}$/.test(nic.trim());

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, phone: '' });
    setFormError(''); setFormSuccess('');
    setEditingPatient(null);
    setFormMode('add');
  };

  const openEdit = (p) => {
    setEditingPatient(p);
    const f = { ...EMPTY_FORM };
    ALL_FIELDS.forEach((k) => { f[k] = p[k] ?? ''; });
    setFormData(f);
    setFormError(''); setFormSuccess('');
    setFormMode('edit');
  };

  const closeForm = () => setFormMode(null);

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    const emergency = formMode === 'add' && isEmergencyOnly;

    if (!formData.full_name.trim()) return setFormError('Patient full name is required.');

    if (formMode === 'add' && !emergency) {
      if (!formData.nic.trim()) return setFormError('Sri Lankan National Identity Card (NIC) is mandatory.');
      if (!validateNIC(formData.nic)) return setFormError('Invalid NIC. Use 9 digits + V/X (e.g. 841920481V) or 12 digits.');
      if (!formData.date_of_birth) return setFormError('Date of birth is required.');
      if (!formData.phone.trim()) return setFormError('Patient contact number is required.');
    }
    if (formMode === 'edit' && editableFields.includes('nic') && formData.nic.trim() && !validateNIC(formData.nic)) {
      return setFormError('Invalid NIC format.');
    }

    setSaving(true);
    try {
      if (formMode === 'add') {
        // Only send non-empty values (an empty NIC would clash with the UNIQUE rule)
        const payload = {};
        ALL_FIELDS.forEach((k) => {
          const v = typeof formData[k] === 'string' ? formData[k].trim() : formData[k];
          if (v) payload[k] = v;
        });
        if (emergency) payload.is_emergency = true;
        const created = await api.createPatient(payload);
        setFormSuccess(`Patient ${created.patient_code} registered successfully!`);
      } else {
        // Only send fields this role is allowed to edit (the server rejects anything else)
        const payload = {};
        editableFields.forEach((k) => {
          const v = typeof formData[k] === 'string' ? formData[k].trim() : formData[k];
          payload[k] = v === '' ? null : v;
        });
        await api.updatePatient(editingPatient.id, payload);
        setFormSuccess('Patient information updated successfully!');
      }
      setTimeout(() => { closeForm(); fetchPatients(); }, 900);
    } catch (err) {
      setFormError(err.message || 'Failed to save patient.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- history / documents ----------
  const openHistory = async (patient) => {
    setSelectedPatient(patient);
    setPatientRecords([]); setDocuments([]); setDocsError(''); setDocFile(null);
    setDocCategory(docCategories[0] || 'other');
    setHistoryTab(can('patient:history:view') ? 'records' : 'documents');

    if (can('patient:history:view')) {
      try { setPatientRecords(await api.getMedicalRecords(patient.id)); } catch { setPatientRecords([]); }
    }
    if (can('document:view')) await loadDocuments(patient.id);
  };

  const loadDocuments = async (patientId) => {
    try { setDocuments(await api.listDocuments(patientId)); setDocsError(''); }
    catch (err) { setDocsError(err.message); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!docFile) return setDocsError('Please choose a file first (PDF, JPG or PNG, max 5 MB).');
    setUploading(true); setDocsError('');
    try {
      await api.uploadDocument(selectedPatient.id, docFile, docCategory);
      setDocFile(null);
      await loadDocuments(selectedPatient.id);
    } catch (err) {
      setDocsError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      const blob = await api.downloadDocument(selectedPatient.id, doc.id);
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (err) {
      setDocsError(err.message);
    }
  };

  const colCount = 4 + (sees('nic') ? 1 : 0) + (sees('district') ? 1 : 0) + (sees('blood_group') ? 1 : 0) + 1;
  const tabBtn = (id, active) => ({
    padding: '12px 18px', background: 'none', border: 'none',
    borderBottom: active ? '3px solid var(--brand-blue)' : '3px solid transparent',
    fontWeight: active ? '700' : '500',
    color: active ? 'var(--brand-blue)' : 'var(--text-secondary)',
    cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px'
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Patient Management</h2>
            <span className="badge badge-info">{total} Registered</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Signed in as <strong>{session?.user?.full_name}</strong> ({role?.replace('_', ' ')})
          </p>
        </div>

        {can('patient:create') && (
          <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> {isEmergencyOnly ? 'Register Emergency Patient' : 'Register New Patient'}
          </button>
        )}
      </div>

      {/* Search + filter */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={sees('nic') ? 'Search by NIC, Patient ID, Name, or Phone...' : 'Search by Patient ID, Name, or Phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {sees('district') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="input-field" style={{ width: '170px' }}>
              {SL_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Districts' : `District: ${d}`}</option>
              ))}
            </select>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span>Show Deactivated / Inactive</span>
        </label>
      </div>

      {deleteSuccess && (
        <div style={{ padding: '12px 14px', background: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-success)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> {deleteSuccess}
        </div>
      )}

      {listError && (
        <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.85rem' }}>
          {listError}
        </div>
      )}

      {/* Table: columns appear only if this role is allowed to see that data */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Full Name</th>
                {sees('nic') && <th>National ID (NIC)</th>}
                <th>Contact</th>
                {sees('district') && <th>District</th>}
                {sees('blood_group') && <th>Blood</th>}
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>Loading patient records...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={colCount} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No patient records found.</td></tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: '800', color: 'var(--brand-blue)', fontSize: '0.825rem', fontFamily: 'monospace' }}>{p.patient_code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        {p.full_name}
                        {p.is_emergency_registration ? <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Emergency</span> : null}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {p.gender} • DOB: {fmtDate(p.date_of_birth)}
                      </div>
                    </td>
                    {sees('nic') && (
                      <td>
                        {p.nic ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '6px' }}>{p.nic}</span>
                        ) : '—'}
                      </td>
                    )}
                    <td>
                      <div style={{ fontSize: '0.825rem', fontWeight: '500' }}>{p.phone || '—'}</div>
                      {sees('emergency_contact_phone') && p.emergency_contact_phone && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Emg: {p.emergency_contact_phone}</div>
                      )}
                    </td>
                    {sees('district') && <td>{p.district || '—'}</td>}
                    {sees('blood_group') && (
                      <td>{p.blood_group ? <span className="badge badge-info">{p.blood_group}</span> : '—'}</td>
                    )}
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {can('patient:update') && (
                          <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm" title="Update patient information">
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                        {(can('patient:history:view') || can('document:view')) && (
                          <button onClick={() => openHistory(p)} className="btn btn-secondary btn-sm" title="Medical history & documents">
                            <FileText size={13} /> Records
                          </button>
                        )}
                        {onSelectPatientForAppointment && (role === 'administrator' || role === 'receptionist') && (
                          <button onClick={() => onSelectPatientForAppointment(p)} className="btn btn-primary btn-sm" title="Book appointment">
                            <Calendar size={13} /> Channel
                          </button>
                        )}
                        {(can('patient:delete') || role === 'administrator' || role === 'receptionist') && p.status === 'active' && (
                          <button
                            onClick={() => { setDeletingPatient(p); setDeleteError(''); }}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Deactivate / Delete Patient Record"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal (one form for both) */}
      {formMode && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '90%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                    {formMode === 'add' ? (isEmergencyOnly ? 'Emergency Patient Registration' : 'Register New Patient') : 'Update Patient Information'}
                  </h3>
                  {editingPatient && <span className="badge badge-info">{editingPatient.patient_code}</span>}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {formMode === 'edit' ? 'Greyed-out fields cannot be changed by your role.' : isEmergencyOnly ? 'Only name and gender are required. Complete the details later.' : 'Fields marked * are required.'}
                </p>
              </div>
              <button onClick={closeForm} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}><X size={16} /></button>
            </div>

            <form onSubmit={submitForm} style={{ padding: '24px' }}>
              {formError && (
                <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 14px', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} /> {formSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Full Name *" span>
                  <input type="text" required placeholder="e.g. Kasun Chamara Jayawardena" {...bind('full_name')} />
                </Field>

                {showField('nic') && (
                  <Field label={`National Identity Card (NIC)${isEmergencyOnly && formMode === 'add' ? '' : ' *'}`} hint="Old (9 digits + V) or new (12 digits)">
                    <input type="text" placeholder="e.g. 198821401923 or 882141923V" {...bind('nic')} />
                  </Field>
                )}

                <Field label="Date of Birth">
                  <input type="date" {...bind('date_of_birth')} />
                </Field>

                <Field label="Gender">
                  <select {...bind('gender')}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                {showField('blood_group') && (
                  <Field label="Blood Group">
                    <select {...bind('blood_group')}>
                      <option value="">Unknown / not tested</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                )}

                <Field label={`Phone Number${isEmergencyOnly && formMode === 'add' ? '' : ' *'}`}>
                  <input type="text" placeholder="077-XXXXXXX" {...bind('phone')} />
                </Field>

                {showField('email') && (
                  <Field label="Email">
                    <input type="email" placeholder="name@example.com" {...bind('email')} />
                  </Field>
                )}

                {showField('district') && (
                  <Field label="District (Sri Lanka)">
                    <select {...bind('district')}>
                      {SL_DISTRICTS.filter((d) => d !== 'All').map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                )}

                {showField('address') && (
                  <Field label="Residential Address" span>
                    <input type="text" placeholder="No, Street, Town" {...bind('address')} />
                  </Field>
                )}

                {showField('emergency_contact_name') && (
                  <>
                    <Field label="Emergency Contact Name">
                      <input type="text" placeholder="e.g. Spouse / Parent" {...bind('emergency_contact_name')} />
                    </Field>
                    <Field label="Emergency Contact Phone">
                      <input type="text" placeholder="07X-XXXXXXX" {...bind('emergency_contact_phone')} />
                    </Field>
                  </>
                )}

                {showField('allergies') && (
                  <Field label="Known Allergies / Medical Alerts" span hint="Leave empty if not yet asked. Write 'None' only when the patient confirms no allergies.">
                    <input type="text" placeholder="e.g. Penicillin, Aspirin, Seafood" {...bind('allergies')} />
                  </Field>
                )}

                {showField('chronic_conditions') && (
                  <Field label="Chronic Conditions" span>
                    <input type="text" placeholder="e.g. Diabetes, Hypertension" {...bind('chronic_conditions')} />
                  </Field>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={closeForm} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : formMode === 'add' ? 'Register Patient' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History / documents modal */}
      {selectedPatient && (
        <div className="modal-backdrop" onClick={() => setSelectedPatient(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '92%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{selectedPatient.full_name}</h3>
                  <span className="badge badge-info">{selectedPatient.patient_code}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  {[
                    sees('nic') && selectedPatient.nic && `NIC: ${selectedPatient.nic}`,
                    sees('blood_group') && selectedPatient.blood_group && `Blood: ${selectedPatient.blood_group}`,
                    selectedPatient.phone && `Phone: ${selectedPatient.phone}`
                  ].filter(Boolean).join(' • ')}
                </p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0 24px' }}>
              {can('patient:history:view') && (
                <button onClick={() => setHistoryTab('records')} style={tabBtn('records', historyTab === 'records')}>
                  <HeartPulse size={16} /> Clinical History & EMR
                </button>
              )}
              {can('document:view') && (
                <button onClick={() => setHistoryTab('documents')} style={tabBtn('documents', historyTab === 'documents')}>
                  <FolderOpen size={16} /> Documents ({documents.length})
                </button>
              )}
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sees('allergies') && selectedPatient.allergies && !/^none/i.test(selectedPatient.allergies) && (
                <div style={{ padding: '12px 16px', background: 'var(--color-danger-bg)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                    KNOWN PATIENT ALLERGIES: {selectedPatient.allergies}
                  </span>
                </div>
              )}

              {/* Clinical history */}
              {historyTab === 'records' && can('patient:history:view') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Consultation Encounters & Treatment History</h4>
                  {patientRecords.length === 0 ? (
                    <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No consultation records yet. (Medical Records module is not built yet.)
                    </div>
                  ) : (
                    patientRecords.map((rec) => (
                      <div key={rec.id} className="card" style={{ padding: '18px', borderLeft: '4px solid var(--brand-blue)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--brand-blue)' }}>{rec.doctor_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.visit_date}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Diagnosis: {rec.diagnosis}</div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Treatment: {rec.treatment_plan}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Documents */}
              {historyTab === 'documents' && can('document:view') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {docsError && (
                    <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.85rem' }}>{docsError}</div>
                  )}

                  {can('document:upload') && (
                    <div className="card" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1.5px dashed var(--border-color)' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Upload size={16} style={{ color: 'var(--brand-blue)' }} /> Attach a document (PDF, JPG, PNG, max 5 MB)
                      </h4>
                      <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                          <label className="form-label">Category</label>
                          <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field">
                            {docCategories.map((c) => <option key={c} value={c}>{DOC_LABELS[c] || c}</option>)}
                          </select>
                        </div>
                        <div>
                          <input type="file" id="patient-file-input" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                            onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                          <label htmlFor="patient-file-input" className="btn btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Browse File</label>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={uploading} style={{ whiteSpace: 'nowrap' }}>
                          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </form>
                      {docFile && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '8px', fontWeight: '600' }}>
                          Selected: {docFile.name} ({fmtSize(docFile.size)})
                        </div>
                      )}
                    </div>
                  )}

                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '4px 0 0 0' }}>Patient Document Library</h4>
                  {documents.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No documents available for your role.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {documents.map((doc) => (
                        <div key={doc.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileCheck size={20} />
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{doc.original_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                                <span>{DOC_LABELS[doc.category] || doc.category}</span><span>•</span>
                                <span>{fmtSize(doc.size_bytes)}</span><span>•</span>
                                <span>Uploaded: {fmtDate(doc.uploaded_at)}</span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleViewDocument(doc)} className="btn btn-secondary btn-sm" title="Open document">
                            <Download size={13} /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Patient Confirmation Modal */}
      {deletingPatient && (
        <div className="modal-backdrop" onClick={() => !deleteLoading && setDeletingPatient(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'var(--color-danger-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)'
                }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--color-danger)' }}>
                    Delete Patient Record
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Soft-deletion / Deactivation
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingPatient(null)}
                className="btn-close"
                disabled={deleteLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 0' }}>
              {deleteError && (
                <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                  {deleteError}
                </div>
              )}
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to deactivate/delete the record for <strong>{deletingPatient.full_name}</strong> (<code style={{ color: 'var(--brand-blue)' }}>{deletingPatient.patient_code}</code>)?
              </p>
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-warning)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <strong>Clinical Safety Notice:</strong> Patient records are soft-deleted (status set to <em>Inactive</em>) in compliance with hospital audit regulations. Past prescriptions and medical encounters remain securely preserved.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeletingPatient(null)}
                className="btn btn-secondary"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                disabled={deleteLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {deleteLoading ? (
                  <span>Deactivating...</span>
                ) : (
                  <>
                    <Trash2 size={14} /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}