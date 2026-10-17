import React, { useState } from 'react';
import {
  Activity,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess, onBackToWelcome }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Quick Demo Accounts to switch credentials effortlessly
  const demoAccounts = [
    { role: 'Administrator', user: 'admin', icon: '👑', name: 'Admin (System Ops)' },
    { role: 'Doctor', user: 'doctor', icon: '🩺', name: 'Dr. Aruni (Consultant)' },
    { role: 'Nurse', user: 'nurse', icon: '👩‍⚕️', name: 'Nurse Kasun (Ward 03)' },
    { role: 'Receptionist', user: 'receptionist', icon: '📋', name: 'Kamal (OPD Desk)' },
    { role: 'Laboratory Staff', user: 'lab', icon: '🔬', name: 'Dilani (Diagnostics)' },
    { role: 'Pharmacist', user: 'pharmacist', icon: '💊', name: 'Niroshan (Pharmacy)' },
    { role: 'Accountant', user: 'accountant', icon: '💳', name: 'Sanduni (Finance)' }
  ];

  const handleSelectDemo = (acc) => {
    setUsername(acc.user);
    setPassword('');
    setErrorMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username or email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(username.trim(), password.trim());
      if (response && response.user) {
        onLoginSuccess(response.user);
      } else {
        throw new Error('Authentication succeeded but user data was missing.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Left Section: Hospital Visual & Stethoscope Image */}
        <div className="login-left-section">
          <div className="login-left-bg-img-wrap">
            <img
              src="/login_stethoscope.jpg"
              alt="Medical Stethoscope"
              className="login-left-bg-img"
            />
            <div className="login-left-gradient-overlay" />
          </div>

          <div className="login-left-content">
            {/* Top Brand Info */}
            <div className="login-left-header">
              <button
                onClick={onBackToWelcome}
                className="login-back-btn"
                title="Return to Welcome Screen"
              >
                <ArrowLeft size={16} />
                <span>Back to Welcome</span>
              </button>

              <div className="login-brand-badge">
                <div className="login-brand-icon">
                  <Activity size={20} color="#ffffff" />
                </div>
                <div>
                  <span className="login-brand-name">Medi<span style={{ color: '#38bdf8' }}>Core</span></span>
                  <span className="login-brand-tag">Hospital System</span>
                </div>
              </div>
            </div>

            {/* Center Messaging */}
            <div className="login-left-body">
              <span className="login-badge-pill">Secure Staff Portal</span>
              <h1 className="login-welcome-title">Welcome Back!</h1>
              <p className="login-welcome-subtitle">
                Sign in to access your designated Hospital Management System workspace.
              </p>

              <div className="login-motto-box">
                <span className="login-motto-text">
                  “Better Care, Smarter Management, Healthier Tomorrow.”
                </span>
              </div>
            </div>

            {/* Bottom Security Highlights */}
            <div className="login-left-footer">
              <div className="login-security-item">
                <ShieldCheck size={16} className="text-cyan" />
                <span>256-Bit SSL Encryption</span>
              </div>
              <div className="login-security-item">
                <CheckCircle2 size={16} className="text-cyan" />
                <span>Role-Based Access Control</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Login Form */}
        <div className="login-right-section">
          <div className="login-form-inner">
            <div className="login-form-header">
              <h2 className="login-heading">Login to Your Account</h2>
              <p className="login-instruction">
                Enter your hospital credentials to securely access your portal.
              </p>
            </div>

            {/* Quick Demo Role Picker Pills */}
            <div className="login-demo-bar">
              <div className="login-demo-label">
                <KeyRound size={13} />
                <span>Select Role to Fill Username:</span>
              </div>
              <div className="login-demo-pills">
                {demoAccounts.map((acc) => {
                  const isSelected = username === acc.user;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className={`login-role-pill ${isSelected ? 'active' : ''}`}
                      title={`Fill ${acc.name} credentials`}
                    >
                      <span>{acc.icon}</span>
                      <span>{acc.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="login-error-banner">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="login-form" autoComplete="off">
              {/* Username / Email Field */}
              <div className="form-group">
                <label className="login-input-label">
                  Username or Email
                </label>
                <div className="login-input-wrapper">
                  <User size={18} className="login-input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or admin@medicore.org"
                    className="login-input-field"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="login-input-label" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="login-forgot-link"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="login-input-wrapper">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="login-input-field"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle"
                    tabIndex="-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="login-options-row">
                <label className="login-remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="login-checkbox"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn"
                id="btn-login-submit"
              >
                {loading ? (
                  <>
                    <div className="login-spinner" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Login to System</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Notice */}
            <div className="login-form-footer">
              <p>
                Authorized healthcare personnel only. All access is logged and audited according to healthcare confidentiality protocols.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0284c7', marginBottom: '12px' }}>
              <HelpCircle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Password Recovery</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              For security compliance, staff password resets are managed directly by the Hospital IT Administrator.
            </p>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Demo System Credentials:</div>
              <div style={{ color: 'var(--text-secondary)' }}>All staff demo accounts use password: <code style={{ color: '#0284c7', fontWeight: '700' }}>password123</code></div>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
