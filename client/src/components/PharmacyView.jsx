import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Search,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpDown,
  Calendar,
  X,
  CheckCircle,
  Truck,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

export default function PharmacyView() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockModalMed, setStockModalMed] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState(100);

  const [formData, setFormData] = useState({
    brand_name: '',
    generic_name: '',
    category: 'Analgesic',
    dosage_form: 'Tablet',
    strength: '500mg',
    batch_no: '',
    stock_quantity: 500,
    reorder_level: 100,
    unit_price_lkr: 15.00,
    expiry_date: '2027-12-31',
    manufacturer: 'State Pharmaceuticals Corporation (SPC)'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPharmacyMedicines(searchTerm, selectedCategory, filterLowStock);
      setMedicines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCategory, filterLowStock]);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!stockModalMed) return;
    try {
      await api.adjustStock(stockModalMed.id, stockAdjustment);
      setStockModalMed(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.createMedicine(formData);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add medicine');
    }
  };

  const formatLKR = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const categories = ['All', 'Analgesic & Antipyretic', 'Antibiotic', 'Antidiabetic', 'Antihypertensive', 'Lipid Regulating', 'Proton Pump Inhibitor', 'Respiratory / Bronchodilator', 'Antihistamine'];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Pharmacy Dispensary & Medicine Stock</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            NMRA registered pharmaceuticals, batch monitoring, expiry tracking, and dispensing.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              brand_name: '',
              generic_name: '',
              category: 'Analgesic & Antipyretic',
              dosage_form: 'Tablet',
              strength: '500mg',
              batch_no: `SL-BN-2026-${Math.floor(100 + Math.random() * 900)}`,
              stock_quantity: 500,
              reorder_level: 100,
              unit_price_lkr: 20.00,
              expiry_date: '2027-12-31',
              manufacturer: 'SPC Sri Lanka'
            });
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> Add Pharmaceutical Drug
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search brand, generic name, or drug code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-select"
          style={{ width: '220px' }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`btn ${filterLowStock ? 'btn-danger' : 'btn-secondary'} btn-sm`}
          style={{ height: '38px' }}
        >
          <AlertTriangle size={14} /> Low Stock Only
        </button>
      </div>

      {/* Medicines Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Drug Code</th>
                <th>Brand & Generic Name</th>
                <th>Strength & Form</th>
                <th>Batch No</th>
                <th>Stock Units</th>
                <th>Unit Price (LKR)</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                    Loading pharmacy inventory...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No medicines match the selected filter.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => {
                  const isLow = med.stock_quantity <= med.reorder_level;
                  const isExpiringSoon = new Date(med.expiry_date) < new Date('2027-01-01');

                  return (
                    <tr key={med.id}>
                      <td>
                        <span style={{ fontWeight: '700', color: 'var(--brand-blue)', fontSize: '0.8rem' }}>
                          {med.code}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{med.brand_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.generic_name} • {med.manufacturer}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{med.dosage_form}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{med.strength}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{med.batch_no}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '800', color: isLow ? 'var(--color-danger)' : 'var(--text-main)', fontSize: '0.9rem' }}>
                          {med.stock_quantity.toLocaleString()} units
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Reorder at: {med.reorder_level}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-success)' }}>{formatLKR(med.unit_price_lkr)}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem', color: isExpiringSoon ? 'var(--color-warning)' : 'var(--text-main)' }}>
                          {med.expiry_date}
                        </div>
                        {isExpiringSoon && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: '600' }}>
                            Expiring Soon
                          </div>
                        )}
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-danger">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setStockModalMed(med);
                            setStockAdjustment(100);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Restock / Dispense Adjustment"
                        >
                          <ArrowUpDown size={13} /> Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Restock / Adjust */}
      {stockModalMed && (
        <div className="modal-overlay" onClick={() => setStockModalMed(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Stock Adjustment</h3>
              <button onClick={() => setStockModalMed(null)} className="btn btn-secondary btn-sm">
                <X size={15} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
              <strong>{stockModalMed.brand_name}</strong> ({stockModalMed.strength})<br />
              Current Stock: <strong>{stockModalMed.stock_quantity} units</strong> • Batch: {stockModalMed.batch_no}
            </div>

            <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Units to Add (Positive) or Dispense (Negative)</label>
                <input
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  e.g. +100 for incoming supplier delivery, or -10 for dispensed
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setStockModalMed(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Medicine */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Add Pharmaceutical Drug to Formulary</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NMRA certified medicine stock catalog</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Generic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin + Clavulanic Acid"
                  value={formData.generic_name}
                  onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Strength</label>
                <input
                  type="text"
                  placeholder="625mg / 500mg"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dosage Form</label>
                <select
                  value={formData.dosage_form}
                  onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  className="form-select"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup / Liquid">Syrup / Liquid</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream / Ointment">Cream / Ointment</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Level Alert</label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Price (LKR) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.unit_price_lkr}
                  onChange={(e) => setFormData({ ...formData, unit_price_lkr: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Manufacturer / Supplier</label>
                <input
                  type="text"
                  placeholder="State Pharmaceuticals Corporation (SPC) / Astron / Morison"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
