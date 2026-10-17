import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Clock,
  User,
  X,
  FileSpreadsheet,
  ShieldAlert,
  TestTube2,
  Barcode,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function LaboratoryView({ activeTab = '' }) {
  const [orders, setOrders] = useState([]);
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Primary tabs matching PDF 3.6: Test Requests, Sample Collection, Result Entry, Report Generation
  const [tab, setTab] = useState(() => {
    if (activeTab === 'lab-pending') return 'pending';
    if (activeTab === 'lab-test-management') return 'catalog';
    if (activeTab === 'lab-enter-results') return 'enter';
    if (activeTab === 'lab-reports' || activeTab === 'doctor-lab-reports') return 'reports';
    if (activeTab === 'lab-patient-info') return 'patients';
    if (activeTab === 'lab-samples') return 'samples';
    return 'orders';
  });

  useEffect(() => {
    if (activeTab === 'lab-pending') setTab('pending');
    else if (activeTab === 'lab-test-management') setTab('catalog');
    else if (activeTab === 'lab-enter-results') setTab('enter');
    else if (activeTab === 'lab-reports' || activeTab === 'doctor-lab-reports') setTab('reports');
    else if (activeTab === 'lab-patient-info') setTab('patients');
    else if (activeTab === 'lab-samples') setTab('samples');
    else if (activeTab === 'lab-requests') setTab('orders');
  }, [activeTab]);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [resultModalOrder, setResultModalOrder] = useState(null);
  const [sampleModalOrder, setSampleModalOrder] = useState(null);
  const [printReportOrder, setPrintReportOrder] = useState(null);

  // Result entry form
  const [resultForm, setResultForm] = useState({
    result_value: '',
    result_status: 'Normal',
    comments: '',
    performed_by: 'Kamal Priyadharshana (MLT)'
  });

  // Sample collection form (PDF 3.6)
  const [sampleForm, setSampleForm] = useState({
    sample_type: 'Venous Blood',
    sample_barcode: '',
    collected_by: 'Kamal Priyadharshana (MLT / Phlebotomist)',
    sample_status: 'Sample Collected',
    notes: 'Collected with sterile vacuum tube system (EDTA Lavender top)'
  });

  // New order form (PDF 3.6)
  const [orderForm, setOrderForm] = useState({
    patient_id: '',
    doctor_id: '',
    test_id: '',
    sample_type: 'Venous Blood',
    comments: 'Routine diagnostic investigation'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordList, testList, ptList, docList] = await Promise.all([
        api.getLabOrders(),
        api.getLabTests(),
        api.getPatients(),
        api.getDoctors()
      ]);
      setOrders(ordList);
      setTests(testList);
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

  const handleOpenResultEntry = (order) => {
    setResultModalOrder(order);
    setResultForm({
      result_value: order.result_value || '',
      result_status: order.result_status !== 'Pending' ? order.result_status : 'Normal',
      comments: order.comments || '',
      performed_by: order.performed_by || 'Kamal Priyadharshana (MLT)'
    });
  };

  const handleOpenSampleCollection = (order) => {
    setSampleModalOrder(order);
    const barcode = order.sample_barcode || `SMP-${order.id}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSampleForm({
      sample_type: order.sample_type || 'Venous Blood',
      sample_barcode: barcode,
      collected_by: 'Kamal Priyadharshana (MLT / Phlebotomist)',
      sample_status: 'Sample Collected',
      notes: 'Collected with sterile vacuum tube system'
    });
  };

  const handleSaveResult = async (e) => {
    e.preventDefault();
    if (!resultModalOrder) return;
    try {
      await api.updateLabResult(resultModalOrder.id, resultForm);
      setResultModalOrder(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update result');
    }
  };

  const handleSaveSampleCollection = async (e) => {
    e.preventDefault();
    if (!sampleModalOrder) return;
    try {
      await api.collectLabSample(sampleModalOrder.id, sampleForm);
      setSampleModalOrder(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to record sample collection');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.patient_id || !orderForm.test_id) {
      alert('Patient and Lab test are required');
      return;
    }
    try {
      await api.createLabOrder(orderForm);
      setShowOrderModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to order test');
    }
  };

  const formatLKR = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString('en-LK');
  };

  // Filter displayed orders according to current active tab and search
  const filteredOrders = orders.filter(ord => {
    const matchesSearch = !searchTerm ||
      ord.order_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.sample_barcode && ord.sample_barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (tab === 'samples') {
      // Sample collection view: either sample pending or just collected
      return true;
    }
    if (tab === 'pending') {
      return ord.result_status === 'Pending' || !ord.result_value;
    }
    if (tab === 'enter') {
      return true; // shows all orders so MLT can enter or edit results
    }
    if (tab === 'reports') {
      return !!ord.result_value; // completed tests with diagnostic report
    }
    return true; // 'orders' shows all
  });

  const labPatients = Array.from(new Map(orders.map(o => [o.patient_id, {
    id: o.patient_id,
    name: o.patient_name,
    nic: o.patient_nic,
    testsCount: orders.filter(x => x.patient_id === o.patient_id).length,
    lastTestDate: o.test_date
  }])).values());

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <FlaskConical size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Laboratory & Pathology Management</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Test requests, phlebotomy sample collection, MLT result entry, and verified diagnostic reports (PDF Section 3.6).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setOrderForm({
              patient_id: patients[0]?.id || '',
              doctor_id: doctors[0]?.id || '',
              test_id: tests[0]?.id || '',
              sample_type: 'Venous Blood',
              comments: 'Routine diagnostic investigation'
            });
            setShowOrderModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> New Lab Investigation Order
        </button>
      </div>

      {/* Laboratory Navigation Tabs - Strict Compliance with PDF 3.6 */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { id: 'orders', label: '1. Test Requests', count: orders.length, icon: FlaskConical },
          { id: 'samples', label: '2. Sample Collection', count: orders.filter(o => !o.sample_barcode || o.sample_status !== 'Sample Collected').length, icon: TestTube2 },
          { id: 'enter', label: '3. Result Entry', count: orders.filter(o => o.result_status === 'Pending' || !o.result_value).length, icon: FileSpreadsheet },
          { id: 'reports', label: '4. Report Generation', count: orders.filter(o => !!o.result_value).length, icon: Printer },
          { id: 'catalog', label: 'Test Management', count: tests.length, icon: FileText },
          { id: 'patients', label: 'Patient Directory', count: labPatients.length, icon: User }
        ].map(t => {
          const IconComp = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isActive ? '#0284c7' : 'var(--bg-secondary)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              <IconComp size={16} />
              <span>{t.label}</span>
              <span style={{
                fontSize: '0.725rem',
                padding: '2px 7px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                fontWeight: '800'
              }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar for Orders/Reports/Patients */}
      {tab !== 'catalog' && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '440px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by order #, barcode, patient name, or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Tab: Test Management (Catalog) */}
      {tab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {tests.map(t => (
            <div key={t.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-info" style={{ fontWeight: '700' }}>{t.test_code}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0284c7' }}>{formatLKR(t.price_lkr)}</span>
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{t.test_name}</h4>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>Category:</strong> {t.category || 'General Pathology'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                <div><strong>Standard Range:</strong> {t.normal_range || 'Clinical reference'}</div>
                <div><strong>Turnaround:</strong> {t.turnaround_hours ? `${t.turnaround_hours} Hours` : 'Same Day'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Patient Information */}
      {tab === 'patients' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>NIC Number</th>
                  <th>Total Tests Ordered</th>
                  <th>Latest Test Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labPatients.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No patient lab history recorded.
                    </td>
                  </tr>
                ) : (
                  labPatients.map(lp => (
                    <tr key={lp.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{lp.name}</td>
                      <td>{lp.nic || 'N/A'}</td>
                      <td><span className="badge badge-info">{lp.testsCount} Tests</span></td>
                      <td>{lp.lastTestDate || 'Recent'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => { setSearchTerm(lp.name); setTab('orders'); }}
                          className="btn btn-secondary btn-sm"
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Orders / Sample Collection / Enter Results / Reports Table */}
      {tab !== 'catalog' && tab !== 'patients' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Patient Details</th>
                  <th>Test Investigation</th>
                  <th>Sample / Specimen</th>
                  <th>Result & Range</th>
                  <th>Diagnostic Status</th>
                  <th style={{ textAlign: 'right' }}>Clinical Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                      Loading laboratory database...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No matching lab orders in this view.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span style={{ fontWeight: '700', color: 'var(--brand-blue)', fontSize: '0.85rem' }}>
                          {ord.order_no}
                        </span>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{ord.test_date}</div>
                        {ord.sample_barcode && (
                          <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Barcode size={12} /> {ord.sample_barcode}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{ord.patient_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIC: {ord.patient_nic}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{ord.test_name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--brand-teal)' }}>{ord.category} • {formatLKR(ord.price_lkr)}</div>
                      </td>
                      <td>
                        <div>
                          <span className="badge badge-info">{ord.sample_type || 'Venous Blood'}</span>
                          <div style={{ fontSize: '0.725rem', color: ord.sample_status === 'Sample Collected' ? '#16a34a' : '#f59e0b', fontWeight: '600', marginTop: '4px' }}>
                            ● {ord.sample_status || 'Sample Pending'}
                          </div>
                        </div>
                      </td>
                      <td>
                        {ord.result_value ? (
                          <div>
                            <div style={{ fontWeight: '700', color: ord.result_status === 'Critical' ? 'var(--color-danger)' : 'var(--text-main)', fontSize: '0.85rem' }}>
                              {ord.result_value}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              Ref: {ord.normal_range}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Awaiting analysis
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            ord.result_status === 'Critical'
                              ? 'badge-danger'
                              : ord.result_status === 'Abnormal'
                              ? 'badge-warning'
                              : ord.result_status === 'Normal'
                              ? 'badge-success'
                              : 'badge-secondary'
                          }`}
                        >
                          {ord.result_status === 'Critical' ? '🚨 CRITICAL' : ord.result_status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Sample Collection Action (PDF 3.6) */}
                          <button
                            onClick={() => handleOpenSampleCollection(ord)}
                            className="btn btn-secondary btn-sm"
                            title="Collect & Barcode Specimen Sample"
                            style={{ color: '#0284c7' }}
                          >
                            <TestTube2 size={13} /> Sample
                          </button>

                          {/* Result Entry Action (PDF 3.6) */}
                          <button
                            onClick={() => handleOpenResultEntry(ord)}
                            className="btn btn-secondary btn-sm"
                            title="Enter / Update Lab Results"
                          >
                            <FileSpreadsheet size={13} /> Result
                          </button>

                          {/* Report Generation Action (PDF 3.6) */}
                          {ord.result_value && (
                            <button
                              onClick={() => setPrintReportOrder(ord)}
                              className="btn btn-primary btn-sm"
                              title="Print Verified Diagnostic Report"
                            >
                              <Printer size={13} /> Report
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
      )}

      {/* Modal: Sample Collection (PDF Section 3.6) */}
      {sampleModalOrder && (
        <div className="modal-backdrop" onClick={() => setSampleModalOrder(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TestTube2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Phlebotomy Sample Collection</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PDF 3.6: Specimen accessioning & barcode labeling
                  </p>
                </div>
              </div>
              <button onClick={() => setSampleModalOrder(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSampleCollection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div><strong>Order:</strong> {sampleModalOrder.order_no} • <strong>Test:</strong> {sampleModalOrder.test_name}</div>
                <div><strong>Patient:</strong> {sampleModalOrder.patient_name} (NIC: {sampleModalOrder.patient_nic})</div>
              </div>

              <div className="form-group">
                <label className="form-label">Specimen Container / Barcode ID *</label>
                <div style={{ position: 'relative' }}>
                  <Barcode size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input
                    type="text"
                    value={sampleForm.sample_barcode}
                    onChange={(e) => setSampleForm({ ...sampleForm, sample_barcode: e.target.value })}
                    className="input-field"
                    style={{ paddingLeft: '38px', fontWeight: '700', fontFamily: 'monospace' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sample Specimen Type *</label>
                <select
                  value={sampleForm.sample_type}
                  onChange={(e) => setSampleForm({ ...sampleForm, sample_type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Venous Blood">Venous Blood (Routine)</option>
                  <option value="EDTA Whole Blood">EDTA Whole Blood (Lavender Top)</option>
                  <option value="Serum">Serum Clot Activator (Red Top)</option>
                  <option value="Fluoride Plasma">Sodium Fluoride (Grey Top for Glucose)</option>
                  <option value="Clean Catch Urine">Clean Catch Midstream Urine</option>
                  <option value="Sterile Swab / Culture">Sterile Throat / Wound Swab</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Collected By (Phlebotomist / MLT) *</label>
                <input
                  type="text"
                  value={sampleForm.collected_by}
                  onChange={(e) => setSampleForm({ ...sampleForm, collected_by: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sample Status</label>
                <select
                  value={sampleForm.sample_status}
                  onChange={(e) => setSampleForm({ ...sampleForm, sample_status: e.target.value })}
                  className="input-field"
                >
                  <option value="Sample Collected">Sample Collected & Dispatched to Lab</option>
                  <option value="In Transit">In Transit to Central Laboratory</option>
                  <option value="Sample Pending">Sample Pending Collection</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phlebotomy Clinical Notes</label>
                <input
                  type="text"
                  value={sampleForm.notes}
                  onChange={(e) => setSampleForm({ ...sampleForm, notes: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Fasting 10 hrs verified, no hemolysis"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setSampleModalOrder(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Confirm Sample Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Result Entry (PDF Section 3.6) */}
      {resultModalOrder && (
        <div className="modal-backdrop" onClick={() => setResultModalOrder(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Enter Laboratory Diagnostic Results</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Order: {resultModalOrder.order_no} • {resultModalOrder.test_name}
                </p>
              </div>
              <button onClick={() => setResultModalOrder(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveResult} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div><strong>Patient:</strong> {resultModalOrder.patient_name} (NIC: {resultModalOrder.patient_nic})</div>
                <div><strong>Standard Reference Range:</strong> {resultModalOrder.normal_range || 'Clinical Reference'}</div>
                {resultModalOrder.sample_barcode && (
                  <div><strong>Sample Tube:</strong> {resultModalOrder.sample_barcode} ({resultModalOrder.sample_type})</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Quantitative / Qualitative Result Value *</label>
                <textarea
                  rows="3"
                  value={resultForm.result_value}
                  onChange={(e) => setResultForm({ ...resultForm, result_value: e.target.value })}
                  placeholder="e.g. WBC: 6,400 /uL, Plt: 210,000 /uL, Hb: 14.2 g/dL"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Interpretation Status *</label>
                <select
                  value={resultForm.result_status}
                  onChange={(e) => setResultForm({ ...resultForm, result_status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Normal">Normal (Within Reference Limits)</option>
                  <option value="Abnormal">Abnormal (Borderline / Out of Range)</option>
                  <option value="Critical">Critical (Immediate Doctor Alert Required)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pathologist / MLT Diagnostic Comments</label>
                <input
                  type="text"
                  value={resultForm.comments}
                  onChange={(e) => setResultForm({ ...resultForm, comments: e.target.value })}
                  placeholder="Clinical remarks or recommendations"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Authorized MLT Sign-off *</label>
                <input
                  type="text"
                  value={resultForm.performed_by}
                  onChange={(e) => setResultForm({ ...resultForm, performed_by: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setResultModalOrder(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Save & Certify Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Generation & Printing (PDF Section 3.6) */}
      {printReportOrder && (
        <div className="modal-backdrop" onClick={() => setPrintReportOrder(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%', padding: '28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--brand-blue)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src="/medicore_logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>MediCore Diagnostic Laboratories</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ISO 15189 Accredited Clinical Pathology Laboratory <br />
                    142 Galle Road, Colombo 03, Sri Lanka • Tel: +94 11 234 5678
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success">CERTIFIED REPORT</span>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '6px' }}>{printReportOrder.order_no}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Date: {printReportOrder.test_date}</div>
              </div>
            </div>

            {/* Patient & Sample Specimen Info */}
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <strong>Patient:</strong> {printReportOrder.patient_name} <br />
                <strong>NIC:</strong> {printReportOrder.patient_nic || 'N/A'} <br />
                <strong>Referring Doctor:</strong> {printReportOrder.doctor_name || 'OPD Specialist'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Specimen Type:</strong> {printReportOrder.sample_type || 'Venous Blood'} <br />
                <strong>Tube Barcode:</strong> {printReportOrder.sample_barcode || 'BC-LAB-901'} <br />
                <strong>Accession Status:</strong> Specimen Verified
              </div>
            </div>

            {/* Test Investigation Findings */}
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px', color: 'var(--brand-blue)' }}>
                {printReportOrder.test_name} ({printReportOrder.category})
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 0' }}>Investigation Parameter</th>
                    <th style={{ padding: '8px 0' }}>Observed Result</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Biological Reference Interval</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 0', fontWeight: '600' }}>Diagnostic Finding</td>
                    <td style={{ padding: '10px 0', fontWeight: '700', color: printReportOrder.result_status === 'Critical' ? '#dc2626' : '#0f172a' }}>
                      {printReportOrder.result_value}
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {printReportOrder.normal_range || 'Normal biological range'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {printReportOrder.comments && (
                <div style={{ marginTop: '16px', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.825rem' }}>
                  <strong>Pathologist Diagnostic Opinion:</strong> {printReportOrder.comments}
                </div>
              )}
            </div>

            {/* Pathologist Sign-off */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed var(--border-color)', paddingTop: '16px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              <div>
                Reported by MLT: <strong>{printReportOrder.performed_by || 'Kamal Priyadharshana (MLT)'}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                Authorized Consultant Pathologist <br />
                <strong style={{ color: 'var(--text-main)' }}>Dr. Aruni Fernando (MBBS, Dip Path, MD)</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
                <Printer size={15} /> Print Verified Diagnostic Report
              </button>
              <button onClick={() => setPrintReportOrder(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Lab Order */}
      {showOrderModal && (
        <div className="modal-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Order Laboratory Investigation</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send test requisition to pathology diagnostics</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  value={orderForm.patient_id}
                  onChange={(e) => setOrderForm({ ...orderForm, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.nic})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Investigation Test *</label>
                <select
                  value={orderForm.test_id}
                  onChange={(e) => setOrderForm({ ...orderForm, test_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Select Test --</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.test_code}: {t.test_name} - {formatLKR(t.price_lkr)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sample Specimen Type</label>
                <select
                  value={orderForm.sample_type}
                  onChange={(e) => setOrderForm({ ...orderForm, sample_type: e.target.value })}
                  className="input-field"
                >
                  <option value="Venous Blood">Venous Blood</option>
                  <option value="EDTA Whole Blood">EDTA Whole Blood</option>
                  <option value="Fluoride Blood">Fluoride Blood (for Sugar)</option>
                  <option value="Serum">Serum</option>
                  <option value="Clean Catch Urine">Clean Catch Urine</option>
                  <option value="Swab / Culture">Swab / Culture</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Referring Doctor</label>
                <select
                  value={orderForm.doctor_id}
                  onChange={(e) => setOrderForm({ ...orderForm, doctor_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Hospital OPD / Internal Requisition</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowOrderModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
