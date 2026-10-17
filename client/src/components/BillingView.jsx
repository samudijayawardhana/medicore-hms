import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  CreditCard,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  FileSpreadsheet,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const INSURANCE_PROVIDERS = [
  'Direct Patient Cash / Card',
  'Sri Lanka Insurance Corporation (SLIC)',
  'Ceylinco Life Medisure',
  'AIA Insurance Lanka',
  'Softlogic Life Healthcare',
  'Union Assurance',
  'Allianz Insurance Lanka',
  'Fairfirst Insurance'
];

export default function BillingView() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [payModalBill, setPayModalBill] = useState(null);

  // Form State for New Invoice (PDF 3.8: Consultation, Lab, Pharmacy, Admission charges)
  const [formData, setFormData] = useState({
    patient_id: '',
    consultation_fee: 3500,
    laboratory_charges: 1850,
    pharmacy_charges: 1200,
    admission_charges: 0,
    discount_lkr: 0,
    status: 'Paid',
    payment_method: 'Credit Card',
    insurance_provider: 'Direct Patient Cash / Card',
    notes: 'Outpatient specialist consultation and lab tests'
  });

  // Receive Payment Form State (PDF Page 7: Receive Payment)
  const [payForm, setPayForm] = useState({
    payment_method: 'Cash',
    notes: 'Settled in full at central cashier counter'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [billList, ptList] = await Promise.all([
        api.getBills(),
        api.getPatients()
      ]);
      setBills(billList);
      setPatients(ptList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      alert('Patient is required.');
      return;
    }
    try {
      const created = await api.createBill(formData);
      setShowCreateModal(false);
      loadData();
      if (formData.status === 'Paid') {
        setReceiptToPrint(created);
      }
    } catch (err) {
      alert(err.message || 'Error generating bill');
    }
  };

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    if (!payModalBill) return;
    try {
      const updated = await api.receiveBillPayment(payModalBill.id, payForm);
      setPayModalBill(null);
      loadData();
      setReceiptToPrint({ ...payModalBill, status: 'Paid', payment_method: payForm.payment_method });
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const formatLKR = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculatedTotal =
    Math.max(
      0,
      (parseFloat(formData.consultation_fee) || 0) +
      (parseFloat(formData.laboratory_charges) || 0) +
      (parseFloat(formData.pharmacy_charges) || 0) +
      (parseFloat(formData.admission_charges) || 0) -
      (parseFloat(formData.discount_lkr) || 0)
    );

  const filteredBills = bills.filter(b => {
    const matchesSearch = !searchTerm ||
      b.bill_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patient_nic?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'PAID') return (b.status || '').toLowerCase() === 'paid';
    if (filterStatus === 'PENDING') return (b.status || '').toLowerCase() !== 'paid';
    return true;
  });

  const totalCollected = bills
    .filter(b => (b.status || '').toLowerCase() === 'paid')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const totalPending = bills
    .filter(b => (b.status || '').toLowerCase() !== 'paid')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Receipt size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Hospital Billing, Invoicing & Cashier</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Itemized charges (Consultation, Lab, Pharmacy, Admission), invoice generation, payment recording, and receipts (PDF 3.8 & Page 7).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              patient_id: patients[0]?.id || '',
              consultation_fee: 3500,
              laboratory_charges: 1850,
              pharmacy_charges: 950,
              admission_charges: 0,
              discount_lkr: 0,
              status: 'Paid',
              payment_method: 'Credit Card',
              insurance_provider: 'Direct Patient Cash / Card',
              notes: 'Clinical services & diagnostics settlement'
            });
            setShowCreateModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> Generate New Invoice
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Invoices</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--brand-blue)', marginTop: '4px' }}>{bills.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>All patient bills generated</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Settled Revenue (Paid)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{formatLKR(totalCollected)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Cashier verified payments</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding (Pending Payment)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>{formatLKR(totalPending)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Unpaid patient bills</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search invoice #, patient name, NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'PAID', label: 'Paid & Settled' },
            { id: 'PENDING', label: 'Pending Payment' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: filterStatus === f.id ? '#0284c7' : 'var(--bg-secondary)',
                color: filterStatus === f.id ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Patient Name</th>
                <th>Date</th>
                <th>Itemized Charges (LKR)</th>
                <th>Total (LKR)</th>
                <th>Payment Mode & Payer</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    Loading financial records...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No invoice records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                  const isPaid = (b.status || '').toLowerCase() === 'paid';
                  return (
                    <tr key={b.id}>
                      <td>
                        <span style={{ fontWeight: '700', color: 'var(--brand-blue)', fontSize: '0.85rem' }}>
                          {b.bill_no}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{b.patient_name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>NIC: {b.patient_nic || 'N/A'}</div>
                      </td>
                      <td>{b.bill_date}</td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Consultation: {formatLKR(b.consultation_fee)} • Lab: {formatLKR(b.laboratory_charges)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Pharmacy: {formatLKR(b.pharmacy_charges)} • Ward: {formatLKR(b.admission_charges)}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: isPaid ? '#059669' : '#f59e0b' }}>
                          {formatLKR(b.total_amount)}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{b.payment_method || 'Cash / Card'}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{b.insurance_provider}</div>
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {isPaid ? '● PAID' : '⏳ PENDING'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Receive Payment Action (PDF Page 7) */}
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setPayModalBill(b);
                                setPayForm({ payment_method: 'Cash', notes: 'Settled in full at counter' });
                              }}
                              className="btn btn-primary btn-sm"
                              title="Receive Payment from Patient"
                            >
                              <DollarSign size={13} /> Receive Payment
                            </button>
                          )}

                          {/* Print Receipt Action (PDF Page 7) */}
                          <button
                            onClick={() => setReceiptToPrint(b)}
                            className="btn btn-secondary btn-sm"
                            title="Print Official Cashier Receipt"
                          >
                            <Printer size={13} /> Print Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Invoice (PDF 3.8: Consultation, Lab, Pharmacy, Admission charges) */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%', padding: '24px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Generate Hospital Invoice</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Itemized charges: Consultation, Lab, Pharmacy, Admission (PDF 3.8)
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBill} style={{ paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.nic})</option>
                  ))}
                </select>
              </div>

              {/* Charges Breakdown Grid - PDF 3.8 Exact Requirements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Consultation Charges (LKR) *</label>
                  <input
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Laboratory Charges (LKR) *</label>
                  <input
                    type="number"
                    value={formData.laboratory_charges}
                    onChange={(e) => setFormData({ ...formData, laboratory_charges: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pharmacy Charges (LKR) *</label>
                  <input
                    type="number"
                    value={formData.pharmacy_charges}
                    onChange={(e) => setFormData({ ...formData, pharmacy_charges: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admission / Bed Charges (LKR) *</label>
                  <input
                    type="number"
                    value={formData.admission_charges}
                    onChange={(e) => setFormData({ ...formData, admission_charges: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Healthcare Discount (LKR)</label>
                  <input
                    type="number"
                    value={formData.discount_lkr}
                    onChange={(e) => setFormData({ ...formData, discount_lkr: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Invoice Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="Paid">Immediate Payment Received (Paid)</option>
                    <option value="Pending">Pending Payment at Cashier Counter</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input-field"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Health Insurance">Health Insurance Claim</option>
                    <option value="Online Transfer">Online Fund Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Insurance Provider / Payer</label>
                  <select
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                    className="input-field"
                  >
                    {INSURANCE_PROVIDERS.map(ins => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Summary Callout */}
              <div style={{ padding: '16px', background: 'var(--brand-gradient-subtle)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Net Total Payable (LKR)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-blue)' }}>
                    {formatLKR(calculatedTotal)}
                  </div>
                </div>
                <span className={`badge ${formData.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  {formData.status === 'Paid' ? 'Paid Immediately' : 'Will Pay at Counter'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive Payment (PDF Page 7: Receive Payment) */}
      {payModalBill && (
        <div className="modal-backdrop" onClick={() => setPayModalBill(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%', padding: '24px' }}>
            <div style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Receive Patient Payment</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PDF Page 7: Settle outstanding invoice {payModalBill.bill_no}
                  </p>
                </div>
              </div>
              <button onClick={() => setPayModalBill(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReceivePayment} style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div><strong>Patient:</strong> {payModalBill.patient_name}</div>
                <div style={{ marginTop: '4px' }}>
                  <strong>Amount Due:</strong> <span style={{ color: '#059669', fontWeight: '800', fontSize: '1.1rem' }}>{formatLKR(payModalBill.total_amount)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method Received *</label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Cash">Cash (Counter Note / Slip)</option>
                  <option value="Credit Card">Visa / Mastercard (POS Machine)</option>
                  <option value="Debit Card">LankaPay / Debit Card</option>
                  <option value="Health Insurance">Direct Insurance Settlement</option>
                  <option value="Online Transfer">Digital / QR / Online Banking</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cashier Settlement Remarks</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Card Authorization code or Receipt ref"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setPayModalBill(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669' }}>
                  <CheckCircle2 size={16} /> Confirm Payment & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Hospital Receipt (PDF Page 7: Print Receipt) */}
      {receiptToPrint && (
        <div className="modal-backdrop" onClick={() => setReceiptToPrint(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%', padding: '28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--brand-blue)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src="/medicore_logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>MediCore Hospital (Pvt) Ltd</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No. 142, Galle Road, Colombo 03, Sri Lanka <br />
                    Tel: +94 11 234 5678 • Reg No: PV-90184
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success">OFFICIAL RECEIPT</span>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '6px' }}>{receiptToPrint.bill_no}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Date: {receiptToPrint.bill_date}</div>
              </div>
            </div>

            {/* Patient Info */}
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <strong>Billed To:</strong> {receiptToPrint.patient_name} <br />
                <strong>NIC:</strong> {receiptToPrint.patient_nic || 'N/A'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Payment Mode:</strong> {receiptToPrint.payment_method || 'Cash / Card'} <br />
                <strong>Payer / Insurance:</strong> {receiptToPrint.insurance_provider || 'Self Pay'}
              </div>
            </div>

            {/* Line Items - PDF 3.8 Breakdown */}
            <div style={{ padding: '16px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '6px 0' }}>Item Description (PDF 3.8 Breakdown)</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {parseFloat(receiptToPrint.consultation_fee) > 0 && (
                    <tr>
                      <td style={{ padding: '8px 0' }}>Specialist Doctor Consultation Charges</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatLKR(receiptToPrint.consultation_fee)}</td>
                    </tr>
                  )}
                  {parseFloat(receiptToPrint.laboratory_charges) > 0 && (
                    <tr>
                      <td style={{ padding: '8px 0' }}>Pathology & Laboratory Diagnostic Charges</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatLKR(receiptToPrint.laboratory_charges)}</td>
                    </tr>
                  )}
                  {parseFloat(receiptToPrint.pharmacy_charges) > 0 && (
                    <tr>
                      <td style={{ padding: '8px 0' }}>Pharmacy Dispensary & Medicine Charges</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatLKR(receiptToPrint.pharmacy_charges)}</td>
                    </tr>
                  )}
                  {parseFloat(receiptToPrint.admission_charges) > 0 && (
                    <tr>
                      <td style={{ padding: '8px 0' }}>Inpatient Ward Admission & Nursing Charges</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatLKR(receiptToPrint.admission_charges)}</td>
                    </tr>
                  )}
                  {parseFloat(receiptToPrint.discount_lkr) > 0 && (
                    <tr style={{ color: 'var(--color-danger)' }}>
                      <td style={{ padding: '8px 0' }}>Promotional / Healthcare Card Discount</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>-{formatLKR(receiptToPrint.discount_lkr)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--brand-blue)', marginTop: '12px', paddingTop: '12px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '800' }}>TOTAL AMOUNT PAID</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--brand-blue)' }}>
                  {formatLKR(receiptToPrint.total_amount)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div>
                Cashier: <strong>Sachini Gamage (Accountant / Cashier)</strong> <br />
                System: MediCore HMS Colombo
              </div>
              <div style={{ textAlign: 'right' }}>
                Thank you for choosing MediCore Healthcare. <br />
                <em>This is a computer generated legal receipt.</em>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
                <Printer size={15} /> Print Receipt
              </button>
              <button onClick={() => setReceiptToPrint(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
