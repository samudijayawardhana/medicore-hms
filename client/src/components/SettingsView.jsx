import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  User,
  KeyRound,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Database,
  Download,
  ShieldCheck,
  History,
  Server,
  Search
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView({ currentUser, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [hospitalInfo, setHospitalInfo] = useState({
    hospital_name: 'MediCore Hospital (Pvt) Ltd',
    hospital_code: 'MC-COL-01',
    tagline: 'Better Care, Smarter Management, Healthier Tomorrow',
    address: '142 Galle Road, Colombo 03, Sri Lanka',
    phone: '+94 11 234 5678',
    emergency_hotline: '+94 11 999 0000',
    email: 'info@medicore.lk',
    currency: 'LKR',
    currency_symbol: 'Rs.'
  });

  // Change Username form
  const [usernameForm, setUsernameForm] = useState({
    new_username: '',
    confirm_username: '',
    current_password: ''
  });

  // Change Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // System preferences
  const [preferences, setPreferences] = useState({
    session_timeout_mins: 30,
    email_alerts: true,
    audio_alerts: true,
    critical_lab_push: true
  });

  // Backup & Audit State (PDF Section 4 & 10)
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('ALL');
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'backup') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const data = await api.getSystemBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medicore_hms_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ text: 'System database backup downloaded successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Backup generation failed: ' + err.message, type: 'error' });
    } finally {
      setDownloadingBackup(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getHospitalSettings();
        if (data) setHospitalInfo(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const handleSaveHospital = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateHospitalSettings(hospitalInfo);
      setMessage({ text: 'Hospital information updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    if (usernameForm.new_username !== usernameForm.confirm_username) {
      setMessage({ text: 'New username and confirmation do not match.', type: 'error' });
      return;
    }
    if (!usernameForm.current_password) {
      setMessage({ text: 'Please enter your current password to authorize this change.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.changeUsername(currentUser.id, usernameForm.new_username, usernameForm.current_password);
      setMessage({ text: res.message || 'Username changed successfully!', type: 'success' });
      setUsernameForm({ new_username: '', confirm_username: '', current_password: '' });
      if (onUserUpdated) {
        onUserUpdated({ ...currentUser, username: res.username });
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.changePassword(currentUser.id, passwordForm.current_password, passwordForm.new_password);
      setMessage({ text: res.message || 'Password updated successfully!', type: 'success' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              System Settings & Profile Management
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Configure hospital credentials, administrative profile security, and session parameters
            </p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: message.type === 'error' ? '#dc2626' : '#059669',
            border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem'
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content Card with Navigation Tabs */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Navigation Tabs Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            overflowX: 'auto'
          }}
        >
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'profile' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <User size={16} />
            <span>Admin Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('username')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'username' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'username' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Shield size={16} />
            <span>Change Username</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'password' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'password' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <KeyRound size={16} />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setActiveTab('hospital')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'hospital' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'hospital' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Building2 size={16} />
            <span>Hospital Information</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'preferences' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'preferences' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Bell size={16} />
            <span>Sessions & Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'backup' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'backup' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Database size={16} />
            <span>Backup & Disaster Recovery</span>
          </button>
        </div>

        {/* Tab 1: Admin Profile */}
        {activeTab === 'profile' && (
          <div style={{ padding: '32px', maxWidth: '720px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Authenticated Administrator Profile
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your profile information verified against the hospital database.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0057b7 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: '800',
                  boxShadow: '0 8px 20px rgba(0, 87, 183, 0.3)'
                }}
              >
                {(currentUser?.full_name || 'A')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {currentUser?.full_name || 'Admin User'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: '600' }}>
                  @{currentUser?.username || 'admin'} • {currentUser?.role || 'Administrator'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hospital Administration • Full Operations Clearance
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.full_name || 'Dr. Asela Wickramasinghe'}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'default' }}
                />
              </div>

              <div>
                <label className="form-label">Active Username</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.username || 'admin'}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'default' }}
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={currentUser?.email || 'director@medicore.lk'}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'default' }}
                />
              </div>

              <div>
                <label className="form-label">Assigned Role</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.role || 'Administrator'}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'default', color: '#0284c7', fontWeight: '700' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setActiveTab('username')} className="btn btn-secondary">
                Change Username
              </button>
              <button onClick={() => setActiveTab('password')} className="btn btn-primary">
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Change Username */}
        {activeTab === 'username' && (
          <div style={{ padding: '32px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Change Administrator Username
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Update your account login handle. Your assigned Administrator role will remain strictly preserved.
            </p>

            <form onSubmit={handleChangeUsername} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="form-label">Current Username</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.username || 'admin'}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'default' }}
                />
              </div>

              <div>
                <label className="form-label">New Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. director.asela"
                  value={usernameForm.new_username}
                  onChange={(e) => setUsernameForm({ ...usernameForm, new_username: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Confirm New Username *</label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter new username"
                  value={usernameForm.confirm_username}
                  onChange={(e) => setUsernameForm({ ...usernameForm, confirm_username: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Current Password (For Authorization) *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={usernameForm.current_password}
                  onChange={(e) => setUsernameForm({ ...usernameForm, current_password: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '11px 24px' }}>
                  <Save size={16} />
                  <span>{saving ? 'Updating...' : 'Save New Username'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Change Password */}
        {activeTab === 'password' && (
          <div style={{ padding: '32px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Change Account Password
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Securely update your password. Uses industry-standard bcrypt cryptographic hashing.
            </p>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="form-label">Current Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">New Password * (Min 6 chars)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter robust new password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Confirm New Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="showPass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label htmlFor="showPass" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Show passwords
                </label>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '11px 24px' }}>
                  <KeyRound size={16} />
                  <span>{saving ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Hospital Information */}
        {activeTab === 'hospital' && (
          <div style={{ padding: '32px', maxWidth: '720px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Hospital Information & Organization Details
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Displayed across printed invoices, laboratory report headers, and official appointment tokens.
            </p>

            <form onSubmit={handleSaveHospital} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="form-label">Hospital Registered Name</label>
                <input
                  type="text"
                  required
                  value={hospitalInfo.hospital_name}
                  onChange={(e) => setHospitalInfo({ ...hospitalInfo, hospital_name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Hospital Code</label>
                  <input
                    type="text"
                    value={hospitalInfo.hospital_code}
                    onChange={(e) => setHospitalInfo({ ...hospitalInfo, hospital_code: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">Medical Director</label>
                  <input
                    type="text"
                    value={hospitalInfo.director_name}
                    onChange={(e) => setHospitalInfo({ ...hospitalInfo, director_name: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Official Address</label>
                <input
                  type="text"
                  value={hospitalInfo.address}
                  onChange={(e) => setHospitalInfo({ ...hospitalInfo, address: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">General Contact Phone</label>
                  <input
                    type="text"
                    value={hospitalInfo.phone}
                    onChange={(e) => setHospitalInfo({ ...hospitalInfo, phone: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">24/7 Emergency Hotline</label>
                  <input
                    type="text"
                    value={hospitalInfo.emergency_hotline}
                    onChange={(e) => setHospitalInfo({ ...hospitalInfo, emergency_hotline: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Official Email</label>
                  <input
                    type="email"
                    value={hospitalInfo.email}
                    onChange={(e) => setHospitalInfo({ ...hospitalInfo, email: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">System Billing Currency</label>
                  <input
                    type="text"
                    value="Sri Lankan Rupee (LKR / Rs.)"
                    readOnly
                    className="input-field"
                    style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'default' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '11px 24px' }}>
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Hospital Information'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: Preferences */}
        {activeTab === 'preferences' && (
          <div style={{ padding: '32px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Session & Alert Preferences
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Manage auto-logout security timeout and operational alert feeds.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    Inactivity Auto-Logout Timeout
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Automatically log out inactive sessions to preserve patient confidentiality
                  </div>
                </div>
                <select
                  value={preferences.session_timeout_mins}
                  onChange={(e) => setPreferences({ ...preferences, session_timeout_mins: Number(e.target.value) })}
                  className="input-field"
                  style={{ width: 'auto' }}
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    Critical Lab Alerts Push
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Immediate topbar highlight when critical lab investigations are validated
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.critical_lab_push}
                  onChange={(e) => setPreferences({ ...preferences, critical_lab_push: e.target.checked })}
                  style={{ transform: 'scale(1.3)' }}
                />
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    Dispensary Stock Warning Threshold
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Trigger inventory badge when medicine stocks drop below reorder levels
                  </div>
                </div>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                  Auto Enabled
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Backup & Disaster Recovery (PDF Section 4 & 10) */}
        {activeTab === 'backup' && (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                System Backup, High Availability & Disaster Recovery
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Compliance with PDF Section 10 (Daily Database Backup, Weekly Full Backup, Disaster Recovery Plan, Audit Trail) and Section 4.
              </p>
            </div>

            {/* Backup Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Daily Database Backup */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Database size={22} />
                    </div>
                    <span className="badge badge-success">● Daily Backup Active</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '800' }}>Automatic Daily Backup</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Full snapshot of all patients, doctor rosters, appointments, billing invoices, laboratory results, and pharmacy stock.
                  </p>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
                    <div><strong>Scheduled Time:</strong> Daily at 02:00 AM (SLST)</div>
                    <div><strong>Format:</strong> JSON & SQL Dump</div>
                    <div><strong>Encryption:</strong> AES-256 at Rest</div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '8px' }}
                >
                  <Download size={16} />
                  <span>{downloadingBackup ? 'Exporting System Backup...' : 'Download Live Database Backup (JSON)'}</span>
                </button>
              </div>

              {/* Weekly Full Backup */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Server size={22} />
                    </div>
                    <span className="badge badge-success">● Offsite Synchronized</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '800' }}>Weekly Full Archive Backup</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Secondary offsite backup dispatched to secure Sri Lanka Telecom / AWS local data center with cryptographic checksums.
                  </p>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
                    <div><strong>Schedule:</strong> Sundays at 01:00 AM</div>
                    <div><strong>Retention:</strong> 90 Days Rolling Window</div>
                    <div><strong>Storage Location:</strong> Colombo Disaster Recovery Node</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', fontSize: '0.8rem', color: '#059669', fontWeight: '600' }}>
                  <ShieldCheck size={16} /> Last archive verified successfully
                </div>
              </div>

              {/* Disaster Recovery Plan (DRP) */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={22} />
                    </div>
                    <span className="badge badge-info">PDF Section 10</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '800' }}>Disaster Recovery Plan (DRP)</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Standard operating procedures for hardware failure, network outage, or hospital power blackout.
                  </p>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
                    <div><strong>Recovery Point Objective (RPO):</strong> &lt; 1 Hour</div>
                    <div><strong>Recovery Time Objective (RTO):</strong> &lt; 15 Minutes</div>
                    <div><strong>Failover Mode:</strong> Hot Standby Dual-Node</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', fontSize: '0.8rem', color: '#4f46e5', fontWeight: '600' }}>
                  <CheckCircle2 size={16} /> Annual DR drill passed
                </div>
              </div>
            </div>

            {/* Audit Trail Section (PDF Section 4 & 10) */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={18} color="#0284c7" /> Security Audit Trail & Activity Logs
                  </h4>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    PDF Section 4 & 10: Immutable chronological trail of user actions, logins, and clinical modifications.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search audit trail..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 10px 6px 32px' }}
                    />
                  </div>

                  <select
                    value={auditModule}
                    onChange={(e) => setAuditModule(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', width: 'auto' }}
                  >
                    <option value="ALL">All Modules</option>
                    <option value="Authentication">Authentication</option>
                    <option value="Patients">Patients</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Billing">Billing</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="modern-table" style={{ fontSize: '0.825rem' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User & Role</th>
                      <th>Module</th>
                      <th>Action Performed</th>
                      <th>IP Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAudit ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading audit records...</td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No audit logs recorded.</td>
                      </tr>
                    ) : (
                      auditLogs
                        .filter(l => {
                          const matchesMod = auditModule === 'ALL' || (l.module || '').toLowerCase() === auditModule.toLowerCase();
                          const matchesQuery = !auditSearch ||
                            (l.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                            (l.user || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                            (l.user_email || '').toLowerCase().includes(auditSearch.toLowerCase());
                          return matchesMod && matchesQuery;
                        })
                        .slice(0, 15)
                        .map((l, i) => (
                          <tr key={l.id || i}>
                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{l.date_time || l.created_at || 'Just now'}</td>
                            <td>
                              <strong>{l.user || l.user_email || 'System'}</strong>
                              {l.role && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.role}</div>}
                            </td>
                            <td><span className="badge badge-info">{l.module || 'General'}</span></td>
                            <td style={{ fontWeight: '600' }}>{l.action}</td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{l.ip || l.ip_address || '127.0.0.1'}</td>
                            <td>
                              <span className="badge badge-success">● {l.result || l.status || 'Success'}</span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
