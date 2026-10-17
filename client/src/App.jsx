import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import PatientsView from './components/PatientsView';
import DoctorsView from './components/DoctorsView';
import AppointmentsView from './components/AppointmentsView';
import EMRView from './components/EMRView';
import LaboratoryView from './components/LaboratoryView';
import PharmacyView from './components/PharmacyView';
import InpatientView from './components/InpatientView';
import BillingView from './components/BillingView';
import StaffView from './components/StaffView';
import UserManagementView from './components/UserManagementView';
import ReportsView from './components/ReportsView';
import AuditLogsView from './components/AuditLogsView';
import SettingsView from './components/SettingsView';
import WelcomeView from './components/WelcomeView';
import LoginView from './components/LoginView';
import NurseCareView from './components/NurseCareView';
import PrescriptionsView from './components/PrescriptionsView';
import PharmacyOperationsView from './components/PharmacyOperationsView';
import AccountantFinanceView from './components/AccountantFinanceView';
import ProfileView from './components/ProfileView';
import NotificationsView from './components/NotificationsView';
import { api } from './services/api';
import { LogOut, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

const roleAllowedViews = {
  Administrator: ['*'],
  Doctor: [
    'dashboard', 'doctor-appointments', 'appointments', 'doctor-patients', 'patients',
    'doctors', 'emr', 'prescriptions', 'laboratory', 'doctor-lab-reports', 'pharmacy',
    'inpatient', 'nurse-care', 'patient-care', 'vital-signs', 'nursing-notes',
    'notifications', 'profile', 'change-password'
  ],
  Nurse: [
    'dashboard', 'nurse-patients', 'patients', 'appointments', 'nurse-schedule',
    'emr', 'laboratory', 'lab-requests', 'lab-pending', 'pharmacy',
    'prescriptions', 'inpatient', 'nurse-care', 'patient-care', 'vital-signs',
    'nursing-notes', 'medication-admin', 'notifications', 'profile', 'change-password'
  ],
  Receptionist: [
    'dashboard', 'patients', 'patient-registration', 'doctors', 'appointments',
    'patient-checkin', 'reception-schedule', 'inpatient', 'notifications',
    'profile', 'change-password'
  ],
  'Laboratory Staff': [
    'dashboard', 'laboratory', 'lab-requests', 'lab-pending', 'lab-test-management',
    'lab-enter-results', 'lab-reports', 'lab-patient-info', 'patients',
    'notifications', 'profile', 'change-password'
  ],
  Pharmacist: [
    'dashboard', 'pharmacy', 'pharma-categories', 'pharma-stock', 'pharma-dispense',
    'pharma-suppliers', 'pharma-expiry', 'pharma-reports', 'prescriptions',
    'pharma-prescriptions', 'patients', 'notifications', 'profile', 'change-password'
  ],
  Accountant: [
    'dashboard', 'billing', 'accountant-create-bill', 'accountant-payments',
    'accountant-pending', 'accountant-history', 'accountant-invoices', 'accountant-reports',
    'patients', 'reports', 'notifications', 'profile', 'change-password'
  ]
};

function isViewAllowedForRole(role, view) {
  if (!role) return false;
  const allowed = roleAllowedViews[role];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.includes(view);
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MediCore React Error Boundary]:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.viewKey !== this.props.viewKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: '#fee2e2', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Unable to load module view
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'A temporary display error occurred while rendering this section.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn btn-secondary"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Session & User State
  const [currentUser, setCurrentUser] = useState(() => api.getStoredUser());
  const [currentRole, setCurrentRole] = useState(() => api.getStoredUser()?.role || 'Administrator');
  const [currentView, setCurrentView] = useState(() => {
    return api.getStoredToken() && api.getStoredUser() ? 'dashboard' : 'welcome';
  });
  const [targetViewAfterLogin, setTargetViewAfterLogin] = useState(null);

  const [theme, setTheme] = useState('light');
  const [systemStatus, setSystemStatus] = useState(null);
  const [reportsSummary, setReportsSummary] = useState(null);

  // Layout UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [globalSearchKeyword, setGlobalSearchKeyword] = useState('');

  // Cross-view navigation context
  const [selectedPatientForApt, setSelectedPatientForApt] = useState(null);
  const [selectedDoctorForApt, setSelectedDoctorForApt] = useState(null);
  const [activeAppointmentForEMR, setActiveAppointmentForEMR] = useState(null);

  // Apply Theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync / Verify Session with backend on mount
  useEffect(() => {
    const verifySession = async () => {
      const user = await api.getMe();
      if (user) {
        setCurrentUser(user);
        setCurrentRole(user.role);
      }
    };
    if (api.getStoredToken()) {
      verifySession();
    }
  }, []);

  useEffect(() => {
    const onExpired = () => {
      api.clearSession();
      setCurrentUser(null);
      setCurrentView('welcome');
      alert('Your session has expired. Please log in again.');
    };
    window.addEventListener('hms-session-expired', onExpired);
    return () => window.removeEventListener('hms-session-expired', onExpired);
  }, []);

  // Automatic Inactivity Timeout (30 minutes total, warning at 28 mins)
  useEffect(() => {
    if (!currentUser) return;
    let warningTimer;
    let logoutTimer;
    const WARNING_MS = 28 * 60 * 1000;
    const LOGOUT_MS = 30 * 60 * 1000;

    const resetInactivity = () => {
      setShowInactivityWarning(false);
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      warningTimer = setTimeout(() => {
        setShowInactivityWarning(true);
      }, WARNING_MS);

      logoutTimer = setTimeout(() => {
        handleLogout();
      }, LOGOUT_MS);
    };

    const trackedEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    trackedEvents.forEach(evt => window.addEventListener(evt, resetInactivity));
    resetInactivity();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      trackedEvents.forEach(evt => window.removeEventListener(evt, resetInactivity));
    };
  }, [currentUser]);

  // Load summary and status (Only fetch admin summary if role is Administrator!)
  const refreshData = async () => {
    try {
      const status = await api.getSystemStatus().catch(() => null);
      if (status) {
        setSystemStatus(status);
      }
      if (currentUser && currentUser.role === 'Administrator') {
        const summary = await api.getReportsSummary().catch(() => null);
        if (summary) setReportsSummary(summary);
      }
    } catch (err) {
      console.warn('API sync attempt:', err.message);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Login handler with role-based routing
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentRole(user.role);

    if (targetViewAfterLogin && isViewAllowedForRole(user.role, targetViewAfterLogin)) {
      setCurrentView(targetViewAfterLogin);
      setTargetViewAfterLogin(null);
      return;
    }

    setCurrentView('dashboard');
  };

  // Logout handler (sends server audit log)
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      api.clearSession();
    }
    setCurrentUser(null);
    setShowLogoutModal(false);
    setShowInactivityWarning(false);
    setCurrentView('welcome');
  };

  // Quick Action triggers
  const handleOpenQuickAction = (type) => {
    if (type === 'patient') {
      setCurrentView('patients');
    } else if (type === 'appointment') {
      setCurrentView('appointments');
    } else if (type === 'doctor') {
      setCurrentView('doctors');
    } else if (type === 'staff') {
      setCurrentView('staff');
    } else if (type === 'reports') {
      setCurrentView('reports');
    }
  };

  // Inter-view navigators
  const handleSelectPatientForAppointment = (patient) => {
    setSelectedPatientForApt(patient);
    setSelectedDoctorForApt(null);
    setCurrentView('appointments');
  };

  const handleBookDoctorAppointment = (doctor) => {
    setSelectedDoctorForApt(doctor);
    setSelectedPatientForApt(null);
    setCurrentView('appointments');
  };

  const handleConsultNow = (appointment) => {
    setActiveAppointmentForEMR(appointment);
    setCurrentView('emr');
  };

  // 1. Render Standalone Welcome Page
  if (currentView === 'welcome') {
    return (
      <WelcomeView
        onNavigateToLogin={(targetModule) => {
          setTargetViewAfterLogin(targetModule || null);
          setCurrentView('login');
        }}
      />
    );
  }

  // 2. Render Modern Hospital Login Page
  if (currentView === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToWelcome={() => setCurrentView('welcome')}
      />
    );
  }

  // Fallback protection: if trying to access dashboard views without session
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToWelcome={() => setCurrentView('welcome')}
      />
    );
  }

  // 3. Render Role-Based Hospital Management System (Protected)
  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Role-Based Sidebar Navigation matching mockup */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentRole={currentRole}
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Topbar
          theme={theme}
          setTheme={setTheme}
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={() => setShowLogoutModal(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          onNavigate={(view) => setCurrentView(view)}
          onGlobalSearch={(q) => {
            setGlobalSearchKeyword(q);
            setCurrentView('patients');
          }}
        />

        <main style={{ flex: 1, minHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>
          <ErrorBoundary viewKey={currentView} onReset={() => setCurrentView('dashboard')}>
          {!isViewAllowedForRole(currentRole, currentView) && (
            <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.2)'
                }}
              >
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Access Denied (403 Forbidden)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Under MediCore Hospital RBAC security rules, the role <strong>{currentRole}</strong> is restricted from accessing the <strong>{currentView}</strong> module.
              </p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Return to My Dashboard
              </button>
            </div>
          )}

          {isViewAllowedForRole(currentRole, currentView) && currentView === 'dashboard' && (
            <DashboardView
              summary={reportsSummary}
              onNavigate={(v) => setCurrentView(v)}
              onOpenQuickAction={handleOpenQuickAction}
              currentRole={currentRole}
              currentUser={currentUser}
            />
          )}

          {isViewAllowedForRole(currentRole, currentView) && (currentView === 'patients' || currentView === 'doctor-patients') && (
            <PatientsView
              onSelectPatientForAppointment={handleSelectPatientForAppointment}
              initialSearch={globalSearchKeyword}
              openRegistrationModal={false}
            />
          )}

          {currentView === 'patient-registration' && (
            <PatientsView
              onSelectPatientForAppointment={handleSelectPatientForAppointment}
              initialSearch={globalSearchKeyword}
              openRegistrationModal={true}
            />
          )}

          {currentView === 'doctors' && (
            <DoctorsView
              onBookDoctorAppointment={handleBookDoctorAppointment}
            />
          )}

          {(currentView === 'appointments' ||
            currentView === 'doctor-appointments' ||
            currentView === 'patient-checkin' ||
            currentView === 'reception-schedule') && (
            <AppointmentsView
              preselectedPatient={selectedPatientForApt}
              preselectedDoctor={selectedDoctorForApt}
              onConsultNow={handleConsultNow}
              activeTab={currentView}
              currentRole={currentRole}
              currentUser={currentUser}
            />
          )}

          {currentView === 'emr' && (
            <EMRView
              activeAppointment={activeAppointmentForEMR}
            />
          )}

          {(currentView === 'prescriptions' || currentView === 'pharma-prescriptions') && (
            <PrescriptionsView
              currentUser={currentUser}
              currentRole={currentRole}
            />
          )}

          {(currentView === 'laboratory' ||
            currentView === 'doctor-lab-reports' ||
            currentView === 'lab-requests' ||
            currentView === 'lab-pending' ||
            currentView === 'lab-test-management' ||
            currentView === 'lab-enter-results' ||
            currentView === 'lab-reports' ||
            currentView === 'lab-patient-info') && (
            <LaboratoryView
              activeTab={currentView}
            />
          )}

          {currentView === 'pharmacy' && (
            <PharmacyView />
          )}

          {(currentView === 'pharma-categories' ||
            currentView === 'pharma-stock' ||
            currentView === 'pharma-dispense' ||
            currentView === 'pharma-suppliers' ||
            currentView === 'pharma-expiry' ||
            currentView === 'pharma-reports') && (
            <PharmacyOperationsView
              activeTab={currentView}
              currentUser={currentUser}
            />
          )}

          {currentView === 'inpatient' && (
            <InpatientView />
          )}

          {(currentView === 'nurse-care' ||
            currentView === 'nurse-patients' ||
            currentView === 'patient-care' ||
            currentView === 'vital-signs' ||
            currentView === 'nursing-notes' ||
            currentView === 'medication-admin' ||
            currentView === 'nurse-schedule') && (
            <NurseCareView
              activeTab={currentView === 'nurse-care' ? 'nurse-patients' : currentView}
              currentUser={currentUser}
            />
          )}

          {(currentView === 'billing' || currentView === 'reception-billing') && (
            <BillingView />
          )}

          {(currentView === 'accountant-create-bill' ||
            currentView === 'accountant-payments' ||
            currentView === 'accountant-pending' ||
            currentView === 'accountant-history' ||
            currentView === 'accountant-invoices' ||
            currentView === 'accountant-reports') && (
            <AccountantFinanceView
              activeTab={currentView}
              currentUser={currentUser}
            />
          )}

          {currentView === 'staff' && (
            <StaffView />
          )}

          {currentView === 'users' && (
            <UserManagementView currentUser={currentUser} />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'audit' && (
            <AuditLogsView />
          )}

          {currentView === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUserUpdated={(updated) => {
                setCurrentUser(updated);
                api.setSession(api.getStoredToken(), updated);
              }}
            />
          )}

          {(currentView === 'profile' || currentView === 'change-password') && (
            <ProfileView
              currentUser={currentUser}
              activeTab={currentView}
              onUserUpdated={(updated) => {
                setCurrentUser(updated);
                api.setSession(api.getStoredToken(), updated);
              }}
              onLogout={() => setShowLogoutModal(true)}
            />
          )}

          {currentView === 'notifications' && (
            <NotificationsView
              currentUser={currentUser}
              currentRole={currentRole}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '28px 24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <LogOut size={26} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Confirm Logout
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Are you sure you want to end your current session? You will need to log in again to access the hospital management system.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', minWidth: '100px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="btn"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  minWidth: '110px',
                  cursor: 'pointer'
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity Warning Modal (Step B2 #6) */}
      {showInactivityWarning && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '440px', width: '90%', textAlign: 'center', padding: '28px 24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Inactivity Warning
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your session will automatically expire in 2 minutes due to inactivity. Click <strong>Stay Signed In</strong> to continue working.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', minWidth: '100px' }}
              >
                Log Out Now
              </button>
              <button
                onClick={() => setShowInactivityWarning(false)}
                className="btn btn-primary"
                style={{
                  padding: '10px 22px',
                  fontWeight: '700',
                  minWidth: '130px',
                  cursor: 'pointer'
                }}
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
