import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Users, Activity, FileText, Search, RefreshCw,
  Trash2, CheckCircle2, AlertTriangle, Clock, ArrowUpRight,
  TrendingUp, Eye, Sparkles, MessageSquare, Compass, Target,
  X, UserCheck, ChevronRight, Zap
} from 'lucide-react';

export default function AdminDashboardModal({ isOpen, onClose, authHeaders, currentUser }) {
  const [activeTab, setActiveTab] = useState('activities'); // 'activities' | 'users' | 'resumes' | 'overview'
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const timerRef = useRef(null);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();

      const [overviewRes, usersRes, actRes, resumesRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/activities?limit=100', { headers }),
        fetch('/api/admin/resumes?limit=100', { headers }),
      ]);

      if (overviewRes.status === 403 || usersRes.status === 403) {
        throw new Error('Access denied: Admin privileges required.');
      }

      const overviewData = await overviewRes.json();
      const usersData = await usersRes.json();
      const actData = await actRes.json();
      const resumesData = await resumesRes.json();

      if (overviewData.success) setOverview(overviewData);
      if (usersData.success) setUsers(usersData.users || []);
      if (actData.success) setActivities(actData.activities || []);
      if (resumesData.success) setResumes(resumesData.resumes || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError(err.message || 'Failed to fetch admin telemetry.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen, fetchAllData]);

  // Live auto-refresh polling
  useEffect(() => {
    if (isOpen && autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchAllData(true);
      }, 7000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, autoRefresh, fetchAllData]);

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to delete user.');
      
      setActionSuccessMsg(data.message || 'User deleted successfully.');
      setDeleteTargetUser(null);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchAllData(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filtered queries
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activities.filter(a =>
    a.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResumes = resumes.filter(r =>
    r.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.target_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionBadge = (action) => {
    switch (action) {
      case 'REGISTER':
        return <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}><Users size={12} /> Register</span>;
      case 'LOGIN':
        return <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}><UserCheck size={12} /> Login</span>;
      case 'UPLOAD_RESUME':
      case 'ANALYZE_RESUME':
        return <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}><FileText size={12} /> Resume Upload</span>;
      case 'JOB_MATCH':
        return <span className="badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}><Target size={12} /> Job Match</span>;
      case 'ROADMAP_GEN':
        return <span className="badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}><Compass size={12} /> Career Roadmap</span>;
      case 'AI_CHAT':
        return <span className="badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.3)' }}><MessageSquare size={12} /> AI Counselor</span>;
      default:
        return <span className="badge badge-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}><Zap size={12} /> {action}</span>;
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'Just now';
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
      <div
        className="glass-card"
        style={{
          width: '95vw',
          maxWidth: '1240px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '1.25rem',
          padding: '1.75rem',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
          background: 'var(--bg-secondary)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Shield size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  Admin Command Center
                </h2>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Super Admin Mode
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                Real-time user monitoring, activity telemetry, and database management
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Auto-refresh indicator */}
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '0.4rem 0.8rem',
                gap: '0.4rem',
                borderColor: autoRefresh ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                background: autoRefresh ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
              }}
              title="Toggle Live Stream Auto-Refresh"
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: autoRefresh ? '#10b981' : '#64748b',
                  display: 'inline-block',
                  boxShadow: autoRefresh ? '0 0 8px #10b981' : 'none'
                }}
              />
              <span>{autoRefresh ? 'Live Auto-Sync (7s)' : 'Live Sync Paused'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchAllData()}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', gap: '0.4rem' }}
              disabled={loading}
              title="Refresh Telemetry Now"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ padding: '0.4rem', borderRadius: '50%' }}
              title="Close Command Center"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications & Error banner */}
        {actionSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '0.65rem 1rem', borderRadius: '0.6rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', padding: '0.65rem 1rem', borderRadius: '0.6rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div className="metric-box" style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1.1rem', borderRadius: '0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Users</span>
              <Users size={16} style={{ color: '#818cf8' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {overview?.metrics?.total_users ?? users.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Registered accounts in DB
            </div>
          </div>

          <div className="metric-box" style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1.1rem', borderRadius: '0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Resumes</span>
              <FileText size={16} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {overview?.metrics?.total_resumes ?? resumes.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Analyzed with ATS Engine
            </div>
          </div>

          <div className="metric-box" style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1.1rem', borderRadius: '0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Events Logged</span>
              <Activity size={16} style={{ color: '#ec4899' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.35rem', color: '#ec4899' }}>
              {overview?.metrics?.total_activities_logged ?? activities.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Real-time user actions
            </div>
          </div>

          <div className="metric-box" style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1.1rem', borderRadius: '0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg ATS Score</span>
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.35rem', color: '#10b981' }}>
              {overview?.metrics?.avg_ats_score ? `${overview.metrics.avg_ats_score}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Platform benchmark
            </div>
          </div>
        </div>

        {/* Tabs and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('activities')}
              className={`btn ${activeTab === 'activities' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', gap: '0.4rem' }}
            >
              <Activity size={15} />
              <span>Live Activity Stream ({activities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', gap: '0.4rem' }}
            >
              <Users size={15} />
              <span>Registered Users ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('resumes')}
              className={`btn ${activeTab === 'resumes' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', gap: '0.4rem' }}
            >
              <FileText size={15} />
              <span>All Resumes ({resumes.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.3rem', fontSize: '0.82rem', height: '36px' }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '320px', paddingRight: '0.25rem' }}>
          {/* ──────── TAB 1: LIVE ACTIVITY FEED ──────── */}
          {activeTab === 'activities' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Showing real-time chronological actions performed by users on the platform
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Auto-updated at {lastRefreshed.toLocaleTimeString()}
                </span>
              </div>

              {filteredActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  <Activity size={36} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                  <p>No activity records found matching your filter.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '0.75rem',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        gap: '1rem',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                        <div style={{ marginTop: '0.1rem' }}>{getActionBadge(act.action_type)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {act.user_name}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              &bull; {act.user_email}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: '1.4' }}>
                            {act.details}
                          </p>
                          {act.metadata && Object.keys(act.metadata).length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                              {Object.entries(act.metadata).map(([k, v]) => (
                                <span
                                  key={k}
                                  style={{
                                    fontSize: '0.7rem',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '0.35rem',
                                    color: 'var(--text-muted)'
                                  }}
                                >
                                  <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        <Clock size={13} />
                        <span>{formatTimestamp(act.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────── TAB 2: REGISTERED USERS ──────── */}
          {activeTab === 'users' && (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>User &amp; Email</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Resumes</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Job Matches</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Roadmaps</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Last Activity</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Joined</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSuperAdmin = u.role === 'admin' || u.is_admin;
                        const isSelf = currentUser && (currentUser.id === u.id || currentUser.email === u.email);

                        return (
                          <tr
                            key={u.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s'
                            }}
                          >
                            <td style={{ padding: '0.75rem 0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isSuperAdmin ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: '#fff'
                                  }}
                                >
                                  {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {u.full_name} {isSelf && <span style={{ fontSize: '0.7rem', color: '#818cf8' }}>(You)</span>}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem' }}>
                              {isSuperAdmin ? (
                                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                                  <Shield size={11} style={{ marginRight: '3px' }} /> ADMIN
                                </span>
                              ) : (
                                <span className="badge badge-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                                  User
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {u.resumes_count}
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {u.job_matches_count}
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {u.roadmaps_count}
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem' }}>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {u.last_action}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {formatTimestamp(u.last_active)}
                              </div>
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>
                              {!isSelf && !isSuperAdmin && (
                                <button
                                  onClick={() => setDeleteTargetUser(u)}
                                  className="btn-icon"
                                  style={{ color: '#f43f5e', padding: '0.35rem', borderRadius: '0.4rem' }}
                                  title={`Delete user account ${u.email}`}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────── TAB 3: RESUME SUBMISSIONS ──────── */}
          {activeTab === 'resumes' && (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Candidate &amp; Role</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>ATS Score</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Owner Account</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>File Name</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Contact Info</th>
                      <th style={{ padding: '0.75rem 0.6rem', fontWeight: 600 }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResumes.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No resumes found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredResumes.map((r) => {
                        const score = r.ats_score || 0;
                        const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
                        const scoreBg = score >= 80 ? 'rgba(16, 185, 129, 0.15)' : score >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)';

                        return (
                          <tr
                            key={r.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s'
                            }}
                          >
                            <td style={{ padding: '0.75rem 0.6rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {r.candidate_name || 'Unnamed Candidate'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 500 }}>
                                {r.target_role || 'General Role'}
                              </div>
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem' }}>
                              <span
                                style={{
                                  background: scoreBg,
                                  color: scoreColor,
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '0.4rem',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                {score}%
                              </span>
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem' }}>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {r.owner_email}
                              </div>
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              {r.filename}
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              <div>{r.email || 'N/A'}</div>
                              <div>{r.phone || ''}</div>
                            </td>

                            <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {formatTimestamp(r.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {deleteTargetUser && (
          <div className="modal-backdrop" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.7)' }}>
            <div
              className="glass-card"
              style={{
                maxWidth: '420px',
                width: '90%',
                padding: '1.5rem',
                borderRadius: '1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Delete User Account?</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                Are you sure you want to permanently delete <strong>{deleteTargetUser.email}</strong> ({deleteTargetUser.full_name})? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteTargetUser(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteTargetUser.id)}
                  className="btn btn-danger"
                  style={{ padding: '0.45rem 1.2rem', fontSize: '0.82rem', background: '#f43f5e', borderColor: '#f43f5e', color: '#fff' }}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
