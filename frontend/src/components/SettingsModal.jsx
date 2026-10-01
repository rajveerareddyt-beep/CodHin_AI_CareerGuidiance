import React, { useState, useEffect } from 'react';
import { X, Database, Key, CheckCircle, AlertCircle, Loader2, Sparkles, Server } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onConfigUpdated, authHeaders }) {
  const [activeTab, setActiveTab] = useState('database');

  // MySQL form state
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlUser, setMysqlUser] = useState('root');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [mysqlDb, setMysqlDb] = useState('career_ai');
  const [dbLoading, setDbLoading] = useState(false);
  const [dbResult, setDbResult] = useState(null);

  // LLM form state
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResult, setLlmResult] = useState(null);

  // Current system status
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const headers = authHeaders ? authHeaders() : {};
      fetch('/api/settings/status', { headers })
        .then(res => res.json())
        .then(data => {
          setSystemStatus(data);
          if (data.database) {
            setMysqlHost(data.database.mysql_host || 'localhost');
            setMysqlPort(data.database.mysql_port || 3306);
            setMysqlUser(data.database.mysql_user || 'root');
            setMysqlDb(data.database.mysql_db || 'career_ai');
          }
          if (data.llm) {
            setLlmProvider(data.llm.provider || 'gemini');
            setModel(data.llm.active_model || 'gemini-1.5-flash');
          }
        })
        .catch(err => console.error('Failed to fetch status:', err));
    }
  }, [isOpen, authHeaders]);

  if (!isOpen) return null;

  const handleSaveDatabase = async (e) => {
    e.preventDefault();
    setDbLoading(true);
    setDbResult(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authHeaders) Object.assign(headers, authHeaders());

      const res = await fetch('/api/settings/database', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          host: mysqlHost,
          port: parseInt(mysqlPort),
          user: mysqlUser,
          password: mysqlPassword,
          database: mysqlDb
        })
      });

      const data = await res.json();
      setDbResult(data);
      if (data.success && onConfigUpdated) {
        onConfigUpdated();
      }
    } catch (err) {
      setDbResult({ success: false, message: err.message });
    } finally {
      setDbLoading(false);
    }
  };

  const handleSaveLLM = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      alert('Please enter an API key to test.');
      return;
    }
    setLlmLoading(true);
    setLlmResult(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authHeaders) Object.assign(headers, authHeaders());

      const res = await fetch('/api/settings/llm', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: llmProvider,
          api_key: apiKey,
          model: model
        })
      });

      const data = await res.json();
      setLlmResult(data);
      if (data.success && onConfigUpdated) {
        onConfigUpdated();
      }
    } catch (err) {
      setLlmResult({ success: false, message: err.message });
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Server size={20} className="text-indigo" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Infrastructure & AI Settings
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Setting Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('database')}
            className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
          >
            <Database size={14} /> MySQL Database
          </button>
          <button
            onClick={() => setActiveTab('llm')}
            className={`tab-btn ${activeTab === 'llm' ? 'active' : ''}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
          >
            <Key size={14} /> LLM API Key
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'database' && (
            <form onSubmit={handleSaveDatabase}>
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: systemStatus?.database?.active_db === 'mysql' ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginBottom: '0.2rem' }}>
                  <span className={`status-dot ${systemStatus?.database?.active_db === 'mysql' ? 'online' : 'warning'}`}></span>
                  <span>Active Engine: {systemStatus?.database?.active_db?.toUpperCase() || 'SQLITE'}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {systemStatus?.database?.notice || 'Connected to local database.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    MySQL Host:
                  </label>
                  <input
                    type="text"
                    value={mysqlHost}
                    onChange={e => setMysqlHost(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Port:
                  </label>
                  <input
                    type="number"
                    value={mysqlPort}
                    onChange={e => setMysqlPort(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    User:
                  </label>
                  <input
                    type="text"
                    value={mysqlUser}
                    onChange={e => setMysqlUser(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Password:
                  </label>
                  <input
                    type="password"
                    value={mysqlPassword}
                    onChange={e => setMysqlPassword(e.target.value)}
                    placeholder="Enter root password"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Database Name:
                </label>
                <input
                  type="text"
                  value={mysqlDb}
                  onChange={e => setMysqlDb(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                  Will be automatically created with <code>CREATE DATABASE IF NOT EXISTS</code>
                </span>
              </div>

              {dbResult && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: dbResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: dbResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: `1px solid ${dbResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                }}>
                  {dbResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{dbResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={dbLoading}
                style={{ width: '100%' }}
              >
                {dbLoading ? <><Loader2 size={16} className="animate-spin" /> Connecting...</> : 'Connect & Switch to MySQL'}
              </button>
            </form>
          )}

          {activeTab === 'llm' && (
            <form onSubmit={handleSaveLLM}>
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>
                  <Sparkles size={14} />
                  <span>Smart Offline Engine is Active</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Entering an API key will upgrade generation to live Gemini or OpenAI models. If no key is set, the built-in domain-expert engine provides instant responses.
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  LLM Provider:
                </label>
                <select
                  value={llmProvider}
                  onChange={e => {
                    setLlmProvider(e.target.value);
                    setModel(e.target.value === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
                  }}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                >
                  <option value="gemini">Google Gemini API</option>
                  <option value="openai">OpenAI Compatible API</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  API Key:
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={llmProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Model:
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                />
              </div>

              {llmResult && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: llmResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: llmResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: `1px solid ${llmResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                }}>
                  {llmResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{llmResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={llmLoading}
                style={{ width: '100%' }}
              >
                {llmLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying Key...</> : 'Validate & Activate LLM'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
