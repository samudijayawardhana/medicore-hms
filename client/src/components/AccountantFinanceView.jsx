import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FilePlus,
  Clock,
  History,
  FileCheck,
  TrendingUp,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  Calendar,
  DollarSign,
  User,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { api } from '../services/api';

export default function AccountantFinanceView({ activeTab = 'accountant-create-bill', currentUser }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modal / Selected states
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  // Forms
  const [billForm, setBillForm] = useState({
    patient_id: '',
    consultation_fee: 3500,
    laboratory_charges: 850,
    pharmacy_charges: 1200,
    admission_charges: 0,
    discount_lkr: 0
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    payment_method: 'Cash',
    transaction_ref: ''
  });

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, pData, ptData] = await Promise.all([
        api.getBills(),
        api.getPaymentHistory(),
        api.getPatients()
      ]);
      setBills(bData || []);
      setPayments(pData || []);
      setPatients(ptData || []);
    } catch (err) {
      console.error('Error loading finance data:', err);
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

  const calculateTotal = () => {
    const subtotal =
      Number(billForm.consultation_fee || 0) +
      Number(billForm.laboratory_charges || 0) +
      Number(billForm.pharmacy_charges || 0) +
      Number(billForm.admission_charges || 0);
    return Math.max(0, subtotal - Number(billForm.discount_lkr || 0));
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!billForm.patient_id) {
      showNotification('Please select a patient.', 'error');
      return;
    }
    try {
      const total = calculateTotal();
      await api.createBill({
        ...billForm,
        total_amount: total,
        status: 'Paid'
      });
      showNotification(`Invoice created and saved successfully! Total: Rs. ${total.toLocaleString()}`);
      setBillForm({
        patient_id: '',
        consultation_fee: 3500,
        laboratory_charges: 850,
        pharmacy_charges: 1200,
        admission_charges: 0,
        discount_lkr: 0
      });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to create bill', 'error');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedBillForPay || !payForm.amount) return;
    try {
      await api.recordPayment({
        invoice_id: selectedBillForPay.id,
        amount: parseFloat(payForm.amount),
        payment_method: payForm.payment_method,
        transaction_ref: payForm.transaction_ref || `TXN-${Date.now()}`
      });
      showNotification('Payment recorded successfully!');
      setShowPayModal(false);
      setSelectedBillForPay(null);
      setPayForm({ amount: '', payment_method: 'Cash', transaction_ref: '' });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to record payment', 'error');
    }
  };

  const pendingBills = bills.filter(b => (b.status || '').toLowerCase() !== 'paid');

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hospital Financial Accounting & Invoicing
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: '4px 0 0 0' }}>
            {currentTab === 'accountant-create-bill' && 'Create Billing Invoice'}
            {currentTab === 'accountant-payments' && 'Payment Management & Cashier'}
            {currentTab === 'accountant-pending' && 'Outstanding Balances & Pending Invoices'}
            {currentTab === 'accountant-history' && 'Payment Transactions History'}
            {currentTab === 'accountant-invoices' && 'Invoice Records & Print Preview'}
            {currentTab === 'accountant-reports' && 'Financial Summaries & Department Revenue'}
          </h1>
        </div>

        <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'accountant-create-bill', label: 'Create Bill', icon: FilePlus },
          { id: 'accountant-payments', label: 'Payment Desk', icon: CreditCard },
          { id: 'accountant-pending', label: 'Pending Payments', icon: Clock },
          { id: 'accountant-history', label: 'Payment History', icon: History },
          { id: 'accountant-invoices', label: 'Invoices', icon: FileCheck },
          { id: 'accountant-reports', label: 'Financial Reports', icon: TrendingUp }
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

      {/* Tab 1: Create Bill */}
      {currentTab === 'accountant-create-bill' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 600px) minmax(300px, 1fr)', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '1.2rem', fontWeight: '800' }}>Invoice Charges Breakdown</h3>
            <form onSubmit={handleCreateBill}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Patient *</label>
                <select
                  value={billForm.patient_id}
                  onChange={(e) => setBillForm({ ...billForm, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_no})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Consultation Fee (Rs.)</label>
                  <input
                    type="number"
                    value={billForm.consultation_fee}
                    onChange={(e) => setBillForm({ ...billForm, consultation_fee: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Laboratory Charges (Rs.)</label>
                  <input
                    type="number"
                    value={billForm.laboratory_charges}
                    onChange={(e) => setBillForm({ ...billForm, laboratory_charges: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Pharmacy Medicines (Rs.)</label>
                  <input
                    type="number"
                    value={billForm.pharmacy_charges}
                    onChange={(e) => setBillForm({ ...billForm, pharmacy_charges: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Admission / Ward (Rs.)</label>
                  <input
                    type="number"
                    value={billForm.admission_charges}
                    onChange={(e) => setBillForm({ ...billForm, admission_charges: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Discount (Rs.)</label>
                <input
                  type="number"
                  value={billForm.discount_lkr}
                  onChange={(e) => setBillForm({ ...billForm, discount_lkr: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                Save Bill & Generate Invoice (Rs. {calculateTotal().toLocaleString()})
              </button>
            </form>
          </div>

          {/* Real-time Summary Card */}
          <div className="card" style={{ padding: '28px', background: 'linear-gradient(135deg, #071529 0%, #0f2b48 100%)', color: '#ffffff' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>Invoice Summary</h3>
            <div style={{ fontSize: '0.9rem', lineHeight: 2, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Consultation Fee:</span>
                <span>Rs. {Number(billForm.consultation_fee || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Laboratory Investigations:</span>
                <span>Rs. {Number(billForm.laboratory_charges || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Pharmacy Dispensary:</span>
                <span>Rs. {Number(billForm.pharmacy_charges || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Ward & Admission:</span>
                <span>Rs. {Number(billForm.admission_charges || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                <span>Discount Applied:</span>
                <span>- Rs. {Number(billForm.discount_lkr || 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>Net Payable Amount:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38bdf8' }}>
                Rs. {calculateTotal().toLocaleString()}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              ✓ All fees calculated in accordance with MediCore Colombo Schedule of Charges 2026.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payment Desk */}
      {currentTab === 'accountant-payments' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Invoice No</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient Name</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Invoice Date</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Total Amount</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{b.bill_no}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{b.patient_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>NIC: {b.patient_nic || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{b.bill_date}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a' }}>
                    Rs. {Number(b.total_amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${b.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedInvoiceForPrint(b)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', marginRight: '8px' }}
                    >
                      View Invoice
                    </button>
                    {b.status !== 'Paid' && (
                      <button
                        onClick={() => {
                          setSelectedBillForPay(b);
                          setPayForm(prev => ({ ...prev, amount: b.total_amount }));
                          setShowPayModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Pending Payments */}
      {currentTab === 'accountant-pending' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Invoice No</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient Name</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Outstanding Amount</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{b.bill_no}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '700' }}>{b.patient_name}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '800', color: '#dc2626' }}>
                    Rs. {Number(b.total_amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-danger">Unpaid</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedBillForPay(b);
                        setPayForm(prev => ({ ...prev, amount: b.total_amount }));
                        setShowPayModal(true);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Receive Payment
                    </button>
                  </td>
                </tr>
              ))}
              {pendingBills.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#16a34a', fontWeight: '600' }}>
                    ✓ All customer and patient invoices are fully settled. No outstanding balances!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Payment History */}
      {currentTab === 'accountant-history' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Transaction Ref</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Bill Reference</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Amount Paid</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Payment Method</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{p.transaction_ref}</td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>{p.bill_no || `Invoice #${p.invoice_id}`}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '600' }}>{p.patient_name || 'Patient'}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '800', color: '#16a34a' }}>
                    Rs. {Number(p.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-info">{p.payment_method}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.85rem' }}>{p.paid_at}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No payment history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Invoices */}
      {currentTab === 'accountant-invoices' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {bills.map(b => (
            <div key={b.id} className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>{b.bill_no}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {b.bill_date}</div>
                </div>
                <span className={`badge ${b.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  {b.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '14px' }}>
                <strong>Patient:</strong> {b.patient_name} <br />
                <strong>NIC:</strong> {b.patient_nic || 'N/A'} <br />
                <strong>Total Amount:</strong> <strong style={{ color: '#0284c7' }}>Rs. {Number(b.total_amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSelectedInvoiceForPrint(b)} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                  Print Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Financial Reports */}
      {currentTab === 'accountant-reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderTop: '4px solid #0284c7' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '800' }}>Total Billed Revenue</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7', marginBottom: '8px' }}>
              Rs. {bills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0).toLocaleString()}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cumulative hospital billings</p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '800' }}>Settled Payments</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
              Rs. {bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0).toLocaleString()}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cleared financial transactions</p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #ef4444' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '800' }}>Outstanding Invoices</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>
              Rs. {pendingBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0).toLocaleString()}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Awaiting payment clearance</p>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {showPayModal && selectedBillForPay && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '460px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>
              Record Payment ({selectedBillForPay.bill_no})
            </h3>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div>Patient: <strong>{selectedBillForPay.patient_name}</strong></div>
              <div>Invoice Total: <strong>Rs. {Number(selectedBillForPay.total_amount || 0).toLocaleString()}</strong></div>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Amount to Pay (Rs.) *</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Payment Method *</label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                  className="input-field"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Health Insurance">Health Insurance (Sri Lanka)</option>
                  <option value="Online Transfer">Online Transfer</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={payForm.transaction_ref}
                  onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View / Print Invoice */}
      {selectedInvoiceForPrint && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '580px', width: '92%', padding: '32px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: '800', color: '#0284c7' }}>
                MediCore Hospital (Pvt) Ltd
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                142 Galle Road, Colombo 03, Sri Lanka • Hotline: +94 11 234 5678
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '6px' }}>
                OFFICIAL INVOICE & RECEIPT
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <strong>Invoice Number:</strong> {selectedInvoiceForPrint.bill_no} <br />
                <strong>Date:</strong> {selectedInvoiceForPrint.bill_date} <br />
                <strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{selectedInvoiceForPrint.status}</span>
              </div>
              <div>
                <strong>Patient Name:</strong> {selectedInvoiceForPrint.patient_name} <br />
                <strong>NIC:</strong> {selectedInvoiceForPrint.patient_nic || 'N/A'} <br />
                <strong>Contact:</strong> {selectedInvoiceForPrint.patient_phone || 'N/A'}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Description</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Consultation & Clinical Services</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>3,500.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Laboratory Investigations</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>850.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: '800', borderTop: '2px solid #0f172a' }}>
                  <td style={{ padding: '12px' }}>Total Amount Paid</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#0284c7', fontSize: '1.1rem' }}>
                    Rs. {Number(selectedInvoiceForPrint.total_amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
              <button onClick={() => setSelectedInvoiceForPrint(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
