import React from 'react';
import { Sparkles, CheckCircle, AlertTriangle, DollarSign, Target, TrendingUp } from 'lucide-react';

export default function ExecutiveCritique({ aiCritique, targetRole }) {
  if (!aiCritique) return null;

  const summary = aiCritique.executive_summary;
  const strengths = aiCritique.key_strengths || [];
  const improvements = aiCritique.critical_improvements || [];
  const salary = aiCritique.salary_insight;
  const readiness = aiCritique.interview_readiness;

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} className="text-indigo" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            Executive AI Assessment & Market Positioning
          </h3>
        </div>
        <span className="badge badge-emerald">
          <TrendingUp size={13} /> Powered by AI Strategy Engine
        </span>
      </div>

      {/* Summary Paragraph */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderLeft: '4px solid var(--accent-indigo)',
        padding: '1.15rem 1.25rem',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        marginBottom: '1.5rem',
        fontSize: '0.96rem',
        lineHeight: 1.65,
        color: 'var(--text-primary)'
      }}>
        {summary}
      </div>

      {/* Strengths & Improvements 2-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Strengths */}
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={18} />
            <span>Core Competitive Strengths</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {strengths.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                <span style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} />
            <span>High-Priority Refinements</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {improvements.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                <span style={{ color: 'var(--accent-amber)', marginTop: '2px' }}>!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Info: Salary & Readiness */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {salary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.15rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Salary Benchmark</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{salary}</div>
            </div>
          </div>
        )}

        {readiness && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.15rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Interview Readiness</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{readiness}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
