import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, X, LogIn, UserPlus, AlertCircle, CheckCircle2, ArrowRight, FileText, Shield, ChevronRight } from 'lucide-react';

/** ─── AuthModal ────────────────────────────────────────────────────────────
 *  A full-screen glassmorphism overlay for Login / Register.
 *  Props:
 *    isOpen       (bool)   – controls visibility
 *    onClose      (fn)     – called when user closes without logging in
 *    onAuthSuccess(fn)     – called with (token, userObj) on success
 */
export default function AuthModal({ isOpen, onClose, onAuthSuccess, required = false }) {
  const [mode, setMode]         = useState('login');  // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd]               = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [agreedToTerms, setAgreedToTerms]   = useState(false);
  const [showTerms, setShowTerms]           = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const emailRef = useRef(null);

  // Reset form state on modal open/close only (preserves user inputs when switching modes)
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setTimeout(() => emailRef.current?.focus(), 100);
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreedToTerms(false);
      setShowTerms(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (mode === 'register' && fullName.trim().length < 2) {
      return setError('Please enter your full name.');
    }
    if (!email.includes('@')) return setError('Please enter a valid email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (mode === 'register' && password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (mode === 'register' && !agreedToTerms) {
      return setError('You must agree to the Terms and Conditions.');
    }

    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email, password }
      : { email, password, full_name: fullName.trim() || email.split('@')[0] };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Authentication failed. Please try again.');
      } else {
        setSuccess(data.message || 'Authenticated successfully!');
        setTimeout(() => onAuthSuccess(data.token, data.user), 800);
      }
    } catch (err) {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError(''); setSuccess('');
  };

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Sign in to AuraCareer">
      {/* Blurred backdrop */}
      <div className="auth-backdrop" onClick={required ? undefined : onClose} />

      <div className="auth-card">
        {/* Close button (hidden when sign-in is required) */}
        {!required && (
          <button className="auth-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        )}

        {/* Brand identity */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="auth-brand-name">AuraCareer</h1>
            <p className="auth-brand-sub">Career Guidance &amp; Resume Intelligence</p>
          </div>
        </div>

        {/* Mode title */}
        <div className="auth-titles">
          <h2 className="auth-heading">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-subheading">
            {mode === 'login'
              ? 'Sign in to access your personalized career dashboard'
              : 'Join AuraCareer to save your resumes and career progress'}
          </p>
        </div>

        {/* Mode toggle tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            id="auth-tab-login"
            type="button"
          >
            <LogIn size={15} /> Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            id="auth-tab-register"
            type="button"
          >
            <UserPlus size={15} /> Create Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <span>{error}</span>
              {mode === 'login' && error.toLowerCase().includes('create account') && (
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '0.4rem',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'inherit',
                    fontSize: '0.84rem'
                  }}
                >
                  Click here to switch to Create Account →
                </button>
              )}
            </div>
          </div>
        )}
        {success && (
          <div className="auth-alert auth-alert-success" role="alert">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-full-name">Full Name</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  id="auth-full-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="auth-email"
                ref={emailRef}
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">
              Password
              {mode === 'register' && (
                <span style={{ opacity: 0.55, fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                  (min 6 characters)
                </span>
              )}
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPwd ? 'text' : 'password'}
                placeholder={mode === 'login' ? '••••••••' : 'Choose a strong password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={loading}
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPwd(s => !s)}
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowConfirmPwd(s => !s)}
                  tabIndex={-1}
                  aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          {/* Terms and Conditions checkbox (register only) */}
          {mode === 'register' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="auth-agree-terms"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                style={{
                  marginTop: '3px',
                  accentColor: 'var(--accent-indigo)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <label
                htmlFor="auth-agree-terms"
                style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, cursor: 'pointer' }}
              >
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent-indigo)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px'
                  }}
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            id="auth-submit-btn"
            disabled={loading || (mode === 'register' && !agreedToTerms)}
            style={{
              ...(mode === 'register' && !agreedToTerms ? { opacity: 0.5, cursor: 'not-allowed' } : {})
            }}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                {mode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}
                <span>{mode === 'login' ? 'Sign In to AuraCareer' : 'Create My Account'}</span>
                <ArrowRight size={16} className="auth-arrow" />
              </>
            )}
          </button>
        </form>

        {/* Guest continue option (hidden when sign-in is required) */}
        {!required && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button
              className="auth-guest"
              onClick={onClose}
              id="auth-continue-guest"
            >
              Continue as Guest <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>(data not saved to your account)</span>
            </button>
          </>
        )}

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button onClick={switchMode} className="auth-switch-link">
            {mode === 'login' ? 'Create one free →' : 'Sign in →'}
          </button>
        </p>
      </div>

      {/* ── Terms and Conditions Modal ─────────────────────────── */}
      {showTerms && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowTerms(false)}
          />
          <div
            style={{
              position: 'relative',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={18} style={{ color: 'var(--accent-indigo)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Terms and Conditions
                </h3>
              </div>
              <button
                onClick={() => setShowTerms(false)}
                style={{
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Close terms"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                overflowY: 'auto',
                fontSize: '0.84rem',
                lineHeight: 1.65,
                color: 'var(--text-secondary)'
              }}
            >
              <p style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                By creating an account on AuraCareer, you acknowledge and agree to the following terms:
              </p>

              <div style={{
                background: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  ⚠ Password Responsibility Disclaimer
                </p>
                <p style={{ margin: 0 }}>
                  If you forget your password, <strong style={{ color: 'var(--text-primary)' }}>AuraCareer is not responsible</strong> for
                  account recovery. You <strong style={{ color: 'var(--text-primary)' }}>cannot create a new password or reset your
                  existing password</strong>. Please store your credentials securely. We strongly recommend using a
                  password manager.
                </p>
              </div>

              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Account Security:</strong> You are solely responsible
                  for maintaining the confidentiality of your account credentials. Any activity under your account
                  is your responsibility.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Acceptable Use:</strong> You agree to use AuraCareer
                  only for lawful purposes related to career development, resume analysis, and job preparation.
                  Any misuse, abuse, or unauthorized access attempts are strictly prohibited.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Data Privacy:</strong> Your uploaded resumes and
                  personal information are processed to provide career analysis services. We do not sell your
                  personal data to third parties. Data may be stored securely for service improvement.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>AI-Generated Content:</strong> Career advice,
                  resume critiques, and recommendations provided by AuraCareer are AI-generated and should be
                  used as guidance only. We do not guarantee employment outcomes or accuracy of all suggestions.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Service Availability:</strong> AuraCareer is
                  provided "as is" without warranty. We reserve the right to modify, suspend, or discontinue
                  the service at any time without prior notice.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Intellectual Property:</strong> All content,
                  design, and technology on AuraCareer are the property of AuraCareer. You retain ownership
                  of your uploaded documents.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Account Termination:</strong> We reserve the
                  right to suspend or terminate accounts that violate these terms or engage in abusive behavior.
                </li>
              </ol>

              <p style={{ marginTop: '1rem', fontSize: '0.78rem', opacity: 0.65 }}>
                Last updated: September 2026. By proceeding with account creation, you confirm that you have
                read, understood, and agree to these terms.
              </p>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.6rem'
              }}
            >
              <button
                onClick={() => setShowTerms(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-hover)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Close
              </button>
              <button
                onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                style={{
                  padding: '0.5rem 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--accent-indigo)',
                  color: '#fff',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CheckCircle2 size={15} /> I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
