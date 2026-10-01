import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Search, ChevronDown, Check, X, Sparkles } from 'lucide-react';

export const MARKET_JOB_ROLES = [
  // Full Stack & Web
  { title: "Senior Full-Stack Engineer", category: "Full-Stack & Web" },
  { title: "Full-Stack Developer", category: "Full-Stack & Web" },
  { title: "Lead Full-Stack Architect", category: "Full-Stack & Web" },
  { title: "MERN / MEAN Stack Developer", category: "Full-Stack & Web" },
  { title: "Staff Full-Stack Software Engineer", category: "Full-Stack & Web" },
  { title: "Principal Full-Stack Engineer", category: "Full-Stack & Web" },

  // Frontend
  { title: "Frontend Developer", category: "Frontend Engineering" },
  { title: "Senior Frontend Engineer", category: "Frontend Engineering" },
  { title: "React / Next.js Developer", category: "Frontend Engineering" },
  { title: "Vue.js / Nuxt Developer", category: "Frontend Engineering" },
  { title: "Angular Developer", category: "Frontend Engineering" },
  { title: "UI/UX Software Engineer", category: "Frontend Engineering" },
  { title: "Web Performance & Core Vitals Engineer", category: "Frontend Engineering" },

  // Backend
  { title: "Backend Engineer", category: "Backend Engineering" },
  { title: "Senior Backend Engineer", category: "Backend Engineering" },
  { title: "Python / FastAPI Developer", category: "Backend Engineering" },
  { title: "Java / Spring Boot Developer", category: "Backend Engineering" },
  { title: "Node.js / Express Developer", category: "Backend Engineering" },
  { title: "Go / Golang Software Engineer", category: "Backend Engineering" },
  { title: "C++ Systems / Backend Engineer", category: "Backend Engineering" },
  { title: "C# / .NET Core Developer", category: "Backend Engineering" },
  { title: "Rust Systems Engineer", category: "Backend Engineering" },
  { title: "Ruby on Rails Developer", category: "Backend Engineering" },
  { title: "Microservices & Distributed Systems Architect", category: "Backend Engineering" },

  // AI & Machine Learning
  { title: "AI / Machine Learning Engineer", category: "AI & Data Science" },
  { title: "Generative AI / LLM Application Developer", category: "AI & Data Science" },
  { title: "Senior Machine Learning Engineer", category: "AI & Data Science" },
  { title: "Deep Learning Research Scientist", category: "AI & Data Science" },
  { title: "Computer Vision Engineer", category: "AI & Data Science" },
  { title: "Natural Language Processing (NLP) Engineer", category: "AI & Data Science" },
  { title: "MLOps Engineer", category: "AI & Data Science" },
  { title: "AI Prompt Engineer & Agent Architect", category: "AI & Data Science" },
  { title: "Data Scientist", category: "AI & Data Science" },
  { title: "Senior Data Scientist", category: "AI & Data Science" },

  // Data Engineering & Analytics
  { title: "Data Engineer", category: "Data Engineering" },
  { title: "Senior Data Engineer", category: "Data Engineering" },
  { title: "Big Data Architect (Spark / Hadoop)", category: "Data Engineering" },
  { title: "Analytics Engineer (dbt / Snowflake)", category: "Data Engineering" },
  { title: "Business Intelligence (BI) Developer", category: "Data Engineering" },
  { title: "Data Analyst", category: "Data Engineering" },
  { title: "Quantitative Analyst / Financial Modeler", category: "Data Engineering" },

  // Cloud & DevOps & SRE
  { title: "DevOps Engineer", category: "Cloud & Infrastructure" },
  { title: "Senior DevOps Engineer", category: "Cloud & Infrastructure" },
  { title: "Site Reliability Engineer (SRE)", category: "Cloud & Infrastructure" },
  { title: "Cloud Solutions Architect (AWS / Azure / GCP)", category: "Cloud & Infrastructure" },
  { title: "Platform / Infrastructure Engineer", category: "Cloud & Infrastructure" },
  { title: "Kubernetes & Containerization Engineer", category: "Cloud & Infrastructure" },
  { title: "DevSecOps Engineer", category: "Cloud & Infrastructure" },
  { title: "Linux Systems Administrator", category: "Cloud & Infrastructure" },

  // Cybersecurity
  { title: "Cybersecurity Analyst", category: "Cybersecurity" },
  { title: "Information Security Engineer", category: "Cybersecurity" },
  { title: "Penetration Tester / Ethical Hacker", category: "Cybersecurity" },
  { title: "Application Security (AppSec) Specialist", category: "Cybersecurity" },
  { title: "Cloud Security Architect", category: "Cybersecurity" },
  { title: "SOC Security Operations Analyst", category: "Cybersecurity" },

  // Mobile & Embedded
  { title: "Mobile Application Developer", category: "Mobile & Embedded" },
  { title: "iOS Developer (Swift / SwiftUI)", category: "Mobile & Embedded" },
  { title: "Android Developer (Kotlin / Jetpack)", category: "Mobile & Embedded" },
  { title: "React Native Developer", category: "Mobile & Embedded" },
  { title: "Flutter Developer", category: "Mobile & Embedded" },
  { title: "Embedded Systems & Firmware Engineer", category: "Mobile & Embedded" },
  { title: "IoT Solutions Developer", category: "Mobile & Embedded" },
  { title: "Game Developer (Unity / Unreal Engine / C++)", category: "Mobile & Embedded" },

  // Product & Project Management
  { title: "Product Manager", category: "Product & Management" },
  { title: "Senior Product Manager", category: "Product & Management" },
  { title: "Technical Product Manager (TPM)", category: "Product & Management" },
  { title: "Engineering Manager", category: "Product & Management" },
  { title: "Director of Engineering / VP of Tech", category: "Product & Management" },
  { title: "Scrum Master / Agile Coach", category: "Product & Management" },
  { title: "Technical Project / Program Manager", category: "Product & Management" },

  // Quality Assurance & Testing
  { title: "QA Automation Engineer", category: "QA & Testing" },
  { title: "SDET (Software Development Engineer in Test)", category: "QA & Testing" },
  { title: "Performance & Load Testing Engineer", category: "QA & Testing" },
  { title: "Manual QA Tester / Test Lead", category: "QA & Testing" },

  // UI/UX & Design
  { title: "Product Designer / UX Designer", category: "Design & UX" },
  { title: "Senior UI/UX Designer", category: "Design & UX" },
  { title: "Design Systems Lead", category: "Design & UX" },
  { title: "UX Researcher", category: "Design & UX" },

  // Solutions & Business Enterprise
  { title: "Solutions Architect", category: "Enterprise & Solutions" },
  { title: "Enterprise Architect", category: "Enterprise & Solutions" },
  { title: "Pre-Sales Solutions Engineer", category: "Enterprise & Solutions" },
  { title: "Salesforce Developer / Architect", category: "Enterprise & Solutions" },
  { title: "SAP / ERP Technical Consultant", category: "Enterprise & Solutions" },
  { title: "ServiceNow Developer", category: "Enterprise & Solutions" },
  { title: "Developer Relations (DevRel) / Advocate", category: "Enterprise & Solutions" },
  { title: "Technical Writer / Documentation Lead", category: "Enterprise & Solutions" }
];

const POPULAR_QUICK_PICKS = [
  "Senior Full-Stack Engineer",
  "AI / Machine Learning Engineer",
  "DevOps Engineer",
  "Senior Frontend Engineer",
  "Data Scientist",
  "Product Manager"
];

export default function JobTitleDropdown({ value, onChange, placeholder = "Search or select your Target Job Title..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal query with external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Filter roles based on query string
  const filteredRoles = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MARKET_JOB_ROLES;
    return MARKET_JOB_ROLES.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.category.toLowerCase().includes(q)
    );
  }, [query]);

  // Group filtered results by category
  const groupedRoles = React.useMemo(() => {
    const groups = {};
    filteredRoles.forEach(role => {
      if (!groups[role.category]) groups[role.category] = [];
      groups[role.category].push(role);
    });
    return groups;
  }, [filteredRoles]);

  // Flat array of currently visible titles for keyboard navigation
  const visibleTitles = React.useMemo(() => {
    return filteredRoles.map(r => r.title);
  }, [filteredRoles]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedTitle) => {
    setQuery(selectedTitle);
    onChange(selectedTitle);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setQuery(newVal);
    onChange(newVal);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < visibleTitles.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : visibleTitles.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < visibleTitles.length) {
        handleSelect(visibleTitles[highlightedIndex]);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearInput = (e) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="job-dropdown-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input / Combobox Trigger */}
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          border: isOpen ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'none',
          transition: 'border-color 0.15s ease',
          padding: '0 0.75rem'
        }}
      >
        <Briefcase size={15} style={{ color: isOpen ? 'var(--text-primary)' : 'var(--text-muted)', marginRight: '0.55rem', flexShrink: 0 }} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          id="target-role-input"
          autoComplete="off"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '0.65rem 0',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: 'inherit'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {query && (
            <button
              type="button"
              onClick={clearInput}
              aria-label="Clear job title"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s'
              }}
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle dropdown suggestions"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <ChevronDown size={17} />
          </button>
        </div>
      </div>

      {/* Floating Suggestions Menu */}
      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '340px',
            overflowY: 'auto',
            zIndex: 100,
            padding: '0.4rem 0'
          }}
        >
          {/* Quick Picks Header */}
          {!query && (
            <div style={{ padding: '0.35rem 0.75rem 0.55rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Popular Roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {POPULAR_QUICK_PICKS.map(pick => (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => handleSelect(pick)}
                    style={{
                      background: value === pick ? 'var(--bg-card-hover)' : 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.76rem',
                      fontWeight: 500,
                      color: value === pick ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pick}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Category Options */}
          {Object.keys(groupedRoles).length > 0 ? (
            Object.entries(groupedRoles).map(([category, roles]) => (
              <div key={category} style={{ marginBottom: '0.35rem' }}>
                <div 
                  style={{
                    padding: '0.45rem 0.85rem 0.25rem 0.85rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)'
                  }}
                >
                  {category}
                </div>
                {roles.map(role => {
                  const isSelected = value === role.title;
                  const itemIndex = visibleTitles.indexOf(role.title);
                  const isHighlighted = highlightedIndex === itemIndex;

                  return (
                    <div
                      key={role.title}
                      onClick={() => handleSelect(role.title)}
                      onMouseEnter={() => setHighlightedIndex(itemIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.85rem',
                        cursor: 'pointer',
                        background: isHighlighted ? 'rgba(99, 102, 241, 0.15)' : (isSelected ? 'rgba(6, 182, 212, 0.08)' : 'transparent'),
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                        transition: 'background 0.15s ease',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{role.title}</span>
                      </div>
                      {isSelected && (
                        <Check size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                No standard match for "<strong>{query}</strong>"
              </p>
              <button
                type="button"
                onClick={() => handleSelect(query.trim())}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid var(--accent-indigo)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Use custom goal: "{query.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
