import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function NotificationsView({ currentUser, currentRole = 'Doctor' }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications(currentRole);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentRole]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} color="#0284c7" />;
      case 'lab':
        return <FlaskConical size={18} color="#8b5cf6" />;
      case 'pharmacy':
      case 'prescription':
        return <Pill size={18} color="#10b981" />;
      case 'billing':
        return <CreditCard size={18} color="#f59e0b" />;
      default:
        return <Info size={18} color="#64748b" />;
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    return true;
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Alerts & Clinical Notifications
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: '4px 0 0 0' }}>
            Notifications Center
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadNotifications} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['All', 'Unread'].map(st => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: filter === st ? '#0284c7' : '#ffffff',
              color: filter === st ? '#ffffff' : '#475569',
              fontWeight: filter === st ? '700' : '500',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {st} ({st === 'All' ? notifications.length : notifications.filter(n => !n.is_read).length})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(notif => (
          <div
            key={notif.id}
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              background: notif.is_read ? '#ffffff' : '#f0f9ff',
              borderLeft: notif.is_read ? '4px solid #cbd5e1' : '4px solid #0284c7'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #e2e8f0'
            }}>
              {getIcon(notif.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: notif.is_read ? '600' : '800', color: '#0f172a' }}>
                  {notif.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-GB') : 'Today'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                {notif.message}
              </p>
            </div>

            {!notif.is_read && (
              <button
                onClick={() => handleMarkAsRead(notif.id)}
                title="Mark as read"
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', flexShrink: 0 }}
              >
                Mark Read
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No notifications available.
          </div>
        )}
      </div>
    </div>
  );
}
