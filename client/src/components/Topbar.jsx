import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function Topbar({
  theme,
  setTheme,
  currentRole = 'Administrator',
  currentUser,
  onLogout,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  onNavigate,
  onGlobalSearch
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Mock Notifications matching system activity
  const notifications = [
    {
      id: 1,
      title: 'Critical Lab Alert',
      desc: 'Dengue NS1 Rapid Test positive for Patient #1004',
      time: '5 mins ago',
      type: 'critical'
    },
    {
      id: 2,
      title: 'Low Medicine Stock',
      desc: 'Amoxicillin 500mg has reached reorder threshold (8 packs)',
      time: '25 mins ago',
      type: 'warning'
    },
    {
      id: 3,
      title: 'New Online Channelling',
      desc: 'Appointment booked with Dr. Rohan Samarasinghe for 4:30 PM',
      time: '40 mins ago',
      type: 'info'
    }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch && searchQuery.trim()) {
      onGlobalSearch(searchQuery.trim());
    }
  };

  return (
    <header
      className="hms-topbar"
      style={{
        height: '70px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 35,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Left: Hamburger Menu + Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, maxWidth: '600px' }}>
        {/* Sidebar Toggle Hamburger */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="btn-icon"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.15s ease'
          }}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu size={22} />
        </button>

        {/* Global Search Bar matching screenshot */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }}
          />
          <input
            type="text"
            placeholder="Search patients, doctors, appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 16px 9px 40px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              fontSize: '0.85rem',
              color: '#1e293b',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = '#0284c7';
              e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </form>
      </div>

      {/* Right Controls: Theme Toggle, Notifications, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} />}
        </button>

        {/* Notification Bell with Badge count 3 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="System Notifications"
          >
            <Bell size={21} />
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.675rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}
            >
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '320px',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                zIndex: 50
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}
              >
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0f172a' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>3 New</span>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          color: n.type === 'critical' ? '#ef4444' : '#0f172a'
                        }}
                      >
                        {n.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35 }}>
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill matching screenshot */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              if (currentRole === 'Administrator') {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px 4px 4px',
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              cursor: currentRole === 'Administrator' ? 'pointer' : 'default',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (currentRole === 'Administrator') e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              if (currentRole === 'Administrator') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Avatar matching screenshot */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0057b7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.9rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
              }}
            >
              {(currentUser?.full_name || 'A')[0].toUpperCase()}
            </div>

            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  lineHeight: 1.2
                }}
              >
                {currentUser?.full_name || 'Admin User'}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  fontWeight: '500'
                }}
              >
                {currentRole}
              </div>
            </div>
          </button>

          {/* User Profile Dropdown Menu - Only rendered for Administrator role */}
          {currentRole === 'Administrator' && showUserDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                width: '210px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                zIndex: 50
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0f172a' }}>
                  {currentUser?.full_name || 'Admin User'}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#0284c7', fontWeight: '600' }}>
                  @{currentUser?.username || 'admin'}
                </div>
              </div>

              <div style={{ padding: '6px' }}>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    if (onNavigate) onNavigate('settings');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    color: '#334155',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Settings size={15} />
                  <span>Admin Profile & Settings</span>
                </button>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    if (onLogout) onLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
