import React, { useState } from 'react';
import { Edit3, ArrowRight, Copy, Check, Sparkles, Zap } from 'lucide-react';

export default function STARBulletRewriter({ bulletRewrites }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!bulletRewrites || bulletRewrites.length === 0) return null;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit3 size={20} className="text-indigo" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            STAR-Method Bullet Point Optimizer
          </h3>
        </div>
        <span className="badge badge-indigo">
          <Zap size={13} /> Action Verb + Metric Formula
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Compare passive duty descriptions with executive high-impact rewrites engineered to pass ATS filters and impress hiring managers:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {bulletRewrites.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            {/* Original vs Rewritten Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.2fr', gap: '1rem', alignItems: 'center' }}>
              {/* Original */}
              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Original / Weak Phrasing
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{item.original}"
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={20} />
              </div>

              {/* Rewritten */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                    STAR High-Impact Rewrite
                  </span>
                  <button
                    onClick={() => handleCopy(item.rewritten, idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedIndex === idx ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                    title="Copy to clipboard"
                  >
                    {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  • {item.rewritten}
                </div>
              </div>
            </div>

            {/* Rationale */}
            {item.rationale && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.65rem' }}>
                <Sparkles size={14} className="text-amber" />
                <span><strong>Impact Rationale:</strong> {item.rationale}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
