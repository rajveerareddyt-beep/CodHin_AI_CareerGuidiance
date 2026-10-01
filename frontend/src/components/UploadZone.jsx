import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Sparkles, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import JobTitleDropdown from './JobTitleDropdown';

export default function UploadZone({ onAnalyzeComplete, isAnalyzing, setIsAnalyzing }) {
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer');
  const [dragActive, setDragActive] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.txt', '.rtf', '.md'];

  const handleFileUpload = async (file) => {
    const isAllowed = ALLOWED_EXTS.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      alert('Please upload a supported file (PDF, Word .docx/.doc, PowerPoint .pptx/.ppt, Images .jpg/.png, or Text).');
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    let initialStep = 'Extracting document text and layout structure...';
    if (ext === 'pdf') initialStep = 'Extracting PDF text and document structure with PyMuPDF...';
    else if (['docx', 'doc'].includes(ext)) initialStep = 'Extracting sections, headings & tables from Word document...';
    else if (['pptx', 'ppt'].includes(ext)) initialStep = 'Extracting slides and content from PowerPoint presentation...';
    else if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext)) initialStep = 'Processing resume image with Vision & OCR engine...';

    setIsAnalyzing(true);
    setParsingStep(initialStep);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_role', targetRole);

      setTimeout(() => {
        setParsingStep('Running Python rule-based ATS evaluation (metrics, action verbs, density)...');
      }, 800);

      setTimeout(() => {
        setParsingStep('Generating Executive AI critique, STAR bullet rewrites & milestones...');
      }, 1600);

      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      onAnalyzeComplete(data);
    } catch (err) {
      alert(`Error analyzing resume: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      setParsingStep('');
    }
  };

  const loadSample = async (sampleKey, roleName) => {
    setTargetRole(roleName);
    setIsAnalyzing(true);
    setParsingStep('Loading sample resume with multi-format parsing...');

    try {
      setTimeout(() => {
        setParsingStep('Evaluating ATS rules & scoring compliance...');
      }, 600);
      setTimeout(() => {
        setParsingStep('Synthesizing AI executive guidance & career roadmap...');
      }, 1200);

      const res = await fetch(`/api/resumes/sample/${sampleKey}`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Sample load failed');
      }

      const data = await res.json();
      onAnalyzeComplete(data);
    } catch (err) {
      alert(`Error loading sample: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      setParsingStep('');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2.5rem 2rem', marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2rem auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Resume Analysis &amp; ATS Scoring
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.55 }}>
          Upload your resume to benchmark ATS keyword alignment, format compliance, and role suitability.
        </p>
      </div>

      {/* Target Role Dropdown & Autocomplete Search */}
      <div style={{ maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
        <label 
          htmlFor="target-role-input"
          style={{ 
            display: 'block',
            fontSize: '0.82rem', 
            fontWeight: 500, 
            color: 'var(--text-secondary)', 
            marginBottom: '0.4rem' 
          }}
        >
          Target Job Title
        </label>
        <JobTitleDropdown
          value={targetRole}
          onChange={setTargetRole}
          placeholder="e.g. Senior Full-Stack Engineer, Product Manager, Data Scientist..."
        />
      </div>

      {/* Dropzone Hero */}
      <div
        className={`upload-hero ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="resume-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.txt,.rtf,.md"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          id="resume-file-input"
        />

        {isAnalyzing ? (
          <div style={{ padding: '1.75rem 0' }}>
            <Loader2 size={36} className="text-secondary animate-spin" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>Analyzing Resume</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', fontWeight: 400 }}>
              {parsingStep || 'Evaluating document and ATS models...'}
            </p>
          </div>
        ) : (
          <>
            <div className="upload-icon-circle">
              <UploadCloud size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              Drop your resume here, or click to browse
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
              PDF, Word (.docx), PowerPoint (.pptx), Images, or Text
            </p>
            <button className="btn btn-primary" type="button" id="browse-files-btn">
              <FileText size={15} /> Select Document
            </button>
          </>
        )}
      </div>

      {/* Sample Resumes Bar */}
      <div className="samples-bar">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Or try a sample:
        </span>
        <button
          className="sample-pill"
          onClick={() => loadSample('fullstack', 'Senior Full-Stack Engineer')}
          id="sample-fullstack-btn"
        >
          Senior Full-Stack
        </button>
        <button
          className="sample-pill"
          onClick={() => loadSample('junior_frontend', 'Frontend Developer')}
          id="sample-frontend-btn"
        >
          Frontend Developer
        </button>
        <button
          className="sample-pill"
          onClick={() => loadSample('aiml', 'AI & Machine Learning Engineer')}
          id="sample-aiml-btn"
        >
          AI / Machine Learning
        </button>
      </div>
    </div>
  );
}
