import React, { useState, useEffect } from 'react';
import {
  Users,
  Stethoscope,
  UserCheck,
  Calendar,
  FlaskConical,
  Coins,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sun,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  LogIn,
  ExternalLink,
  ChevronRight,
  BedDouble,
  Heart,
  Thermometer,
  Pill,
  CreditCard,
  Layers,
  Activity,
  Plus,
  RefreshCw,
  Building2,
  CalendarDays
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({
  summary,
  onNavigate,
  onOpenQuickAction,
  currentRole = 'Administrator',
  currentUser
}) {
  const [roleData, setRoleData] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const fetchRoleData = (isInitial = false) => {
      if (currentRole && currentRole !== 'Administrator') {
        if (isInitial) setRoleLoading(true);
        api.getRoleSummary(currentRole, currentUser?.id)
          .then(data => setRoleData(data))
          .catch(err => console.warn('Role summary error:', err.message))
          .finally(() => { if (isInitial) setRoleLoading(false); });
      }
    };

    fetchRoleData(true);
    // Step C0 #6: Auto refresh every 60 seconds
    const interval = setInterval(() => fetchRoleData(false), 60000);
    return () => clearInterval(interval);
  }, [currentRole, currentUser]);

  const metrics = summary?.metrics || {};
  const monthlyRegistrations = summary?.monthlyRegistrations || [];
  const monthlyAppointments = summary?.monthlyAppointments || [];
  const monthlyRevenue = summary?.monthlyRevenue || [];
  const recentAppointments = summary?.recentAppointments || [];
  const recentPatientRegistrations = summary?.recentPatientRegistrations || [];
  const recentActivities = summary?.recentActivities || [];
  const pendingTasks = summary?.pendingTasks || [];

  const formatLKR = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString('en-LK');
  };

  // 1. Dynamic Chart Geometry: Patient Registration Overview (Jan - Oct)
  const regCounts = monthlyRegistrations.map(d => Number(d.count) || 0);
  const maxReg = Math.max(...regCounts, 5);
  const regPoints = monthlyRegistrations.map((d, i) => {
    const x = 32 + i * (268 / Math.max(monthlyRegistrations.length - 1, 1));
    const val = Number(d.count) || 0;
    const y = 125 - (val / maxReg) * 100;
    return { x, y, month: d.month, count: val };
  });
  const regLineD = regPoints.length > 0
    ? `M ${regPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';
  const regAreaD = regPoints.length > 0
    ? `${regLineD} L ${regPoints[regPoints.length - 1].x.toFixed(1)},125 L ${regPoints[0].x.toFixed(1)},125 Z`
    : '';

  // 2. Dynamic Chart Geometry: Monthly Appointment Statistics (May - Oct)
  const maxApt = Math.max(
    ...monthlyAppointments.flatMap(d => [Number(d.booked) || 0, Number(d.completed) || 0]),
    5
  );

  // 3. Dynamic Chart Geometry: Revenue Overview (May - Oct)
  const revAmounts = monthlyRevenue.map(d => Number(d.amount) || 0);
  const maxRev = Math.max(...revAmounts, 1000);
  const revPoints = monthlyRevenue.map((d, i) => {
    const x = 35 + i * (195 / Math.max(monthlyRevenue.length - 1, 1));
    const val = Number(d.amount) || 0;
    const y = 125 - (val / maxRev) * 100;
    return { x, y, month: d.month, amount: val };
  });
  const revLineD = revPoints.length > 0
    ? `M ${revPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';
  const revAreaD = revPoints.length > 0
    ? `${revLineD} L ${revPoints[revPoints.length - 1].x.toFixed(1)},125 L ${revPoints[0].x.toFixed(1)},125 Z`
    : '';

  const formatShortNumber = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return String(Math.round(val));
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ==========================================
  // DOCTOR DASHBOARD
  // ==========================================
  if (currentRole === 'Doctor') {
    const docData = roleData || {};
    const todaySched = docData.todaySchedule || [];
    const upcomingApts = docData.upcomingAppointments || [];

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        {/* Hero Banner */}
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '160px',
          background: 'linear-gradient(135deg, #065f46 0%, #0d9488 55%, #0284c7 100%)',
          boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.25)',
          color: '#ffffff',
          padding: '28px 32px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={17} color="#fde047" />
              <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>
                {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Doctor'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>• {todayFormatted}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              Doctor Clinical Workspace
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Consultation schedule, assigned patient records, and clinical orders.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('emr')} className="btn" style={{ background: '#ffffff', color: '#0f766e', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Write Medical Record
            </button>
            <button onClick={() => onNavigate('prescriptions')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Issue Prescription
            </button>
          </div>
        </div>

        {/* 4 Doctor KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Today's Appointments</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{docData.todayAppointments ?? 4}</div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Active Token Queue</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Assigned Patients</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{docData.assignedPatients ?? 8}</div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>In Clinical Follow-up</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Pending Consultations</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{docData.pendingAppointments ?? 3}</div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>In Waiting Area</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Completed Today</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{docData.completedAppointments ?? 5}</div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Records Finalized</span>
          </div>
        </div>

        {/* Schedule & Tables Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          {/* Today's Schedule */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Today's Consultation Schedule</h3>
              <button onClick={() => onNavigate('doctor-appointments')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                View All
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Token</th>
                  <th style={{ padding: '10px 14px' }}>Patient</th>
                  <th style={{ padding: '10px 14px' }}>Time Slot</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {todaySched.map((a, i) => (
                  <tr key={a.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '800', color: '#0284c7' }}>#{a.token_number || (i + 1)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{a.patient_name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{a.time_slot || '04:30 PM'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${a.status === 'Checked-in' ? 'badge-warning' : a.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => onNavigate('emr')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Consult Now
                      </button>
                    </td>
                  </tr>
                ))}
                {todaySched.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No scheduled appointments for today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Upcoming Appointments */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Upcoming Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingApts.map((apt, i) => (
                <div key={apt.id || i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #0284c7' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{apt.patient_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>{apt.appointment_date} • {apt.time_slot}</span>
                    <span className="badge badge-info">{apt.status}</span>
                  </div>
                </div>
              ))}
              {upcomingApts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No upcoming sessions booked.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NURSE DASHBOARD
  // ==========================================
  if (currentRole === 'Nurse') {
    const nData = roleData || {};
    const activePts = nData.activePatients || [];
    const recentVt = nData.recentVitals || [];

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        {/* Hero */}
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '160px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #1e293b 100%)',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.25)',
          color: '#ffffff',
          padding: '28px 32px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={17} color="#fde047" />
              <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>
                {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Nurse'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>• {todayFormatted}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              Inpatient Nursing Station
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Ward administration, patient vitals monitoring, and medication rounds.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('vital-signs')} className="btn" style={{ background: '#ffffff', color: '#0284c7', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Record Vital Signs
            </button>
            <button onClick={() => onNavigate('nursing-notes')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Add Nursing Note
            </button>
          </div>
        </div>

        {/* 4 Nurse KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BedDouble size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Assigned Inpatients</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{nData.assignedPatients ?? 6}</div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Active in Ward 03</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Today's Appointments</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{nData.todayPatientAppointments ?? 5}</div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>Consultations & Procedures</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Pending Nursing Tasks</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{nData.pendingNursingTasks ?? 4}</div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Vitals & Med Administration</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Completed Tasks</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{nData.completedNursingTasks ?? 12}</div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Daily Rounds Executed</span>
          </div>
        </div>

        {/* Inpatient Ward Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Ward Bed Status</h3>
              <button onClick={() => onNavigate('nurse-patients')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                View Inpatients
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Bed</th>
                  <th style={{ padding: '10px 14px' }}>Patient</th>
                  <th style={{ padding: '10px 14px' }}>Doctor</th>
                  <th style={{ padding: '10px 14px' }}>Care Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activePts.map(adm => (
                  <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0284c7' }}>{adm.bed_no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{adm.patient_name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{adm.doctor_name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-success">{adm.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => onNavigate('vital-signs')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        + Vitals
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Vitals */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Latest Vital Measurements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentVt.map(v => (
                <div key={v.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                    <span>{v.patient_name || `Patient #${v.patient_id}`}</span>
                    <span style={{ color: '#0284c7' }}>BP: {v.blood_pressure}</span>
                  </div>
                  <div style={{ color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Temp: {v.temperature}°F • Pulse: {v.pulse} bpm</span>
                    <span className="badge badge-success">SpO2: {v.spo2}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RECEPTIONIST DASHBOARD
  // ==========================================
  if (currentRole === 'Receptionist') {
    const recData = roleData || {};
    const appointmentsList = recData.appointments || [];

    const handleQuickCheckin = async (id) => {
      try {
        await api.checkInPatient(id);
        const refreshed = await api.getRoleSummary('Receptionist');
        setRoleData(refreshed);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        {/* Hero */}
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '160px',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 55%, #1e3a8a 100%)',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
          color: '#ffffff',
          padding: '28px 32px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={17} color="#fde047" />
              <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>
                {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Receptionist'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>• {todayFormatted}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              OPD Registration & Channelling Desk
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Patient reception, appointment scheduling, and live check-in management.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('patient-registration')} className="btn" style={{ background: '#ffffff', color: '#2563eb', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Register Patient
            </button>
            <button onClick={() => onNavigate('appointments')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Book Appointment
            </button>
          </div>
        </div>

        {/* 4 Receptionist KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Total Patients</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{recData.totalRegisteredPatients ?? 16}</div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Hospital Registered</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Today's Bookings</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{recData.todayAppointments ?? 6}</div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>Consultations Today</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Pending Appointments</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{recData.pendingAppointments ?? 4}</div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Awaiting Arrival</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Today's Check-ins</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{recData.todayCheckins ?? 2}</div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Marked as Arrived</span>
          </div>
        </div>

        {/* Patient Arrival & Checkin Queue */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Patient Arrival & Check-in Desk</h3>
            <button onClick={() => onNavigate('patient-checkin')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Full Check-in View
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Appt No</th>
                <th style={{ padding: '12px 16px' }}>Patient Name</th>
                <th style={{ padding: '12px 16px' }}>Consultant</th>
                <th style={{ padding: '12px 16px' }}>Appointment Time</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsList.map(apt => (
                <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0284c7' }}>{apt.appointment_no}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{apt.patient_name}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{apt.doctor_name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{apt.appointment_date} {apt.time_slot}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${apt.status === 'Checked-in' ? 'badge-success' : 'badge-warning'}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {apt.status !== 'Checked-in' ? (
                      <button
                        onClick={() => handleQuickCheckin(apt.id)}
                        className="btn btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                      >
                        Mark as Arrived
                      </button>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '0.8rem' }}>✓ Arrived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // LABORATORY STAFF DASHBOARD
  // ==========================================
  if (currentRole === 'Laboratory Staff') {
    const labData = roleData || {};
    const ordersList = labData.recentOrders || [];

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        {/* Hero */}
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '160px',
          background: 'linear-gradient(135deg, #6b21a8 0%, #7c3aed 55%, #0284c7 100%)',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.25)',
          color: '#ffffff',
          padding: '28px 32px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={17} color="#fde047" />
              <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>
                {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Laboratory Staff'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>• {todayFormatted}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              Pathology & Diagnostics Laboratory
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Diagnostic sample tracking, automated test analysis, and report validation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('lab-enter-results')} className="btn" style={{ background: '#ffffff', color: '#7c3aed', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Enter Test Results
            </button>
            <button onClick={() => onNavigate('lab-test-management')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Test Catalogue
            </button>
          </div>
        </div>

        {/* 4 Lab KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlaskConical size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Total Requests</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{labData.totalLaboratoryRequests ?? 8}</div>
            <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '600' }}>Investigation Orders</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Pending Tests</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{labData.pendingTests ?? 3}</div>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Awaiting Processing</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>In Progress</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{labData.testsInProgress ?? 2}</div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Specimens in Lab</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Completed Tests</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{labData.completedTests ?? 5}</div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>Results Published</span>
          </div>
        </div>

        {/* Pending Tests Table */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Laboratory Work Queue</h3>
            <button onClick={() => onNavigate('lab-requests')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              View All Orders
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Order No</th>
                <th style={{ padding: '12px 16px' }}>Patient</th>
                <th style={{ padding: '12px 16px' }}>Requested Test</th>
                <th style={{ padding: '12px 16px' }}>Sample Type</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map(ord => (
                <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#7c3aed' }}>{ord.order_no}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{ord.patient_name}</td>
                  <td style={{ padding: '12px 16px' }}>{ord.test_name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{ord.sample_type || 'Venous Blood'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${ord.result_status === 'Pending' ? 'badge-warning' : 'badge-success'}`}>
                      {ord.result_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => onNavigate('lab-enter-results')} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                      Enter Result
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHARMACIST DASHBOARD
  // ==========================================
  if (currentRole === 'Pharmacist') {
    const pharmaData = roleData || {};
    const rxList = pharmaData.recentPrescriptions || [];

    const handleDispenseRx = async (id) => {
      try {
        await api.dispensePrescription(id, currentUser?.full_name || 'Pharmacist');
        const refreshed = await api.getRoleSummary('Pharmacist');
        setRoleData(refreshed);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        {/* Hero */}
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '160px',
          background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #0284c7 100%)',
          boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.25)',
          color: '#ffffff',
          padding: '28px 32px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={17} color="#fde047" />
              <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>
                {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Pharmacist'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>• {todayFormatted}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              In-House Dispensary & Pharmacy
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Medication dispensing, real-time stock control, and expiry tracking.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('pharma-dispense')} className="btn" style={{ background: '#ffffff', color: '#0f766e', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Dispense Medicines
            </button>
            <button onClick={() => onNavigate('pharma-stock')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Stock Management
            </button>
          </div>
        </div>

        {/* 4 Pharmacist KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Total Medicines</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{pharmaData.totalMedicines ?? 12}</div>
            <span style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: '600' }}>In Hospital Catalog</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Low Stock Items</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{pharmaData.lowStockMedicines ?? 3}</div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Reorder Recommended</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Out of Stock</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{pharmaData.outOfStockMedicines ?? 0}</div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>Inventory Healthy</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Pending Prescriptions</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{pharmaData.pendingPrescriptions ?? 4}</div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Ready for Dispensing</span>
          </div>
        </div>

        {/* Prescriptions to Dispense Table */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Prescriptions Awaiting Dispensing</h3>
            <button onClick={() => onNavigate('pharma-prescriptions')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Full Prescription List
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Rx ID</th>
                <th style={{ padding: '12px 16px' }}>Patient</th>
                <th style={{ padding: '12px 16px' }}>Known Allergies</th>
                <th style={{ padding: '12px 16px' }}>Doctor</th>
                <th style={{ padding: '12px 16px' }}>Medicine</th>
                <th style={{ padding: '12px 16px' }}>Dosage & Freq</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rxList.map(rx => (
                <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f766e' }}>RX-{String(rx.id).padStart(4, '0')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{rx.patient_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {rx.patient_allergies && !/^none/i.test(rx.patient_allergies) ? (
                      <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '700', border: '1px solid #fca5a5' }}>
                        ⚠️ {rx.patient_allergies}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: '600' }}>✓ None</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{rx.doctor_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0284c7' }}>{rx.medicine_name}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{rx.dosage} • {rx.frequency}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {rx.dispense_status !== 'Dispensed' ? (
                      <button onClick={() => handleDispenseRx(rx.id)} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                        Dispense Now
                      </button>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '0.8rem' }}>✓ Dispensed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACCOUNTANT DASHBOARD
  // ==========================================
  if (currentRole === 'Accountant') {
    const accData = roleData || {};
    const paymentsList = accData.recentPayments || [];
    const pendingBillsList = accData.recentBills || [];

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        {/* Hero */}
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '160px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 55%, #0284c7 100%)',
          boxShadow: '0 10px 25px -5px rgba(30, 41, 59, 0.25)',
          color: '#ffffff',
          padding: '28px 32px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sun size={17} color="#fde047" />
              <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>
                {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Accountant'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>• {todayFormatted}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              Financial Accounting & Billing Desk
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Patient billing, cash collection, outstanding reconciliations, and fiscal analytics.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('accountant-create-bill')} className="btn" style={{ background: '#0284c7', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Create New Bill
            </button>
            <button onClick={() => onNavigate('accountant-reports')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Financial Reports
            </button>
          </div>
        </div>

        {/* 4 Accountant KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Today's Payments</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{accData.todayPayments ?? 3}</div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Transactions Settled</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Recorded Revenue</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a' }}>{formatLKR(accData.recordedRevenue || 45000)}</div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>Hospital Billings Total</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Pending Payments</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{accData.pendingPayments ?? 2}</div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Unpaid Invoices</span>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Outstanding Balance</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#dc2626' }}>{formatLKR(accData.outstandingBills || 8500)}</div>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>To Be Collected</span>
          </div>
        </div>

        {/* Recent Invoices & Payments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Recent Billing Invoices</h3>
              <button onClick={() => onNavigate('billing')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                View All
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Invoice</th>
                  <th style={{ padding: '10px 14px' }}>Patient</th>
                  <th style={{ padding: '10px 14px' }}>Total Amount</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingBillsList.slice(0, 5).map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0284c7' }}>{b.bill_no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{b.patient_name}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700' }}>Rs. {Number(b.total_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${b.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => onNavigate('accountant-payments')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Payment History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentsList.slice(0, 5).map(p => (
                <div key={p.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.825rem', borderLeft: '3px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                    <span>{p.patient_name || 'Patient'}</span>
                    <span style={{ color: '#16a34a' }}>Rs. {Number(p.amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ref: {p.transaction_ref}</span>
                    <span className="badge badge-info">{p.payment_method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMINISTRATOR DASHBOARD (DEFAULT)
  // ==========================================
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* 1. Hero Welcome Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          minHeight: '180px',
          background: 'linear-gradient(135deg, #09326e 0%, #0057b7 55%, #0284c7 100%)',
          boxShadow: '0 10px 25px -5px rgba(2, 87, 183, 0.25)',
          color: '#ffffff'
        }}
      >
        {/* Left Side: Greeting & Titles */}
        <div
          style={{
            flex: '1 1 55%',
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          {/* Subheader: Weather icon + greeting + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sun size={17} color="#fde047" />
            <span style={{ fontSize: '0.925rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>
              {getGreeting()}, <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || 'Admin User'}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', marginLeft: '6px' }}>
              • Today is {todayFormatted}
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: '800',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: '#ffffff'
            }}
          >
            Welcome to HMS <br />
            <span style={{ color: '#ffffff' }}>Admin Dashboard</span>
          </h1>

          {/* Description */}
          <p
            style={{
              margin: 0,
              fontSize: '0.925rem',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '520px',
              lineHeight: 1.5
            }}
          >
            Manage hospital operations efficiently with a centralized management system.
          </p>
        </div>

        {/* Right Side: Hospital Exterior Photo with smooth curved blend */}
        <div
          style={{
            flex: '1 1 45%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <img
            src="/welcome/exterior_hospital.jpg"
            alt="Hospital Building"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%'
            }}
          />
          {/* Soft Left Wave Blend to Blue Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '120px',
              background: 'linear-gradient(to right, #0057b7 0%, rgba(0, 87, 183, 0.85) 40%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* 2. 6 Statistics Cards Row (Matching User Screenshot) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Stat 1: Total Patients */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={20} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Total Patients</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {Number(metrics.totalPatients ?? 0).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#10b981', fontWeight: '600' }}>
            <TrendingUp size={13} />
            <span>{summary?.patientGrowthTrend || 'Registered in database'}</span>
          </div>
        </div>

        {/* Stat 2: Total Doctors */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Stethoscope size={20} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Total Doctors</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {metrics.totalDoctors ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#10b981', fontWeight: '600' }}>
            <TrendingUp size={13} />
            <span>{summary?.doctorGrowthTrend || 'Active hospital doctors'}</span>
          </div>
        </div>

        {/* Stat 3: Total Staff */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#f3e8ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={20} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Total Staff</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {metrics.totalStaff ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#10b981', fontWeight: '600' }}>
            <TrendingUp size={13} />
            <span>{summary?.staffGrowthTrend || 'Healthcare staff members'}</span>
          </div>
        </div>

        {/* Stat 4: Today's Appointments */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={20} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Today's Appointments</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {metrics.todayAppointments ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#10b981', fontWeight: '600' }}>
            <TrendingUp size={13} />
            <span>{summary?.appointmentGrowthTrend || `${metrics.totalAppointments || 0} total scheduled`}</span>
          </div>
        </div>

        {/* Stat 5: Pending Lab Tests */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ffe4e6',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FlaskConical size={20} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Pending Lab Tests</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {metrics.pendingLabRequests ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: metrics.pendingLabRequests > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
            {metrics.pendingLabRequests > 0 ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
            <span>{summary?.labPendingTrend || 'Diagnostic lab requests'}</span>
          </div>
        </div>

        {/* Stat 6: Total Revenue */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ccfbf1',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.825rem'
              }}
            >
              Rs.
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Total Revenue</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {formatLKR(metrics.totalRevenueLKR ?? 0)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#10b981', fontWeight: '600' }}>
            <TrendingUp size={13} />
            <span>{summary?.revenueGrowthTrend || 'From billing invoices'}</span>
          </div>
        </div>
      </div>

      {/* 3. Analytics Charts Row (3 Charts + Quick Actions Column) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px'
        }}
      >
        {/* Chart 1: Patient Registration Overview (Jan - Oct) */}
        <div
          style={{
            gridColumn: 'span 4',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Patient Registration Overview
              </h3>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#0284c7', fontWeight: '700' }}>
              {metrics.totalPatients || 0} Total
            </span>
          </div>

          <div style={{ flex: 1, height: '170px', position: 'relative' }}>
            <svg viewBox="0 0 320 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="25" y1="20" x2="310" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="25" y1="55" x2="310" y2="55" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="25" y1="90" x2="310" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="25" y1="125" x2="310" y2="125" stroke="#f1f5f9" strokeWidth="1" />

              {/* Y-axis Labels */}
              <text x="2" y="24" fontSize="9" fill="#94a3b8">{maxReg}</text>
              <text x="2" y="59" fontSize="9" fill="#94a3b8">{Math.round(maxReg * 0.66)}</text>
              <text x="2" y="94" fontSize="9" fill="#94a3b8">{Math.round(maxReg * 0.33)}</text>
              <text x="12" y="129" fontSize="9" fill="#94a3b8">0</text>

              {/* Area Gradient */}
              <defs>
                <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dynamic Area Fill */}
              {regAreaD && (
                <path
                  d={regAreaD}
                  fill="url(#patientGrad)"
                />
              )}

              {/* Dynamic Line */}
              {regLineD && (
                <path
                  d={regLineD}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dynamic Points */}
              {regPoints.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2">
                    <title>{pt.month}: {pt.count} Patients Registered</title>
                  </circle>
                </g>
              ))}

              {/* X-axis Labels */}
              {regPoints.map((pt) => (
                <text key={pt.month} x={pt.x} y="142" fontSize="8.5" fill="#64748b" textAnchor="middle">
                  {pt.month}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart 2: Monthly Appointment Statistics (Grouped Bar Chart: Booked vs Completed) */}
        <div
          style={{
            gridColumn: 'span 3',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Monthly Appointment Statistics
              </h3>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.725rem', color: '#64748b' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
              <span>Booked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.725rem', color: '#64748b' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2dd4bf' }} />
              <span>Completed</span>
            </div>
          </div>

          <div style={{ flex: 1, height: '160px', position: 'relative' }}>
            <svg viewBox="0 0 250 145" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid lines */}
              <line x1="25" y1="20" x2="245" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="25" y1="55" x2="245" y2="55" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="25" y1="90" x2="245" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="25" y1="125" x2="245" y2="125" stroke="#f1f5f9" strokeWidth="1" />

              {/* Y labels */}
              <text x="2" y="24" fontSize="8.5" fill="#94a3b8">{maxApt}</text>
              <text x="2" y="59" fontSize="8.5" fill="#94a3b8">{Math.round(maxApt * 0.66)}</text>
              <text x="2" y="94" fontSize="8.5" fill="#94a3b8">{Math.round(maxApt * 0.33)}</text>
              <text x="12" y="129" fontSize="8.5" fill="#94a3b8">0</text>

              {/* Grouped Bars for May to Oct from real data */}
              {monthlyAppointments.map((item, idx) => {
                const groupStep = 205 / Math.max(monthlyAppointments.length, 1);
                const groupX = 35 + idx * groupStep;
                const bookedVal = Number(item.booked) || 0;
                const completedVal = Number(item.completed) || 0;
                const bHeight = bookedVal > 0 ? Math.max(4, (bookedVal / maxApt) * 100) : 0;
                const cHeight = completedVal > 0 ? Math.max(4, (completedVal / maxApt) * 100) : 0;
                return (
                  <g key={item.month}>
                    <title>{item.month}: {bookedVal} Booked, {completedVal} Completed</title>
                    {/* Booked bar (Blue) */}
                    <rect
                      x={groupX}
                      y={125 - bHeight}
                      width="10"
                      height={bHeight}
                      rx="3"
                      fill="#0284c7"
                    />
                    {/* Completed bar (Teal/mint) */}
                    <rect
                      x={groupX + 12}
                      y={125 - cHeight}
                      width="10"
                      height={cHeight}
                      rx="3"
                      fill="#2dd4bf"
                    />
                    {/* Month label */}
                    <text x={groupX + 11} y="139" fontSize="8.5" fill="#64748b" textAnchor="middle">
                      {item.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart 3: Revenue Overview (Area Line Chart) */}
        <div
          style={{
            gridColumn: 'span 3',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ccfbf1',
                  color: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '800'
                }}
              >
                Rs.
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Revenue Overview
              </h3>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: '700' }}>
              {formatLKR(metrics.totalRevenueLKR)}
            </span>
          </div>

          <div style={{ flex: 1, height: '170px', position: 'relative' }}>
            <svg viewBox="0 0 250 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid lines */}
              <line x1="28" y1="20" x2="245" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="28" y1="55" x2="245" y2="55" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="28" y1="90" x2="245" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="28" y1="125" x2="245" y2="125" stroke="#f1f5f9" strokeWidth="1" />

              {/* Y labels */}
              <text x="2" y="24" fontSize="8.5" fill="#94a3b8">{formatShortNumber(maxRev)}</text>
              <text x="2" y="59" fontSize="8.5" fill="#94a3b8">{formatShortNumber(maxRev * 0.66)}</text>
              <text x="2" y="94" fontSize="8.5" fill="#94a3b8">{formatShortNumber(maxRev * 0.33)}</text>
              <text x="12" y="129" fontSize="8.5" fill="#94a3b8">0</text>

              {/* Area gradient */}
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dynamic Area Fill */}
              {revAreaD && (
                <path
                  d={revAreaD}
                  fill="url(#revGrad)"
                />
              )}

              {/* Dynamic Line */}
              {revLineD && (
                <path
                  d={revLineD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dynamic Points */}
              {revPoints.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="2">
                    <title>{pt.month}: Rs. {pt.amount.toLocaleString()}</title>
                  </circle>
                </g>
              ))}

              {/* X labels */}
              {revPoints.map((pt) => (
                <text key={pt.month} x={pt.x} y="142" fontSize="8.5" fill="#64748b" textAnchor="middle">
                  {pt.month}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Column 4: Quick Actions (Matching User Screenshot Buttons & Colors) */}
        <div
          style={{
            gridColumn: 'span 2',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#0284c7', fontSize: '1rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
              Quick Actions
            </h3>
          </div>

          {/* Action 1: Register Patient (Blue) */}
          <button
            onClick={() => onNavigate('patients')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={15} />
              <span>Register Patient</span>
            </span>
            <ArrowRight size={15} />
          </button>

          {/* Action 2: Add Doctor (Mint/Green) */}
          <button
            onClick={() => onNavigate('doctors')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={15} />
              <span>Add Doctor</span>
            </span>
            <ArrowRight size={15} />
          </button>

          {/* Action 3: Book Appointment (Purple) */}
          <button
            onClick={() => onNavigate('appointments')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: '#8b5cf6',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} />
              <span>Book Appointment</span>
            </span>
            <ArrowRight size={15} />
          </button>

          {/* Action 4: Manage Staff (Orange) */}
          <button
            onClick={() => onNavigate('staff')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: '#f97316',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={15} />
              <span>Manage Staff</span>
            </span>
            <ArrowRight size={15} />
          </button>

          {/* Action 5: View Reports (Teal) */}
          <button
            onClick={() => onNavigate('reports')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: '#06b6d4',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} />
              <span>View Reports</span>
            </span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 4. Bottom Row: 4 Cards / Tables (Matching User Screenshot) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px'
        }}
      >
        {/* Card 1: Recent Appointments */}
        <div
          style={{
            gridColumn: 'span 4',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Recent Appointments
              </h3>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>Patient Name</th>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>Doctor</th>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>Date & Time</th>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
                      No appointments recorded yet
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((apt) => {
                    const st = (apt.status || 'Scheduled').toLowerCase();
                    const isSuccess = ['confirmed', 'completed'].includes(st);
                    const isWarning = ['pending', 'scheduled'].includes(st);
                    const isPrimary = ['in consultation', 'checked-in'].includes(st);
                    const badgeBg = isSuccess ? '#dcfce7' : isPrimary ? '#e0f2fe' : isWarning ? '#fef3c7' : '#fee2e2';
                    const badgeColor = isSuccess ? '#15803d' : isPrimary ? '#0284c7' : isWarning ? '#b45309' : '#b91c1c';
                    return (
                      <tr key={apt.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '9px 0', fontWeight: '600', color: '#1e293b' }}>{apt.patient_name}</td>
                        <td style={{ padding: '9px 0', color: '#64748b' }}>{apt.doctor}</td>
                        <td style={{ padding: '9px 0', color: '#94a3b8', fontSize: '0.725rem' }}>{apt.date_time}</td>
                        <td style={{ padding: '9px 0' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.675rem',
                              fontWeight: '700',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              textTransform: 'capitalize'
                            }}
                          >
                            {apt.status || 'Scheduled'}
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

        {/* Card 2: Recent Patient Registrations */}
        <div
          style={{
            gridColumn: 'span 3',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Recent Patient Registrations
              </h3>
            </div>
            <button
              onClick={() => onNavigate('patients')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>Patient Name</th>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>NIC</th>
                  <th style={{ paddingBottom: '8px', fontWeight: '600' }}>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPatientRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
                      No patient registrations found
                    </td>
                  </tr>
                ) : (
                  recentPatientRegistrations.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '9px 0', fontWeight: '600', color: '#1e293b' }}>{p.patient_name}</td>
                      <td style={{ padding: '9px 0', color: '#64748b' }}>{p.nic || 'N/A'}</td>
                      <td style={{ padding: '9px 0', color: '#94a3b8', fontSize: '0.725rem' }}>{p.registered_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Recent System Activities */}
        <div
          style={{
            gridColumn: 'span 3',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Recent System Activities
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivities.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                No recent activities recorded
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor:
                          act.type === 'patient'
                            ? '#ffe4e6'
                            : act.type === 'appointment'
                            ? '#fef3c7'
                            : act.type === 'emr'
                            ? '#dcfce7'
                            : act.type === 'billing'
                            ? '#e0f2fe'
                            : '#f3e8ff',
                        color:
                          act.type === 'patient'
                            ? '#e11d48'
                            : act.type === 'appointment'
                            ? '#d97706'
                            : act.type === 'emr'
                            ? '#10b981'
                            : act.type === 'billing'
                            ? '#0284c7'
                            : '#9333ea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {act.type === 'patient' && <Users size={14} />}
                      {act.type === 'appointment' && <Calendar size={14} />}
                      {act.type === 'emr' && <FileText size={14} />}
                      {act.type === 'billing' && <Coins size={14} />}
                      {act.type === 'auth' && <LogIn size={14} />}
                      {act.type === 'lab' && <FlaskConical size={14} />}
                      {act.type === 'system' && <Clock size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.775rem', fontWeight: '700', color: '#1e293b' }}>{act.action}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{act.detail}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>{act.time_ago}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 4: Pending Tasks */}
        <div
          style={{
            gridColumn: 'span 2',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #eef2f6',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#0284c7', fontSize: '1rem' }}>📋</span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Pending Tasks
              </h3>
            </div>
            <button
              onClick={() => onNavigate('laboratory')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => task.route && onNavigate(task.route)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: task.route ? 'pointer' : 'default',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { if (task.route) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: task.color,
                    marginTop: '5px',
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.35 }}>
                  <strong style={{ color: '#0f172a' }}>{task.count}</strong> {task.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Bottom Footer (Matching User Screenshot) */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 4px 8px 4px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.8rem',
          color: '#64748b'
        }}
      >
        <div>Hospital Management System (HMS)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Better Care</span>
          <span>|</span>
          <span>Smarter Management</span>
          <span>|</span>
          <span>Healthier Tomorrow</span>
        </div>
      </footer>
    </div>
  );
}
