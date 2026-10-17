import React, { useState, useEffect } from 'react';
import {
  Pill,
  Layers,
  ArrowUpDown,
  Building2,
  CalendarX,
  BarChart3,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  Save,
  AlertTriangle,
  Clock,
  TrendingDown,
  PackageCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function PharmacyOperationsView({ activeTab = 'pharma-categories', currentUser }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMedForStock, setSelectedMedForStock] = useState(null);

  // Forms
  const [categoryForm, setCategoryForm] = useState({ category_name: '', description: '' });
  const [supplierForm, setSupplierForm] = useState({ supplier_name: '', contact_person: '', phone: '', email: '', address: '' });
  const [stockForm, setStockForm] = useState({ adjustment: 10, reason: 'Restock shipment received' });

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [medData, catData, supData, rxData] = await Promise.all([
        api.getPharmacyMedicines(),
        api.getCategories(),
        api.getSuppliers(),
        api.getPrescriptions()
      ]);
      setMedicines(medData || []);
      setCategories(catData || []);
      setSuppliers(supData || []);
      setPrescriptions(rxData || []);
    } catch (err) {
      console.error('Error loading pharmacy operations:', err);
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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.category_name.trim()) return;
    try {
      await api.createCategory(categoryForm);
      showNotification('Medicine category added successfully!');
      setShowCategoryModal(false);
      setCategoryForm({ category_name: '', description: '' });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to add category', 'error');
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.supplier_name.trim() || !supplierForm.phone.trim()) return;
    try {
      await api.createSupplier(supplierForm);
      showNotification('Pharmaceutical supplier added successfully!');
      setShowSupplierModal(false);
      setSupplierForm({ supplier_name: '', contact_person: '', phone: '', email: '', address: '' });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to add supplier', 'error');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedMedForStock) return;
    try {
      await api.adjustStock(selectedMedForStock.id, parseInt(stockForm.adjustment, 10));
      showNotification(`Stock updated for ${selectedMedForStock.brand_name}!`);
      setShowStockModal(false);
      setSelectedMedForStock(null);
      loadData();
    } catch (err) {
      showNotification('Failed to adjust stock', 'error');
    }
  };

  const handleDispenseRx = async (id) => {
    try {
      await api.dispensePrescription(id, currentUser?.full_name || 'Pharmacist');
      showNotification('Prescription dispensed and logged successfully!');
      loadData();
    } catch (err) {
      showNotification('Failed to dispense prescription', 'error');
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hospital In-House Dispensary & Pharmacy Operations
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: '4px 0 0 0' }}>
            {currentTab === 'pharma-categories' && 'Medicine Categories'}
            {currentTab === 'pharma-stock' && 'Stock Adjustments & Inventory Tracking'}
            {currentTab === 'pharma-dispense' && 'Dispense Prescriptions'}
            {currentTab === 'pharma-suppliers' && 'Pharmaceutical Suppliers'}
            {currentTab === 'pharma-expiry' && 'Expiry Tracking & Alerts'}
            {currentTab === 'pharma-reports' && 'Pharmacy Inventory & Financial Reports'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          {currentTab === 'pharma-categories' && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          )}
          {currentTab === 'pharma-suppliers' && (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'pharma-categories', label: 'Categories', icon: Layers },
          { id: 'pharma-stock', label: 'Stock Management', icon: ArrowUpDown },
          { id: 'pharma-dispense', label: 'Dispense Medicines', icon: Pill },
          { id: 'pharma-suppliers', label: 'Suppliers', icon: Building2 },
          { id: 'pharma-expiry', label: 'Expiry Tracking', icon: CalendarX },
          { id: 'pharma-reports', label: 'Pharmacy Reports', icon: BarChart3 }
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

      {/* Tab 1: Medicine Categories */}
      {currentTab === 'pharma-categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {categories.map(cat => {
            const count = medicines.filter(m => (m.category || '').toLowerCase() === cat.category_name.toLowerCase()).length;
            return (
              <div key={cat.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>{cat.category_name}</h3>
                  <span className="badge badge-info">{count} Medicines</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  {cat.description || 'Standard pharmaceutical class and therapeutic category'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Stock Management */}
      {currentTab === 'pharma-stock' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Code</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Medicine Name</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Category</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Current Stock</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Min Level</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>{m.code}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{m.brand_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.generic_name} • {m.dosage_form}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{m.category}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '800', color: m.stock_quantity <= m.reorder_level ? '#dc2626' : '#0f172a' }}>
                    {m.stock_quantity} units
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{m.reorder_level} units</td>
                  <td style={{ padding: '14px 20px' }}>
                    {m.stock_quantity === 0 ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : m.stock_quantity <= m.reorder_level ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">Sufficient</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedMedForStock(m);
                        setShowStockModal(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Dispense Medicines */}
      {currentTab === 'pharma-dispense' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Prescription</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Patient</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Prescribed Medicine</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Dosage & Instructions</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Dispensing Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0284c7' }}>RX-{String(p.id).padStart(4, '0')}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{p.patient_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>NIC: {p.patient_nic || 'N/A'}</div>
                    {p.patient_allergies && !/^none/i.test(p.patient_allergies) ? (
                      <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '700', border: '1px solid #fca5a5', marginTop: '4px', display: 'inline-block' }}>
                        ⚠️ Allergy: {p.patient_allergies}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                        ✓ No recorded allergies
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f172a' }}>{p.medicine_name}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#475569' }}>
                    {p.dosage} • {p.frequency} ({p.duration})
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${p.dispense_status === 'Dispensed' ? 'badge-success' : 'badge-warning'}`}>
                      {p.dispense_status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {p.dispense_status !== 'Dispensed' ? (
                      <button
                        onClick={() => handleDispenseRx(p.id)}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        Dispense Now
                      </button>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: '700' }}>✓ Dispensed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Suppliers */}
      {currentTab === 'pharma-suppliers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {suppliers.map(sup => (
            <div key={sup.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Building2 size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{sup.supplier_name}</h3>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>
                <div><strong>Contact Person:</strong> {sup.contact_person || 'Representative'}</div>
                <div><strong>Phone Hotline:</strong> {sup.phone}</div>
                <div><strong>Email:</strong> {sup.email || 'orders@supplier.lk'}</div>
                <div><strong>Address:</strong> {sup.address || 'Colombo, Sri Lanka'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Expiry Tracking */}
      {currentTab === 'pharma-expiry' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Medicine</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Batch Number</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Available Stock</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Expiry Date</th>
                <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#475569' }}>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(m => {
                const exp = new Date(m.expiry_date);
                const now = new Date();
                const daysLeft = Math.round((exp - now) / (1000 * 60 * 60 * 24));
                const isExpired = daysLeft < 0;
                const isCritical = daysLeft >= 0 && daysLeft <= 90;

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{m.brand_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.generic_name}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#475569' }}>{m.batch_no}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '700' }}>{m.stock_quantity} units</td>
                    <td style={{ padding: '14px 20px', fontWeight: '600' }}>{m.expiry_date}</td>
                    <td style={{ padding: '14px 20px' }}>
                      {isExpired ? (
                        <span className="badge badge-danger">Expired</span>
                      ) : isCritical ? (
                        <span className="badge badge-warning">Expiring in {daysLeft} days</span>
                      ) : (
                        <span className="badge badge-success">Good ({daysLeft} days left)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Pharmacy Reports */}
      {currentTab === 'pharma-reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderTop: '4px solid #0284c7' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800' }}>Inventory Valuation</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7', marginBottom: '8px' }}>
              Rs. {medicines.reduce((sum, m) => sum + ((m.stock_quantity || 0) * (m.unit_price_lkr || 15)), 0).toLocaleString()}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Total wholesale valuation of current dispensary inventory
            </p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800' }}>Dispensed Prescriptions</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
              {prescriptions.filter(p => p.dispense_status === 'Dispensed').length}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Total prescriptions successfully dispensed to patients
            </p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800' }}>Reorder Attention</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>
              {medicines.filter(m => (m.stock_quantity || 0) <= (m.reorder_level || 20)).length}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Medicines currently at or below minimum threshold
            </p>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {showCategoryModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '480px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>Add Medicine Category</h3>
            <form onSubmit={handleAddCategory}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dermatologicals, Antihistamines"
                  value={categoryForm.category_name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Class therapeutic description..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {showSupplierModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '520px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>Add Pharmaceutical Supplier</h3>
            <form onSubmit={handleAddSupplier}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Supplier / Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SPC Sri Lanka, Baurs"
                  value={supplierForm.supplier_name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Contact Person</label>
                  <input
                    type="text"
                    placeholder="Representative name"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Phone Number *</label>
                  <input
                    type="text"
                    placeholder="+94 11 000 0000"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="orders@supplier.lk"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Warehouse Address</label>
                <textarea
                  rows="2"
                  placeholder="Street address, city..."
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowSupplierModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock */}
      {showStockModal && selectedMedForStock && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '460px', width: '92%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>
              Adjust Stock: {selectedMedForStock.brand_name}
            </h3>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div>Current Stock: <strong>{selectedMedForStock.stock_quantity} units</strong></div>
              <div>Batch No: <strong>{selectedMedForStock.batch_no}</strong></div>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                  Quantity Change (+ for addition, - for deduction) *
                </label>
                <input
                  type="number"
                  value={stockForm.adjustment}
                  onChange={(e) => setStockForm({ ...stockForm, adjustment: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Shipment received, damaged pack removed"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
