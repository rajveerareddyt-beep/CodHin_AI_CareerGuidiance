import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function ScoreBreakdownChart({ breakdown }) {
  if (!breakdown) return null;

  const data = [
    {
      category: 'Role Alignment',
      score: breakdown.role_alignment?.score ?? 0,
      max: breakdown.role_alignment?.max || 25,
      color: '#06b6d4' // Cyan
    },
    {
      category: 'Skill Breadth',
      score: breakdown.skills_and_density?.score || 0,
      max: breakdown.skills_and_density?.max || 15,
      color: '#6366f1' // Indigo
    },
    {
      category: 'Action Verbs',
      score: breakdown.action_verbs?.score || 0,
      max: breakdown.action_verbs?.max || 20,
      color: '#8b5cf6' // Violet
    },
    {
      category: 'Quant Metrics',
      score: breakdown.metrics?.score || 0,
      max: breakdown.metrics?.max || 20,
      color: '#10b981' // Emerald
    },
    {
      category: 'ATS Format',
      score: breakdown.formatting_compliance?.score || (breakdown.contact_info?.score || 0) + (breakdown.sections?.score || 0),
      max: breakdown.formatting_compliance?.max || 20,
      color: '#f59e0b' // Amber
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = Math.round((d.score / d.max) * 100);
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.85rem'
        }}>
          <p style={{ fontWeight: 700, color: d.color, marginBottom: '0.2rem' }}>{d.category}</p>
          <p style={{ color: 'var(--text-primary)' }}>
            Score: <strong>{d.score}</strong> / {d.max} pts ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <BarChart3 size={20} className="text-indigo" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
          ATS Pillar Breakdown
        </h3>
      </div>

      <div style={{ width: '100%', height: '270px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" domain={[0, 25]} stroke="var(--text-muted)" fontSize={12} />
            <YAxis type="category" dataKey="category" stroke="var(--text-secondary)" fontSize={12} width={105} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
        Weighted according to Fortune 500 ATS scanning algorithms
      </p>
    </div>
  );
}
