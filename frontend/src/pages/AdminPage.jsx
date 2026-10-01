import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Users, Activity, FileText, Search, RefreshCw,
  Trash2, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  MessageSquare, Compass, Target, LogOut, BarChart3,
  Sparkles, ChevronRight, Eye, Database, Zap, UserCheck,
  Home, Settings, Bell, XCircle, Download
} from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import { downloadTablePDF } from '../utils/pdfExport';


const ADMIN_EMAILS = [
  'a05370457@gmail.com',
  'rajveerereddyt@gmal.com',
  'rajveerereddyt@gmail.com'
];

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function getActionBadge(action) {
  const style = { fontSize: '0.72rem', padding: '0.18rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' };
  switch (action) {
    case 'REGISTER':
      return <span style={{ ...style, background: 'rgba(16,185,129,.15)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)' }}><UserCheck size={11} /> Register</span>;
    case 'LOGIN':
      return <span style={{ ...style, background: 'rgba(6,182,212,.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,.3)' }}><Shield size={11} /> Login</span>;
    case 'UPLOAD_RESUME':
    case 'ANALYZE_RESUME':
      return <span style={{ ...style, background: 'rgba(99,102,241,.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,.3)' }}><FileText size={11} /> Resume</span>;
    case 'JOB_MATCH':
      return <span style={{ ...style, background: 'rgba(245,158,11,.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)' }}><Target size={11} /> Job Match</span>;
    case 'ROADMAP_GEN':
      return <span style={{ ...style, background: 'rgba(16,185,129,.15)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)' }}><Compass size={11} /> Roadmap</span>;
    case 'AI_CHAT':
      return <span style={{ ...style, background: 'rgba(236,72,153,.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,.3)' }}><MessageSquare size={11} /> AI Chat</span>;
    default:
      return <span style={{ ...style, background: 'rgba(100,116,139,.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,.3)' }}><Zap size={11} /> {action}</span>;
  }
}

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function scoreStyle(score) {
  if (score >= 80) return { background: 'rgba(16,185,129,.15)', color: '#10b981' };
  if (score >= 60) return { background: 'rgba(245,158,11,.15)', color: '#f59e0b' };
  return { background: 'rgba(244,63,94,.15)', color: '#f43f5e' };
}

// ──────────────────────────────────────────
// Sub-views
// ──────────────────────────────────────────

function OverviewView({ metrics, users, activities, resumes }) {
  const recentActivities = activities.slice(0, 8);

  return (
    <div>
      {/* Metric cards */}
      <div className="admin-metric-grid">
        <div className="admin-metric-card" style={{ borderTop: '2px solid #818cf8' }}>
          <div className="admin-metric-label">Total Users <Users size={14} style={{ color: '#818cf8' }} /></div>
          <div className="admin-metric-value" style={{ color: '#818cf8' }}>{metrics?.total_users ?? users.length}</div>
          <div className="admin-metric-sub">Registered accounts</div>
        </div>
        <div className="admin-metric-card" style={{ borderTop: '2px solid #38bdf8' }}>
          <div className="admin-metric-label">Resumes Analyzed <FileText size={14} style={{ color: '#38bdf8' }} /></div>
          <div className="admin-metric-value" style={{ color: '#38bdf8' }}>{metrics?.total_resumes ?? resumes.length}</div>
          <div className="admin-metric-sub">Through ATS engine</div>
        </div>
        <div className="admin-metric-card" style={{ borderTop: '2px solid #ec4899' }}>
          <div className="admin-metric-label">Platform Events <Activity size={14} style={{ color: '#ec4899' }} /></div>
          <div className="admin-metric-value" style={{ color: '#ec4899' }}>{metrics?.total_activities_logged ?? activities.length}</div>
          <div className="admin-metric-sub">Actions logged real-time</div>
        </div>
        <div className="admin-metric-card" style={{ borderTop: '2px solid #10b981' }}>
          <div className="admin-metric-label">Avg ATS Score <TrendingUp size={14} style={{ color: '#10b981' }} /></div>
          <div className="admin-metric-value" style={{ color: '#10b981' }}>
            {metrics?.avg_ats_score ? `${metrics.avg_ats_score}%` : 'N/A'}
          </div>
          <div className="admin-metric-sub">Platform benchmark</div>
        </div>
        <div className="admin-metric-card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="admin-metric-label">Job Matches <Target size={14} style={{ color: '#f59e0b' }} /></div>
          <div className="admin-metric-value" style={{ color: '#f59e0b' }}>{metrics?.total_job_matches ?? 0}</div>
          <div className="admin-metric-sub">Career path checks</div>
        </div>
        <div className="admin-metric-card" style={{ borderTop: '2px solid #a855f7' }}>
          <div className="admin-metric-label">Roadmaps Gen. <Compass size={14} style={{ color: '#a855f7' }} /></div>
          <div className="admin-metric-value" style={{ color: '#a855f7' }}>{metrics?.total_roadmaps ?? 0}</div>
          <div className="admin-metric-sub">Career accelerators</div>
        </div>
      </div>

      {/* Two-column: recent activity + top users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Recent Activity */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <span className="admin-live-dot" /> Live Activity Stream
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 8 events</span>
          </div>
          <div>
            {recentActivities.length === 0 ? (
              <div className="admin-empty"><Activity size={32} /><p>No activity logged yet</p></div>
            ) : recentActivities.map(a => (
              <div className="admin-feed-row" key={a.id}>
                <div style={{ flexShrink: 0, paddingTop: '2px' }}>{getActionBadge(a.action_type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.user_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details}</div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtTime(a.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title"><Users size={16} /> Registered Users</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{users.length} total</span>
          </div>
          <div>
            {users.slice(0, 8).map(u => {
              const isAdmin = u.role === 'admin' || u.is_admin || ADMIN_EMAILS.includes(u.email?.toLowerCase());
              const initials = u.full_name ? u.full_name[0].toUpperCase() : 'U';
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.2rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAdmin ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <div>
                    {isAdmin
                      ? <span style={{ fontSize: '0.65rem', background: 'rgba(168,85,247,.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,.4)', padding: '0.15rem 0.45rem', borderRadius: '999px', fontWeight: 700 }}>ADMIN</span>
                      : <span style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.45rem', borderRadius: '999px', fontWeight: 600 }}>User</span>
                    }
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.resumes_count} resumes</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityView({ activities }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const actionTypes = ['ALL', 'LOGIN', 'REGISTER', 'UPLOAD_RESUME', 'JOB_MATCH', 'ROADMAP_GEN', 'AI_CHAT'];

  const filtered = activities.filter(a => {
    const matchFilter = filter === 'ALL' || a.action_type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.user_name?.toLowerCase().includes(q) || a.user_email?.toLowerCase().includes(q) || a.details?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleDownload = () => {
    downloadTablePDF(
      filtered,
      ['action_type', 'user_name', 'user_email', 'details', 'timestamp'],
      ['Action', 'User', 'Email', 'Details', 'Time'],
      'Live Activity Log',
      'activity_log'
    );
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title">
          <span className="admin-live-dot" /> Live Activity Stream
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({filtered.length} events)</span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="admin-search-wrap">
            <Search size={14} />
            <input className="admin-search-input" placeholder="Search users, actions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', padding: '0.4rem 0.7rem', height: '36px', cursor: 'pointer' }}
          >
            {actionTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Events' : t}</option>)}
          </select>
          <button
            onClick={handleDownload}
            className="btn btn-secondary"
            id="download-activities-btn"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', gap: '0.35rem', height: '36px' }}
            title="Download activity log as PDF"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="admin-empty"><Activity size={36} /><p>No events match your filter.</p></div>
        ) : filtered.map(a => (
          <div className="admin-feed-row" key={a.id}>
            <div style={{ flexShrink: 0, paddingTop: '2px' }}>{getActionBadge(a.action_type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{a.user_name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>&bull; {a.user_email}</span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{a.details}</p>
              {a.metadata && Object.keys(a.metadata).length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  {Object.entries(a.metadata).map(([k, v]) => (
                    <span key={k} style={{ fontSize: '0.68rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '0.12rem 0.4rem', borderRadius: '6px', color: 'var(--text-muted)' }}>
                      <b>{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Clock size={12} /> {fmtTime(a.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersView({ users, currentUser, onDeleteSuccess }) {
  const [search, setSearch] = useState('');
  const [confirmUser, setConfirmUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const TOKEN_KEY = 'auracareer_session_token';
  const token = localStorage.getItem(TOKEN_KEY);

  const handleDownload = (filteredUsers) => {
    downloadTablePDF(
      filteredUsers,
      ['full_name', 'email', 'role', 'resumes_count', 'created_at'],
      ['Name', 'Email', 'Role', 'Resumes', 'Joined'],
      'Users Directory',
      'users'
    );
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const handleDelete = async (user) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to delete user.');
      setConfirmUser(null);
      onDeleteSuccess(data.message || 'User deleted.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title"><Users size={16} /> Registered Users ({users.length})</div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div className="admin-search-wrap">
            <Search size={14} />
            <input className="admin-search-input" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button
            onClick={() => handleDownload(filtered)}
            className="btn btn-secondary"
            id="download-users-btn"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', gap: '0.35rem', height: '36px' }}
            title="Download users list as PDF"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>
      {error && (
        <div style={{ margin: '0.75rem 1.2rem', background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.35)', color: '#f43f5e', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      <div className="admin-card-body">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Resumes</th>
              <th>Job Matches</th>
              <th>Roadmaps</th>
              <th>Last Action</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8"><div className="admin-empty"><Users size={28} /><p>No users found.</p></div></td></tr>
            ) : filtered.map(u => {
              const isAdmin = u.role === 'admin' || u.is_admin || ADMIN_EMAILS.includes(u.email?.toLowerCase());
              const isSelf = currentUser && (currentUser.id === u.id || currentUser.email === u.email);
              const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: isAdmin ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-primary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          {u.full_name} {isSelf && <span style={{ fontSize: '0.68rem', color: '#818cf8' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {isAdmin
                      ? <span style={{ fontSize: '0.7rem', background: 'rgba(168,85,247,.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,.4)', padding: '0.18rem 0.5rem', borderRadius: '999px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Shield size={11} /> ADMIN</span>
                      : <span style={{ fontSize: '0.7rem', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '0.18rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>User</span>
                    }
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{u.resumes_count}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{u.job_matches_count}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{u.roadmaps_count}</td>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{u.last_action}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmtTime(u.last_active)}</div>
                  </td>
                  <td style={{ fontSize: '0.76rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {!isSelf && !isAdmin && (
                      <button
                        onClick={() => setConfirmUser(u)}
                        style={{ background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.3)', color: '#f43f5e', padding: '0.3rem 0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 600, transition: 'all .15s' }}
                        title={`Delete user ${u.email}`}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm delete dialog */}
      {confirmUser && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-box">
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(244,63,94,.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={26} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Delete User Account?</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Permanently delete <strong>{confirmUser.email}</strong> ({confirmUser.full_name})? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => { setConfirmUser(null); setError(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.84rem', padding: '0.45rem 1rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmUser)}
                disabled={loading}
                style={{ background: '#f43f5e', border: 'none', color: '#fff', padding: '0.45rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumesView({ resumes }) {
  const [search, setSearch] = useState('');
  const filtered = resumes.filter(r => {
    const q = search.toLowerCase();
    return !q || r.candidate_name?.toLowerCase().includes(q) || r.target_role?.toLowerCase().includes(q) || r.owner_email?.toLowerCase().includes(q) || r.filename?.toLowerCase().includes(q);
  });

  const handleDownload = () => {
    downloadTablePDF(
      filtered,
      ['candidate_name', 'target_role', 'ats_score', 'owner_email', 'filename', 'created_at'],
      ['Candidate', 'Role', 'ATS Score', 'Owner', 'File', 'Submitted'],
      'Resume Submissions',
      'resumes'
    );
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title"><FileText size={16} /> All Resume Submissions ({resumes.length})</div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div className="admin-search-wrap">
            <Search size={14} />
            <input className="admin-search-input" placeholder="Search candidate, role, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button
            onClick={handleDownload}
            className="btn btn-secondary"
            id="download-resumes-btn"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', gap: '0.35rem', height: '36px' }}
            title="Download resume data as PDF"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>
      <div className="admin-card-body">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Candidate &amp; Target Role</th>
              <th>ATS Score</th>
              <th>Owner Account</th>
              <th>Filename</th>
              <th>Contact</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6"><div className="admin-empty"><FileText size={28} /><p>No resumes found.</p></div></td></tr>
            ) : filtered.map(r => {
              const score = r.ats_score || 0;
              const ss = scoreStyle(score);
              return (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{r.candidate_name || 'Unnamed'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#818cf8', fontWeight: 600 }}>{r.target_role || 'General'}</div>
                  </td>
                  <td>
                    <span className="score-pill" style={ss}>{score}%</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{r.owner_email}</td>
                  <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.filename}</td>
                  <td style={{ fontSize: '0.76rem' }}>
                    <div>{r.email || '—'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{r.phone || ''}</div>
                  </td>
                  <td style={{ fontSize: '0.76rem' }}>{fmtDateTime(r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Admin Page
// ──────────────────────────────────────────
export default function AdminPage({ user, onExit }) {
  const TOKEN_KEY = 'auracareer_session_token';
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [view, setView] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const timerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [o, u, a, r] = await Promise.all([
        fetch('/api/admin/overview', { headers }).then(r => r.json()),
        fetch('/api/admin/users', { headers }).then(r => r.json()),
        fetch('/api/admin/activities?limit=150', { headers }).then(r => r.json()),
        fetch('/api/admin/resumes?limit=150', { headers }).then(r => r.json()),
      ]);
      if (o.success) setOverview(o);
      if (u.success) setUsers(u.users || []);
      if (a.success) setActivities(a.activities || []);
      if (r.success) setResumes(r.resumes || []);
      setLastSync(new Date());
    } catch (e) {
      setError('Failed to load admin data. Ensure the backend is running and you have admin access.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchAll(true), 8000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, fetchAll]);

  const isAdmin = user && (
    user.role === 'admin' || user.is_admin || ADMIN_EMAILS.includes(user.email?.toLowerCase())
  );
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD';

  // Nav items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'activities', label: 'Live Activity Feed', icon: Activity, count: activities.length },
    { id: 'users', label: 'Users Directory', icon: Users, count: users.length },
    { id: 'resumes', label: 'Resume Inspector', icon: FileText, count: resumes.length },
  ];

  const viewTitles = {
    overview: { title: 'Platform Overview', sub: 'Real-time metrics across all users and features' },
    activities: { title: 'Live Activity Stream', sub: 'Every action users perform — tracked in real time' },
    users: { title: 'Users Directory', sub: 'View, inspect, and manage all registered accounts' },
    resumes: { title: 'Resume Inspector', sub: 'All uploaded and analyzed resume submissions' },
  };

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', flexDirection: 'column', gap: '1rem' }}>
        <Shield size={48} style={{ color: '#f43f5e' }} />
        <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have admin privileges.</p>
        <button className="btn btn-primary" onClick={onExit}>Return to App</button>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* ── Sidebar ───────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-icon">
              <Shield size={20} />
            </div>
            <div className="admin-sidebar-brand">
              AuraCareer
              <span>Admin Command Center</span>
            </div>
          </div>

          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">{initials}</div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name">{user?.full_name || 'Admin'}</div>
              <div className="admin-sidebar-user-role">⚡ Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">Dashboard</div>
          {navItems.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              className={`admin-nav-item ${view === id ? 'active' : ''}`}
              onClick={() => setView(id)}
              id={`admin-nav-${id}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {count !== undefined && (
                <span className="admin-nav-item-count">{count}</span>
              )}
            </button>
          ))}

          <div className="admin-nav-section-label" style={{ marginTop: '0.75rem' }}>System</div>
          <button
            className="admin-nav-item"
            onClick={() => {
              setAutoRefresh(v => !v);
            }}
            id="admin-nav-autosync"
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: autoRefresh ? '#10b981' : '#64748b', display: 'inline-block', boxShadow: autoRefresh ? '0 0 8px #10b981' : 'none', marginRight: 2 }} />
            <span>{autoRefresh ? 'Live Sync ON' : 'Live Sync OFF'}</span>
          </button>
          <button className="admin-nav-item" onClick={() => fetchAll()} id="admin-nav-refresh">
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
            <span>Refresh Now</span>
          </button>
          <button
            className="admin-nav-item"
            onClick={() => setShowSettingsModal(true)}
            id="admin-nav-settings"
          >
            <Settings size={17} />
            <span>Infrastructure &amp; AI</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item"
            onClick={onExit}
            id="admin-back-to-app"
            style={{ color: '#94a3b8', width: '100%' }}
          >
            <LogOut size={17} />
            <span>Back to App</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────── */}
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>{viewTitles[view]?.title}</h1>
            <p>{viewTitles[view]?.sub}</p>
          </div>
          <div className="admin-topbar-right">
            {/* Live sync pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.78rem', color: autoRefresh ? '#10b981' : 'var(--text-muted)',
              background: autoRefresh ? 'rgba(16,185,129,.08)' : 'var(--bg-tertiary)',
              border: `1px solid ${autoRefresh ? 'rgba(16,185,129,.25)' : 'var(--border-subtle)'}`,
              padding: '0.35rem 0.8rem', borderRadius: '999px'
            }}>
              {autoRefresh && <span className="admin-live-dot" style={{ width: 6, height: 6 }} />}
              <span>{autoRefresh ? 'Auto-sync every 8s' : 'Live sync paused'}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Last updated: {lastSync.toLocaleTimeString()}
            </span>
            {/* Export All as PDF */}
            <button
              className="btn btn-secondary"
              id="admin-download-all-btn"
              onClick={() => {
                downloadTablePDF(
                  users,
                  ['full_name', 'email', 'role', 'resumes_count', 'created_at'],
                  ['Name', 'Email', 'Role', 'Resumes', 'Joined'],
                  'Full Platform Export — Users',
                  'admin_users_export'
                );
              }}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem', height: '36px' }}
              title="Download all users as PDF"
            >
              <Download size={13} /> Export PDF
            </button>
            <button className="btn btn-secondary" onClick={() => fetchAll()} disabled={loading} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem', height: '36px' }}>
              <RefreshCw size={13} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn btn-primary" onClick={onExit} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', gap: '0.4rem', height: '36px' }}>
              <LogOut size={13} />
              Exit Admin
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            margin: '0.75rem 1.75rem 0',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: toast.type === 'success' ? 'rgba(16,185,129,.12)' : 'rgba(244,63,94,.12)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,.35)' : 'rgba(244,63,94,.35)'}`,
            color: toast.type === 'success' ? '#10b981' : '#f43f5e',
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ margin: '0.75rem 1.75rem 0', padding: '0.7rem 1rem', background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.35)', color: '#f43f5e', borderRadius: '10px', fontSize: '0.84rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* Content */}
        <div className="admin-content" key={view}>
          {loading && !overview ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border-subtle)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>Loading admin telemetry...</span>
            </div>
          ) : (
            <>
              {view === 'overview' && (
                <OverviewView metrics={overview?.metrics} users={users} activities={activities} resumes={resumes} />
              )}
              {view === 'activities' && (
                <ActivityView activities={activities} />
              )}
              {view === 'users' && (
                <UsersView users={users} currentUser={user} onDeleteSuccess={(msg) => { showToast(msg); fetchAll(true); }} />
              )}
              {view === 'resumes' && (
                <ResumesView resumes={resumes} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Infrastructure & AI Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onConfigUpdated={() => fetchAll(true)}
          authHeaders={() => headers}
        />
      )}
    </div>
  );
}
