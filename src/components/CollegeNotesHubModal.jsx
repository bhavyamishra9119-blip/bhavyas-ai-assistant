import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, BookOpen, Zap, Target, Code, ExternalLink, GraduationCap, Sparkles, Filter } from 'lucide-react';
import { COLLEGE_NOTES_DATA, COLLEGE_NOTE_CATEGORIES } from '../utils/collegeNotesData';

export default function CollegeNotesHubModal({ isOpen, onClose, onSendPrompt, isLightMode }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredNotes = useMemo(() => {
    return COLLEGE_NOTES_DATA.filter((note) => {
      const matchesCat = activeCategory === 'all' || note.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        note.title.toLowerCase().includes(q) ||
        note.subject.toLowerCase().includes(q) ||
        note.desc.toLowerCase().includes(q) ||
        note.topics.some(t => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleAction = (promptText) => {
    if (onSendPrompt) {
      onSendPrompt(promptText);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3, 5, 10, 0.82)',
        backdropFilter: 'blur(12px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          background: isLightMode ? '#ffffff' : '#09090b',
          border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
          borderRadius: '16px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>📚</span>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: isLightMode ? '#09090b' : '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                College Notes & Exam Hub
              </h2>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                40+ CURATED ENGINEERING NOTES
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: isLightMode ? '#71717a' : '#a1a1aa', margin: '4px 0 0 0' }}>
              Official college notes, lab manuals, 1-click exam revision sheets, and AI PYQ solving.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)',
              border: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLightMode ? '#71717a' : '#a1a1aa',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Controls: Search & Categories */}
        <div style={{
          padding: '14px 24px',
          borderBottom: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
          background: isLightMode ? '#fafafa' : '#121214',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: isLightMode ? '#a1a1aa' : '#71717a' }} />
            <input
              type="text"
              placeholder="Search by subject, topic (e.g. Trees, Pointers, Deadlock, K-Maps, Eigenvalues)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '9px',
                background: isLightMode ? '#ffffff' : '#1c1c1f',
                border: isLightMode ? '1px solid #d4d4d8' : '1px solid #3f3f46',
                color: isLightMode ? '#000000' : '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {COLLEGE_NOTE_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive
                      ? (isLightMode ? '#18181b' : '#ffffff')
                      : (isLightMode ? '#f4f4f5' : '#1e1e22'),
                    color: isActive
                      ? (isLightMode ? '#ffffff' : '#000000')
                      : (isLightMode ? '#52525b' : '#a1a1aa'),
                    border: isActive
                      ? '1px solid transparent'
                      : (isLightMode ? '1px solid #e4e4e7' : '1px solid #2e2e33')
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Grid */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px',
          flex: 1
        }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              style={{
                background: isLightMode ? '#ffffff' : '#141416',
                border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s ease',
                boxShadow: isLightMode ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>{note.icon}</span>
                    <div>
                      <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: isLightMode ? '#09090b' : '#ffffff', margin: 0, lineHeight: 1.3 }}>
                        {note.title}
                      </h3>
                      <span style={{ fontSize: '11px', color: isLightMode ? '#71717a' : '#a1a1aa' }}>
                        {note.subject}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: note.type === 'Exam Sheet' ? 'rgba(234, 179, 8, 0.15)' : note.type === 'Lab Manual' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: note.type === 'Exam Sheet' ? '#eab308' : note.type === 'Lab Manual' ? '#c084fc' : '#60a5fa',
                    border: '1px solid currentColor',
                    whiteSpace: 'nowrap'
                  }}>
                    {note.type}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: isLightMode ? '#52525b' : '#9ca3af', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  {note.desc}
                </p>

                {/* Topic Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                  {note.topics.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isLightMode ? '#f4f4f5' : '#1f1f23',
                        color: isLightMode ? '#71717a' : '#a1a1aa',
                        border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <a
                  href={note.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: isLightMode ? '#f4f4f5' : '#222226',
                    border: isLightMode ? '1px solid #e4e4e7' : '1px solid #333338',
                    color: isLightMode ? '#000000' : '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <BookOpen size={13} />
                  <span>Read Full PDF Note</span>
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </a>

                <div style={{ display: 'grid', gridTemplateColumns: note.labPrompt ? '1fr 1fr 1fr' : '1fr 1fr', gap: '6px' }}>
                  <button
                    onClick={() => handleAction(note.examPrompt)}
                    title="Generate 15-Minute Exam Revision Sheet"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: 'rgba(234, 179, 8, 0.12)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      color: '#eab308',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Zap size={11} />
                    <span>Exam Cram</span>
                  </button>

                  <button
                    onClick={() => handleAction(note.pyqPrompt)}
                    title="Solve Top 10 Most Repeated Questions"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Target size={11} />
                    <span>Top PYQs</span>
                  </button>

                  {note.labPrompt && (
                    <button
                      onClick={() => handleAction(note.labPrompt)}
                      title="Generate Clean Working Lab Code"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#4ade80',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Code size={11} />
                      <span>Lab Code</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
          background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: isLightMode ? '#71717a' : '#a1a1aa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={14} style={{ color: '#4ade80' }} />
            <span>Showing {filteredNotes.length} curated college academic resources</span>
          </div>
          <div>
            Click <strong>Exam Cram</strong> or <strong>Top PYQs</strong> to let the AI solve topics immediately.
          </div>
        </div>
      </div>
    </div>
  );
}
