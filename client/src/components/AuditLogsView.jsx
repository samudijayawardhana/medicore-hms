import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  RefreshCw,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');

  const modules = [
    'All',
    'Auth',
    'Patients',
    'Appointments',
    'Medical Records',
    'Laboratory',
    'Pharmacy',
    'Billing',
    'User Management',
    'Settings',
    'System'
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(selectedModule, searchTerm);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Audit logs fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Log ID', 'User', 'Action', 'Module', 'Date & Time', 'Result', 'IP Address'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.user}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.module}"`,
      `"${l.date_time}"`,
      `"${l.result}"`,
      `"${l.ip || '127.0.0.1'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medicore_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)'
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
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              System Audit Logs & Security Trail
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Immutable record of administrative operations, clinical record access & security events
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search action, details, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-muted)' }}>Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 14px' }}
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>LOG ID</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>DATE & TIME</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>USER / INITIATOR</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>MODULE</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>ACTION DETAILS</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.result?.toLowerCase() === 'success';
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '0.825rem', fontWeight: '700', color: '#0284c7' }}>
                        #{String(log.id).padStart(5, '0')}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.825rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {log.date_time}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>{log.user}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IP: {log.ip || '192.168.1.10'}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.725rem',
                            fontWeight: '700',
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284c7'
                          }}
                        >
                          {log.module}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.725rem',
                            fontWeight: '700',
                            background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isSuccess ? '#10b981' : '#ef4444'
                          }}
                        >
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{log.result}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
