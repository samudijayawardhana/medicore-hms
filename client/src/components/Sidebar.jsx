import React from 'react';
import {
  Home,
  Users,
  UserPlus,
  Stethoscope,
  CalendarDays,
  FileText,
  FlaskConical,
  Pill,
  CreditCard,
  UserCheck,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  Activity,
  Heart,
  Thermometer,
  Clock,
  Layers,
  ArrowUpDown,
  Building2,
  CalendarX,
  FilePlus,
  History,
  FileCheck,
  Bell,
  KeyRound,
  UserCircle
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  currentRole = 'Administrator',
  currentUser,
  onLogout,
  isCollapsed = false
}) {
  // Define exact sidebar menu items specified for each role in the prompt
  const roleMenus = {
    Administrator: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'patients', label: 'Patients', icon: Users },
      { id: 'doctors', label: 'Doctors', icon: Stethoscope },
      { id: 'appointments', label: 'Appointments', icon: CalendarDays },
      { id: 'emr', label: 'EMR', icon: FileText },
      { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
      { id: 'laboratory', label: 'Laboratory', icon: FlaskConical },
      { id: 'pharmacy', label: 'Pharmacy', icon: Layers },
      { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
      { id: 'inpatient', label: 'Inpatient & Wards', icon: Building2 },
      { id: 'nurse-care', label: 'Nurse Care', icon: Heart },
      { id: 'staff', label: 'Staff Management', icon: UserCheck },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      { id: 'users', label: 'User Management', icon: ShieldCheck },
      { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
      { id: 'settings', label: 'System Settings', icon: Settings },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ],

    Doctor: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'doctor-patients', label: 'Patients (View + History)', icon: Users },
      { id: 'doctors', label: 'Doctors', icon: Stethoscope },
      { id: 'doctor-appointments', label: 'Appointments', icon: CalendarDays },
      { id: 'emr', label: 'EMR (Consultation)', icon: FileText },
      { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
      { id: 'laboratory', label: 'Laboratory (Orders)', icon: FlaskConical },
      { id: 'pharmacy', label: 'Pharmacy Stock (View)', icon: Layers },
      { id: 'inpatient', label: 'Inpatient / Wards', icon: Building2 },
      { id: 'nurse-care', label: 'Nurse Care (View)', icon: Heart },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'change-password', label: 'Change Password', icon: KeyRound },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ],

    Nurse: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'nurse-patients', label: 'Patients (Contact + Medical)', icon: Users },
      { id: 'appointments', label: 'Appointments', icon: CalendarDays },
      { id: 'emr', label: 'EMR (View Only)', icon: FileText },
      { id: 'prescriptions', label: 'Prescriptions (View)', icon: Pill },
      { id: 'laboratory', label: 'Laboratory (Samples)', icon: FlaskConical },
      { id: 'pharmacy', label: 'Pharmacy Stock (View)', icon: Layers },
      { id: 'inpatient', label: 'Inpatient / Wards', icon: Building2 },
      { id: 'nurse-care', label: 'Nurse Care (Vitals & Meds)', icon: Heart },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'change-password', label: 'Change Password', icon: KeyRound },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ],

    Receptionist: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'patient-registration', label: 'Patient Registration', icon: UserPlus },
      { id: 'patients', label: 'Patients (Register & Identity)', icon: Users },
      { id: 'doctors', label: 'Doctors (Schedule)', icon: Stethoscope },
      { id: 'appointments', label: 'Appointments (Book & Check-in)', icon: CalendarDays },
      { id: 'inpatient', label: 'Inpatient (View & Admit)', icon: Building2 },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'change-password', label: 'Change Password', icon: KeyRound },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ],

    'Laboratory Staff': [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'laboratory', label: 'Laboratory (Samples & Results)', icon: FlaskConical },
      { id: 'patients', label: 'Patients (Basic + Blood/Allergy)', icon: Users },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'change-password', label: 'Change Password', icon: KeyRound },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ],

    Pharmacist: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'pharmacy', label: 'Pharmacy Inventory', icon: Layers },
      { id: 'pharma-prescriptions', label: 'Prescriptions (Dispense)', icon: Pill },
      { id: 'patients', label: 'Patients (Basic + Allergies)', icon: Users },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'change-password', label: 'Change Password', icon: KeyRound },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ],

    Accountant: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
      { id: 'patients', label: 'Patients (Basic Only)', icon: Users },
      { id: 'reports', label: 'Revenue Reports', icon: BarChart3 },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'change-password', label: 'Change Password', icon: KeyRound },
      { id: 'logout', label: 'Logout', icon: LogOut, isAction: true }
    ]
  };

  const menuItems = roleMenus[currentRole] || roleMenus['Administrator'];

  const handleItemClick = (item) => {
    if (item.isAction && item.id === 'logout') {
      if (onLogout) onLogout();
      return;
    }
    setCurrentView(item.id);
  };

  return (
    <aside
      className={`hms-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: isCollapsed ? '76px' : '260px',
        minWidth: isCollapsed ? '76px' : '260px',
        backgroundColor: '#071529',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '74px',
          padding: isCollapsed ? '0 16px' : '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0057b7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
          }}
        >
          {/* Medical Cross Icon */}
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <rect x="9.5" y="3" width="5" height="18" rx="2" fill="#ffffff" />
            <rect x="3" y="9.5" width="18" height="5" rx="2" fill="#ffffff" />
            <path
              d="M 4 12 H 8 L 9.5 8 L 12 16 L 14 10 L 15.5 13 H 20"
              stroke="#0284c7"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1.1
              }}
            >
              HMS
            </span>
            <span
              style={{
                fontSize: '0.675rem',
                color: 'rgba(255, 255, 255, 0.65)',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
                marginTop: '2px'
              }}
            >
              Hospital Management System
            </span>
          </div>
        )}
      </div>

      {/* Role Pill Banner */}
      {!isCollapsed && (
        <div style={{ padding: '10px 18px', background: 'rgba(2, 132, 199, 0.12)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {currentRole} Portal
          </div>
        </div>
      )}

      {/* Navigation Menu List */}
      <nav
        style={{
          flex: 1,
          padding: isCollapsed ? '14px 10px' : '14px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              title={isCollapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isCollapsed ? '10px 0' : '10px 14px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.84rem',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                }
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                  flexShrink: 0
                }}
              />
              {!isCollapsed && (
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile Pill */}
      {!isCollapsed && currentUser && (
        <div
          onClick={() => setCurrentView('profile')}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            cursor: 'pointer'
          }}
          title="Click to view profile"
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.85rem',
              flexShrink: 0
            }}
          >
            {(currentUser.full_name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.825rem',
                fontWeight: '700',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentUser.full_name || 'Logged User'}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#38bdf8',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}
            >
              {currentRole}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
