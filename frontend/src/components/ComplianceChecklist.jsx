import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ListFilter, Shield } from 'lucide-react';

export default function ComplianceChecklist({ checklist }) {
  const [activeFilter, setActiveFilter] = useState('all');

  if (!checklist) return null;

  const passed = checklist.passed || [];
  const warnings = checklist.warnings || [];
  const critical = checklist.critical || [];

  let displayed = [];
  if (activeFilter === 'all') {
    displayed = [...critical, ...warnings, ...passed];
  } else if (activeFilter === 'critical') {
    displayed = critical;
  } else if (activeFilter === 'warnings') {
    displayed = warnings;
  } else if (activeFilter === 'passed') {
    displayed = passed;
  }

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} className="text-emerald" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            ATS Compliance & Audit Checklist
          </h3>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveFilter('all')}
            className={`sample-pill ${activeFilter === 'all' ? 'active' : ''}`}
            style={{
              background: activeFilter === 'all' ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
              color: activeFilter === 'all' ? 'white' : 'var(--text-secondary)'
            }}
          >
            All ({passed.length + warnings.length + critical.length})
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className="sample-pill"
            style={{
              background: activeFilter === 'critical' ? 'var(--accent-rose)' : 'var(--bg-secondary)',
              color: activeFilter === 'critical' ? 'white' : 'var(--text-secondary)'
            }}
          >
            Critical ({critical.length})
          </button>
          <button
            onClick={() => setActiveFilter('warnings')}
            className="sample-pill"
            style={{
              background: activeFilter === 'warnings' ? 'var(--accent-amber)' : 'var(--bg-secondary)',
              color: activeFilter === 'warnings' ? 'white' : 'var(--text-secondary)'
            }}
          >
            Warnings ({warnings.length})
          </button>
          <button
            onClick={() => setActiveFilter('passed')}
            className="sample-pill"
            style={{
              background: activeFilter === 'passed' ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
              color: activeFilter === 'passed' ? 'white' : 'var(--text-secondary)'
            }}
          >
            Passed ({passed.length})
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No checks matching this category.
          </div>
        ) : (
          displayed.map((item, idx) => {
            const isPass = item.status === 'pass';
            const isCritical = item.status === 'critical';
            const isWarning = item.status === 'warning';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'background 0.2s ease'
                }}
              >
                {isPass && <CheckCircle2 size={18} className="text-emerald" style={{ flexShrink: 0 }} />}
                {isWarning && <AlertTriangle size={18} className="text-amber" style={{ flexShrink: 0 }} />}
                {isCritical && <XCircle size={18} className="text-rose" style={{ flexShrink: 0 }} />}

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    <span className={`badge ${isPass ? 'badge-emerald' : isWarning ? 'badge-amber' : 'badge-rose'}`} style={{ fontSize: '0.68rem' }}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {item.msg}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
