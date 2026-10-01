import React, { useState, useEffect } from 'react';
import { Compass, Calendar, CheckSquare, Award, BookOpen, Loader2, Sparkles, ChevronRight } from 'lucide-react';

export default function CareerRoadmap({ resumeData }) {
  const [targetRole, setTargetRole] = useState(resumeData?.target_role || 'Senior Full-Stack Engineer');
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetch('/api/guidance/roles')
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(err => console.error('Error fetching roles:', err));
  }, []);

  const fetchRoadmap = async (roleToFetch) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/guidance/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: resumeData?.resume_id || resumeData?.id,
          target_role: roleToFetch || targetRole,
          current_skills: resumeData?.skills?.all_skills || []
        })
      });

      if (!res.ok) throw new Error('Failed to generate roadmap');
      const data = await res.json();
      setRoadmap(data);
    } catch (err) {
      alert(`Error loading roadmap: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(targetRole);
  }, [resumeData]);

  const handleRoleChange = (newRole) => {
    setTargetRole(newRole);
    fetchRoadmap(newRole);
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={20} className="text-indigo" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            Personalized Career Acceleration Roadmap
          </h3>
        </div>
        <span className="badge badge-indigo">
          Executive Growth Path
        </span>
      </div>

      {/* Target Role Selector Pills */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
          Explore Roadmap For Role:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRoleChange(r.title)}
              className="sample-pill"
              style={{
                background: targetRole === r.title ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                color: targetRole === r.title ? 'white' : 'var(--text-secondary)',
                borderColor: targetRole === r.title ? 'var(--accent-indigo)' : 'var(--border-subtle)'
              }}
            >
              <span>{r.title}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={36} className="animate-spin text-indigo" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <p>Synthesizing tailored skill progression and milestone projects...</p>
        </div>
      ) : roadmap ? (
        <div>
          {/* Header Assessment Card */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Role</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                {roadmap.target_role}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assessment</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {roadmap.current_level_assessment || 'Mid-Level Professional'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Timeline</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                  {roadmap.estimated_timeframe || '6 to 9 Months'}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
            {(roadmap.milestones || []).map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  borderLeft: `4px solid ${idx === 0 ? 'var(--accent-indigo)' : idx === 1 ? 'var(--accent-cyan)' : 'var(--accent-emerald)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {m.phase}
                  </h4>
                  <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                    <Calendar size={12} /> Milestone {idx + 1}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  <strong>Objective:</strong> {m.goal}
                </p>

                {/* Skills Pills */}
                {m.key_skills_to_learn && m.key_skills_to_learn.length > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Key Skills To Master:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {m.key_skills_to_learn.map((s, sIdx) => (
                        <span key={sIdx} className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {m.actionable_projects && (
                  <div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      High-Impact Portfolio Projects:
                    </span>
                    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                      {m.actionable_projects.map((p, pIdx) => (
                        <li key={pIdx} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                          <ChevronRight size={13} className="text-emerald" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Top Certifications & Reading */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {roadmap.top_certifications && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <Award size={18} />
                  <span>High-Value Certifications</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {roadmap.top_certifications.map((cert, idx) => (
                    <div key={idx} style={{ fontSize: '0.86rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cert.name}</span>
                      <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{cert.difficulty || 'Intermediate'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roadmap.recommended_reading && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-indigo)', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <BookOpen size={18} />
                  <span>Recommended Reading</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {roadmap.recommended_reading.map((book, idx) => (
                    <li key={idx} style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--accent-indigo)' }}>•</span> {book}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
