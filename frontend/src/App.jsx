import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import UploadZone from './components/UploadZone';
import ATSScoreCard from './components/ATSScoreCard';
import ScoreBreakdownChart from './components/ScoreBreakdownChart';
import SkillsRadarChart from './components/SkillsRadarChart';
import ExecutiveCritique from './components/ExecutiveCritique';
import STARBulletRewriter from './components/STARBulletRewriter';
import ComplianceChecklist from './components/ComplianceChecklist';
import JobMatcher from './components/JobMatcher';
import CareerRoadmap from './components/CareerRoadmap';
import CareerChatbot from './components/CareerChatbot';
import SettingsModal from './components/SettingsModal';
import AdminPage from './pages/AdminPage';
import { useAuth } from './hooks/useAuth';
import { downloadAnalysisPDF } from './utils/pdfExport';
import {
  BarChart2,
  Edit3,
  ShieldCheck,
  Target,
  Compass,
  MessageSquare,
  ArrowLeft,
  Printer,
  Download
} from 'lucide-react';

const ADMIN_EMAILS = [
  'a05370457@gmail.com',
  'rajveerereddyt@gmal.com',
  'rajveerereddyt@gmail.com'
];

export default function App() {
  const { user, isLoggedIn, saveSession, clearSession, authHeaders } = useAuth();

  const [theme, setTheme]                   = useState('dark');
  const [isSettingsOpen, setIsSettingsOpen]  = useState(false);
  const [showAdminPage, setShowAdminPage]    = useState(false);
  const [isAuthOpen, setIsAuthOpen]          = useState(false);
  const [dbStatus, setDbStatus]              = useState(null);
  const [resumeData, setResumeData]          = useState(null);
  const [isAnalyzing, setIsAnalyzing]        = useState(false);
  const [activeTab, setActiveTab]            = useState('overview');

  // If admin navigates away, close admin page and settings modal
  const isAdmin = user && (user.role === 'admin' || user.is_admin || ADMIN_EMAILS.includes(user.email?.toLowerCase()));
  useEffect(() => {
    if (!isAdmin) {
      setShowAdminPage(false);
      setIsSettingsOpen(false);
    }
  }, [isAdmin]);

  // ── Fetch system status ─────────────────────────────────────────────────
  const fetchSystemStatus = () => {
    fetch('/api/settings/status')
      .then(res => res.json())
      .then(data => setDbStatus(data.database))
      .catch(err => console.error('Error fetching DB status:', err));
  };

  useEffect(() => {
    fetchSystemStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Theme ───────────────────────────────────────────────────────────────
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // ── Auth callbacks ──────────────────────────────────────────────────────
  const handleAuthSuccess = (token, userObj) => {
    saveSession(token, userObj);
    setIsAuthOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders()
      });
    } catch (_) { /* ignore */ }
    clearSession();
    setResumeData(null);
    setShowAdminPage(false);
  };

  // ── Download Analysis Report as PDF ────────────────────────────────────
  const downloadAnalysisReport = () => downloadAnalysisPDF(resumeData);

  // ── Full-screen Admin Page ───────────────────────────────────────────────
  if (showAdminPage && isAdmin) {
    return <AdminPage user={user} onExit={() => setShowAdminPage(false)} />;
  }

  // ── Landing: show Sign-In page if not logged in ─────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="app-layout">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
          required={true}
        />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ── Top Navigation ─────────────────────────────────────── */}
      <Header
        dbStatus={dbStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => { if (isAdmin) setIsSettingsOpen(true); }}
        onOpenAdmin={() => setShowAdminPage(true)}
        onNewScan={() => {
          setResumeData(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        isLoggedIn={isLoggedIn}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="container">
        {/* ── Upload / Landing ──────────────────────────────────── */}
        {!resumeData && (
          <UploadZone
            onAnalyzeComplete={(data) => {
              setResumeData(data);
              setActiveTab('overview');
            }}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            authHeaders={authHeaders}
          />
        )}

        {/* ── Analyzed Resume Dashboard ─────────────────────────── */}
        {resumeData && (
          <div>
            {/* Top action bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                onClick={() => setResumeData(null)}
                className="btn btn-secondary"
                id="back-to-upload-btn"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              >
                <ArrowLeft size={15} /> Upload / Choose Another Resume
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={downloadAnalysisReport}
                  className="btn btn-secondary"
                  id="download-report-btn"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  title="Download analysis as JSON"
                >
                  <Download size={15} /> Download Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  id="print-report-btn"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                >
                  <Printer size={15} /> Print / Export Report
                </button>
              </div>
            </div>

            {/* ATS Score Hero */}
            <ATSScoreCard resumeData={resumeData} />

            {/* Tab navigation */}
            <div className="tabs-container">
              {[
                { key: 'overview',  label: 'Overview & Visuals',       Icon: BarChart2 },
                { key: 'rewrites',  label: 'STAR Bullet Rewriter',     Icon: Edit3 },
                { key: 'checklist', label: 'ATS Compliance Checklist', Icon: ShieldCheck },
                { key: 'matcher',   label: 'Job Match & Skill Gap',    Icon: Target },
                { key: 'roadmap',   label: 'Career Roadmap',           Icon: Compass },
                { key: 'chat',      label: 'AI Career Counselor',      Icon: MessageSquare },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                  id={`tab-${key}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <ScoreBreakdownChart breakdown={resumeData.ats_results?.breakdown} />
                  <SkillsRadarChart skillsData={resumeData.skills} />
                </div>
                <ExecutiveCritique aiCritique={resumeData.ai_critique} targetRole={resumeData.target_role} />
              </div>
            )}

            {activeTab === 'rewrites' && (
              <STARBulletRewriter bulletRewrites={resumeData.ai_critique?.bullet_rewrites} />
            )}

            {activeTab === 'checklist' && (
              <ComplianceChecklist checklist={resumeData.ats_results?.checklist} />
            )}

            {activeTab === 'matcher' && (
              <JobMatcher resumeData={resumeData} authHeaders={authHeaders} />
            )}

            {activeTab === 'roadmap' && (
              <CareerRoadmap resumeData={resumeData} authHeaders={authHeaders} />
            )}

            {activeTab === 'chat' && (
              <CareerChatbot resumeData={resumeData} authHeaders={authHeaders} />
            )}
          </div>
        )}
      </main>

      {/* ── Auth Modal ───────────────────────────────────────────── */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* ── Settings Modal (Admin Only) ─────────────────────────── */}
      {isAdmin && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onConfigUpdated={fetchSystemStatus}
          authHeaders={authHeaders}
        />
      )}
    </div>
  );
}
