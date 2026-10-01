import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertCircle, Award, FileText, Mail, Phone, Globe, Briefcase } from 'lucide-react';

export default function ATSScoreCard({ resumeData }) {
  if (!resumeData) return null;

  const ats = resumeData.ats_results || {};
  const score = ats.overall_score || 0;
  const tier = ats.tier || "Evaluation Complete";
  const color = ats.color || "#6366f1";
  const contacts = resumeData.contact_info || {};
  const metadata = resumeData.metadata || {};

  // Donut chart data for score dial
  const chartData = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: Math.max(0, 100 - score) }
  ];

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      {/* Top Candidate Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800 }}>
              {resumeData.candidate_name || contacts.name || "Candidate"}
            </h2>
            <span className="badge badge-indigo">
              <Briefcase size={12} /> {resumeData.target_role || "Target Role"}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            {contacts.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} className="text-cyan" /> {contacts.email}
              </span>
            )}
            {contacts.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} className="text-emerald" /> {contacts.phone}
              </span>
            )}
            {contacts.linkedin && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Globe size={14} className="text-indigo" /> {contacts.linkedin}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Document</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {resumeData.filename || "Resume.pdf"}
          </span>
        </div>
      </div>

      {/* Score and Quick Metrics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'center' }}>
        {/* Donut Score Gauge */}
        <div style={{ position: 'relative', width: '240px', height: '200px', margin: '0 auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                startAngle={220}
                endAngle={-40}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell fill={color} />
                <Cell fill="rgba(255, 255, 255, 0.08)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Score Label */}
          <div style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--text-primary)' }}>
              {score}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ATS Score
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '-0.75rem' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: color,
                background: `${color}18`,
                border: `1px solid ${color}35`,
                padding: '0.2rem 0.75rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {tier}
            </span>
          </div>
        </div>

        {/* 4 Key Stat Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-indigo)', marginBottom: '0.35rem' }}>
              <Award size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Power Action Verbs</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {ats.breakdown?.action_verbs?.strong_verbs_count || 0}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>detected</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Quantifiable Metrics</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {ats.breakdown?.metrics?.metrics_count || 0}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>measures</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              <FileText size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Technical Skills</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {resumeData.skills?.total_count || 0}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>keywords</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Word Density</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {metadata.word_count || 0}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>words ({metadata.page_count || 1}p)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
