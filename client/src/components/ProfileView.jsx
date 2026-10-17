import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut
} from 'lucide-react';
import { api } from '../services/api';

export default function ProfileView({ currentUser, onUserUpdated, onLogout, activeTab = 'profile' }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    full_name: currentUser?.full_name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '+94 77 123 4567'
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password State
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const showNotification = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) {
      showNotification('Full name and email are required.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.updateProfile(currentUser?.id, profileForm);
      if (res && res.success) {
        showNotification('Profile details updated successfully!');
        if (onUserUpdated && res.user) {
          onUserUpdated(res.user);
        }
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword) {
      showNotification('Please enter your current password.', 'error');
      return;
    }
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showNotification('New password and confirmation do not match.', 'error');
      return;
    }
    setSavingPwd(true);
    try {
      await api.changePassword(currentUser?.id, pwdForm.currentPassword, pwdForm.newPassword);
      showNotification('Password updated successfully! Please keep your new credentials secure.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showNotification(err.message || 'Failed to change password. Please verify current password.', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          User Account Security & Preferences
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: '4px 0 0 0' }}>
          {currentUser?.role} Profile & Password
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: 'none',
            background: 'transparent',
            fontWeight: currentTab === 'profile' ? '700' : '500',
            fontSize: '0.9rem',
            color: currentTab === 'profile' ? '#0284c7' : '#64748b',
            borderBottom: currentTab === 'profile' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          <User size={16} />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setCurrentTab('change-password')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: 'none',
            background: 'transparent',
            fontWeight: currentTab === 'change-password' ? '700' : '500',
            fontSize: '0.9rem',
            color: currentTab === 'change-password' ? '#0284c7' : '#64748b',
            borderBottom: currentTab === 'change-password' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Lock size={16} />
          <span>Change Password</span>
        </button>
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

      {/* Tab: Profile */}
      {currentTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px' }}>
          {/* Left: Summary Card */}
          <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '2rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
            }}>
              {(currentUser?.full_name || 'U')[0].toUpperCase()}
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
              {currentUser?.full_name}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px' }}>
              {currentUser?.role}
            </div>

            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <div><strong>User ID:</strong> #{currentUser?.id}</div>
              <div><strong>Username:</strong> {currentUser?.username}</div>
              <div><strong>Department:</strong> {currentUser?.department || 'Hospital Operations'}</div>
              <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>Active Account</span></div>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ef4444' }}
            >
              <LogOut size={16} />
              <span>Log Out of System</span>
            </button>
          </div>

          {/* Right: Edit Form */}
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '1.15rem', fontWeight: '800' }}>Edit Personal Details</h3>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Email Address *</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Change Password */}
      {currentTab === 'change-password' && (
        <div className="card" style={{ padding: '28px', maxWidth: '580px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <KeyRound size={22} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Update Account Password</h3>
          </div>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
            To protect patient confidentiality and hospital records, choose a strong password with letters, numbers, and symbols.
          </p>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  className="input-field"
                  required
                  style={{ paddingRight: '42px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>New Password (min 6 chars) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  className="input-field"
                  required
                  style={{ paddingRight: '42px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                  style={{ paddingRight: '42px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={savingPwd} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
              {savingPwd ? 'Verifying & Updating...' : 'Update Password Securely'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
