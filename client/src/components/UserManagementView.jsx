import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  UserX,
  UserCheck,
  RefreshCw,
  Eye,
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function UserManagementView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newUser, setNewUser] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'Nurse',
    password: '',
    phone: '',
    department: 'General Medicine'
  });
  const [selectedRole, setSelectedRole] = useState('Nurse');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const roles = [
    'Administrator',
    'Doctor',
    'Nurse',
    'Receptionist',
    'Laboratory Staff',
    'Pharmacist',
    'Accountant'
  ];

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error loading users: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.full_name || !newUser.email || !newUser.password) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    try {
      await api.createUser(newUser);
      setMessage({ text: `User ${newUser.username} created successfully!`, type: 'success' });
      setShowAddModal(false);
      setNewUser({
        username: '',
        full_name: '',
        email: '',
        role: 'Nurse',
        password: '',
        phone: '',
        department: 'General Medicine'
      });
      loadUsers();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await api.updateUserRole(selectedUser.id, selectedRole);
      setMessage({ text: `Role for ${selectedUser.username} updated to ${selectedRole}`, type: 'success' });
      setShowRoleModal(false);
      loadUsers();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUserStatus(user.id, newStatus);
      setMessage({
        text: `User ${user.username} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
        type: 'success'
      });
      loadUsers();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    try {
      await api.resetUserPassword(selectedUser.id, newPassword);
      setMessage({ text: `Password for ${selectedUser.username} has been reset.`, type: 'success' });
      setShowResetModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'Administrator').length;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                User Management & Access Control (RBAC)
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Secure role assignment, account lifecycle & permission controls for hospital staff
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Message Banner */}
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

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <User size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>TOTAL ACCOUNTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{users.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>ACTIVE USERS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>{activeCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>ADMINISTRATORS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{adminCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(147, 51, 234, 0.12)',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <KeyRound size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>AVAILABLE ROLES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{roles.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search by username, full name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={loadUsers}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px' }}
            title="Refresh Users"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>USER ID</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>USERNAME & NAME</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>EMAIL ADDRESS</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>ASSIGNED ROLE</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '14px 18px', fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.status === 'active';
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: '600' }}>
                        USR-{String(u.id).padStart(4, '0')}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#0284c7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.85rem'
                            }}
                          >
                            {(u.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {u.full_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background:
                              u.role === 'Administrator'
                                ? 'rgba(239, 68, 68, 0.12)'
                                : u.role === 'Doctor'
                                ? 'rgba(2, 132, 199, 0.12)'
                                : 'rgba(16, 185, 129, 0.12)',
                            color:
                              u.role === 'Administrator'
                                ? '#ef4444'
                                : u.role === 'Doctor'
                                ? '#0284c7'
                                : '#10b981'
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: isActive ? '#10b981' : '#64748b'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isActive ? '#10b981' : '#64748b'
                            }}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedRole(u.role);
                              setShowRoleModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                            title="Assign Role"
                          >
                            <Edit2 size={13} />
                            <span>Role</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPassword('');
                              setConfirmPassword('');
                              setShowResetModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                            title="Reset Password"
                          >
                            <KeyRound size={13} />
                            <span>Reset</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="btn"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: isActive ? '#ef4444' : '#10b981',
                              border: 'none'
                            }}
                            title={isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create User */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '540px', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={22} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Create New Hospital User</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Kaveen Jayasinghe"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kaveen.j"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="kaveen@medicore.lk"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Role Assignment *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    placeholder="+94 77 123 4567"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Role */}
      {showRoleModal && selectedUser && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '420px', width: '90%' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.2rem', fontWeight: '800' }}>
              Assign Role for {selectedUser.full_name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select an authorized system role to adjust operational permissions.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowRoleModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleUpdateRole} className="btn btn-primary">
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password */}
      {showResetModal && selectedUser && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '420px', width: '90%' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.2rem', fontWeight: '800' }}>
              Reset Password for {selectedUser.username}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Set a temporary password. The user should update it upon next login.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleResetPassword} className="btn btn-primary">
                Save New Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
