import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function CareerChatbot({ resumeData }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${resumeData?.candidate_name || 'there'}! I'm Aura, your AI Career Coach. I've analyzed your resume for the ${resumeData?.target_role || 'target'} role. How can I help you accelerate your job search today?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const quickPrompts = [
    "Run a 2-question mock technical interview",
    "How can I negotiate top-band salary for this role?",
    "What real-world portfolio project will make my resume stand out?",
    "Suggest 3 certifications to fast-track promotion"
  ];

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || isSending) return;

    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInputMessage('');
    setIsSending(true);

    try {
      const payload = {
        resume_id: resumeData?.resume_id || resumeData?.id,
        message: textToSend,
        history: newMessages.map(m => ({ sender: m.sender, message: m.text })),
        candidate_context: {
          name: resumeData?.candidate_name || 'Candidate',
          target_role: resumeData?.target_role || 'Software Engineer',
          skills: resumeData?.skills?.all_skills || [],
          ats_score: resumeData?.ats_results?.overall_score || 75
        }
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setMessages([...newMessages, { sender: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { sender: 'assistant', text: `Sorry, I ran into an error: ${err.message}. Please try again.` }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', height: '620px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Aura - AI Career Counselor
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              ● Context-Aware & Ready
            </span>
          </div>
        </div>

        <button
          onClick={() => setMessages([{
            sender: 'assistant',
            text: `Welcome back! What aspect of your career strategy or resume would you like to refine?`
          }])}
          className="btn-icon"
          title="Reset Conversation"
          style={{ width: '32px', height: '32px' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, idx) => {
          const isAi = m.sender === 'assistant';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                alignSelf: isAi ? 'flex-start' : 'flex-end',
                maxWidth: '85%'
              }}
            >
              {isAi && (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Sparkles size={15} />
                </div>
              )}

              <div
                style={{
                  background: isAi ? 'var(--bg-secondary)' : 'var(--accent-indigo)',
                  color: isAi ? 'var(--text-primary)' : 'white',
                  border: isAi ? '1px solid var(--border-subtle)' : 'none',
                  borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  padding: '0.85rem 1.15rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>

              {!isAi && (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', alignSelf: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem 1rem', borderRadius: '4px 16px 16px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Aura is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '0.5rem 0', borderTop: '1px solid var(--border-subtle)' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="sample-pill"
            style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            <Sparkles size={11} className="text-cyan" /> {p}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Aura anything about your resume, interview strategy, or skills..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isSending}
          className="btn btn-primary"
          style={{ padding: '0 1.25rem' }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
