import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, AlertCircle, Copy, Check, Sparkles, HelpCircle, Loader2, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import JobTitleDropdown from './JobTitleDropdown';

export default function JobMatcher({ resumeData }) {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [jobTitle, setJobTitle] = useState('Senior Full-Stack Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);

  useEffect(() => {
    fetch('/api/job-match/presets')
      .then(res => res.json())
      .then(data => {
        setPresets(data);
        if (data.length > 0) {
          setSelectedPreset(data[0].title);
          setJobTitle(data[0].title);
          setJobDescription(data[0].description.trim());
        }
      })
      .catch(err => console.error('Error fetching presets:', err));
  }, []);

  const handleSelectPreset = (e) => {
    const title = e.target.value;
    setSelectedPreset(title);
    const found = presets.find(p => p.title === title);
    if (found) {
      setJobTitle(found.title);
      setJobDescription(found.description.trim());
    }
  };

  const handleRunMatch = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter or select a job description.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        resume_id: resumeData?.resume_id || resumeData?.id,
        job_title: jobTitle,
        job_description: jobDescription,
        resume_skills: resumeData?.skills?.all_skills || [],
        resume_text: resumeData?.full_text || ''
      };

      const res = await fetch('/api/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Job match failed');
      const data = await res.json();
      setMatchResult(data);
    } catch (err) {
      alert(`Error running match: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCoverLetter = () => {
    if (matchResult?.custom_cover_letter_snippet) {
      navigator.clipboard.writeText(matchResult.custom_cover_letter_snippet);
      setCopiedCover(true);
      setTimeout(() => setCopiedCover(false), 2000);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} className="text-cyan" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            Target Job Matcher & Skill Gap Radar
          </h3>
        </div>
        <span className="badge badge-cyan">
          ATS Relevancy Matcher
        </span>
      </div>

      {/* Select Preset or Custom Input */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Choose Industry Benchmark Preset:
          </label>
          <select
            value={selectedPreset}
            onChange={handleSelectPreset}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            {presets.map((p, idx) => (
              <option key={idx} value={p.title}>{p.title} ({p.company})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Job Title:
          </label>
          <JobTitleDropdown
            value={jobTitle}
            onChange={setJobTitle}
            placeholder="Select or search role..."
          />
        </div>
      </div>

      {/* Textarea for Job Description */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          Job Description (Paste any real posting or customize):
        </label>
        <textarea
          rows={5}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste requirements and responsibilities..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleRunMatch}
        disabled={isLoading}
        id="match-job-btn"
        style={{ marginBottom: '1.5rem' }}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Matching Against Requirements...
          </>
        ) : (
          <>
            <Sparkles size={16} /> Compute ATS Match & Missing Skills
          </>
        )}
      </button>

      {/* Match Results Display */}
      {matchResult && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          {/* Match Score & Verdict */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Relevance Match Score
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: matchResult.match_percentage >= 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {matchResult.match_percentage}%
                </span>
                <span className={`badge ${matchResult.match_percentage >= 70 ? 'badge-emerald' : 'badge-amber'}`}>
                  {matchResult.fit_verdict}
                </span>
              </div>
            </div>

            {/* Quick Skills Count Summary */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {matchResult.matched_skills?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matched Skills</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  {matchResult.missing_skills?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing Skills</div>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={16} />
                <span>Found in Resume ({matchResult.matched_skills?.length || 0})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(matchResult.matched_skills || []).map((s, idx) => (
                  <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={16} />
                <span>Missing Key ATS Keywords ({matchResult.missing_skills?.length || 0})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(matchResult.missing_skills || []).map((s, idx) => (
                  <span key={idx} className="badge badge-amber" style={{ fontSize: '0.8rem' }}>
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tailored Cover Letter Hook */}
          {matchResult.custom_cover_letter_snippet && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                  Tailored Cover Letter Opening Hook
                </span>
                <button
                  onClick={copyCoverLetter}
                  className="btn-secondary"
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem', borderRadius: 'var(--radius-sm)' }}
                >
                  {copiedCover ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                  <span>{copiedCover ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                "{matchResult.custom_cover_letter_snippet}"
              </p>
            </div>
          )}

          {/* Mock Interview Questions tailored to this job */}
          {matchResult.mock_interview_questions && matchResult.mock_interview_questions.length > 0 && (
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HelpCircle size={18} className="text-cyan" /> Tailored Mock Interview Questions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {matchResult.mock_interview_questions.map((q, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{q.type}</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{q.question}</span>
                    </div>
                    {q.model_answer_tip && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>
                        💡 <strong>Answer Strategy:</strong> {q.model_answer_tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
