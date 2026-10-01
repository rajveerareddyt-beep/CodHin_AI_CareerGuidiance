import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu } from 'lucide-react';

export default function SkillsRadarChart({ skillsData }) {
  const categorized = skillsData?.categorized || {};

  // Standard categories for the 6 radar axes
  const radarAxes = [
    { subject: 'Languages', key: 'Languages', benchmark: 8 },
    { subject: 'Frameworks', key: 'Frameworks', benchmark: 8 },
    { subject: 'Databases', key: 'Databases', benchmark: 5 },
    { subject: 'Cloud & DevOps', key: 'Cloud & DevOps', benchmark: 7 },
    { subject: 'AI & Data', key: 'AI & Data Science', benchmark: 6 },
    { subject: 'Tools / Soft', key: 'Tools & Concepts', benchmark: 8 }
  ];

  const chartData = radarAxes.map(axis => {
    const list = categorized[axis.key] || [];
    let count = list.length;
    // Add soft skills to tools if applicable
    if (axis.key === 'Tools & Concepts' && categorized['Soft Skills']) {
      count += categorized['Soft Skills'].length;
    }
    // Scale to a score out of 100
    const proficiency = Math.min(100, Math.round((count / axis.benchmark) * 100));

    return {
      subject: axis.subject,
      proficiency: proficiency,
      skillsCount: count,
      sampleSkills: list.slice(0, 3).join(', ')
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.85rem'
        }}>
          <p style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>{d.subject}</p>
          <p style={{ color: 'var(--text-primary)' }}>
            Detected: <strong>{d.skillsCount}</strong> skills ({d.proficiency}%)
          </p>
          {d.sampleSkills && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              e.g. {d.sampleSkills}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={20} className="text-cyan" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
            Skills Competency Radar
          </h3>
        </div>
        <span className="badge badge-cyan">
          {skillsData?.total_count || 0} Total Skills
        </span>
      </div>

      <div style={{ width: '100%', height: '270px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
            <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255, 255, 255, 0.15)" />
            <Radar
              name="Proficiency"
              dataKey="proficiency"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.4}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem', maxHeight: '60px', overflowY: 'auto' }}>
        {(skillsData?.all_skills || []).slice(0, 12).map((skill, i) => (
          <span key={i} className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
            {skill}
          </span>
        ))}
        {(skillsData?.all_skills || []).length > 12 && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            +{(skillsData?.all_skills || []).length - 12} more
          </span>
        )}
      </div>
    </div>
  );
}
