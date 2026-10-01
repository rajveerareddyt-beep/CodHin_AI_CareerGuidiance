import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Database, Settings, Sun, Moon, FileText,
  LogIn, LogOut, User, ChevronDown, History, Shield
} from 'lucide-react';

const ADMIN_EMAILS = [
  'a05370457@gmail.com',
  'rajveerereddyt@gmal.com',
  'rajveerereddyt@gmail.com'
];

export default function Header({
  dbStatus, theme, onToggleTheme, onOpenSettings, onNewScan,
  user, isLoggedIn, onOpenAuth, onLogout, onOpenAdmin
}) {
  const isMySQL = dbStatus?.active_db === 'mysql';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = user && (
    user.role === 'admin' ||
    user.is_admin ||
    ADMIN_EMAILS.includes(user.email?.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="app-header">
      {/* Brand */}
      <div className="brand-logo">
        <div className="brand-icon-box">
          <FileText size={17} />
        </div>
        <span style={{ fontWeight: 600, fontSize: '1.05rem', letterSpacing: '-0.015em' }}>AuraCareer</span>
      </div>

      <div className="nav-actions">
        {/* DB Status Badge (Admin Only) */}
        {isAdmin && (
          <div
            className="status-badge"
            title={isMySQL ? 'Connected to MySQL Database' : `Using SQLite (${dbStatus?.notice || 'Local Fallback'})`}
            id="db-status-badge"
          >
            <Database size={13} className={isMySQL ? 'text-emerald' : 'text-amber'} />
            <span className={`status-dot ${isMySQL ? 'online' : 'warning'}`} />
            <span>{isMySQL ? 'MySQL 8.0' : 'SQLite'}</span>
          </div>
        )}

        {/* Admin Dashboard Quick Button */}
        {isAdmin && (
          <button
            className="btn btn-secondary"
            onClick={onOpenAdmin}
            id="nav-admin-center-btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              gap: '0.45rem'
            }}
            title="Open Admin Dashboard"
          >
            <Shield size={14} />
            <span>Admin Dashboard</span>
          </button>
        )}

        {/* New Scan Button */}
        <button
          className="btn btn-secondary"
          onClick={onNewScan}
          id="nav-new-scan-btn"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
        >
          <FileText size={15} />
          <span>Analyze Resume</span>
        </button>

        {/* Theme Toggle */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings (Admin Only) */}
        {isAdmin && (
          <button
            className="btn-icon"
            onClick={onOpenSettings}
            title="System Settings (MySQL & AI API Keys)"
            id="open-settings-btn"
          >
            <Settings size={18} />
          </button>
        )}

        {/* ── Auth Section ─────────────────────────── */}
        {!isLoggedIn ? (
          <button
            className="btn btn-primary"
            onClick={onOpenAuth}
            id="nav-sign-in-btn"
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="user-menu-wrap" ref={menuRef}>
            <button
              className="user-avatar-btn"
              onClick={() => setMenuOpen(o => !o)}
              id="user-avatar-btn"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="user-avatar">
                {initials}
              </div>
              <span className="user-name">{user?.full_name?.split(' ')[0]}</span>
              {isAdmin && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.04em'
                  }}
                >
                  ADMIN
                </span>
              )}
              <ChevronDown size={14} className={`user-chevron ${menuOpen ? 'open' : ''}`} />
            </button>

            {menuOpen && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-header">
                  <div className="user-avatar user-avatar-lg">
                    {initials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <p className="user-dropdown-name">{user?.full_name}</p>
                      {isAdmin && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="user-dropdown-email">{user?.email}</p>
                  </div>
                </div>

                <div className="user-dropdown-divider" />

                {isAdmin && (
                  <>
                    <button
                      className="user-dropdown-item"
                      onClick={() => { setMenuOpen(false); onOpenAdmin(); }}
                      id="dropdown-admin-center"
                      style={{ color: '#a855f7', fontWeight: 600 }}
                    >
                      <Shield size={15} /> Admin Dashboard
                    </button>
                    <button
                      className="user-dropdown-item"
                      onClick={() => { setMenuOpen(false); onOpenSettings(); }}
                      id="dropdown-admin-settings"
                      style={{ color: '#818cf8', fontWeight: 500 }}
                    >
                      <Settings size={15} /> Infrastructure &amp; AI Settings
                    </button>
                    <div className="user-dropdown-divider" />
                  </>
                )}

                <button
                  className="user-dropdown-item"
                  onClick={() => { setMenuOpen(false); onNewScan(); }}
                  id="dropdown-new-scan"
                >
                  <FileText size={15} /> New Analysis
                </button>

                <div className="user-dropdown-divider" />

                <button
                  className="user-dropdown-item user-dropdown-item-danger"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  id="dropdown-logout-btn"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

