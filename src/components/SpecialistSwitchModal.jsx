import React, { useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { SPECIALIST_ASSISTANTS } from '../utils/specialists';

export default function SpecialistSwitchModal({ isOpen, onClose, activeSpecialist, onSelectSpecialist }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3, 5, 10, 0.78)',
        backdropFilter: 'blur(12px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          background: '#000000',
          border: '1px solid #27272a',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
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
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                Select Your Software Team Member
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: '4px 0 0 0' }}>
              Your elite software team — each member is a domain expert with maximum power in their field.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a1a1aa',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Specialists Grid */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px'
        }}>
          {SPECIALIST_ASSISTANTS.map((spec) => {
            const isSelected = spec.id === activeSpecialist;
            return (
              <div
                key={spec.id}
                onClick={() => {
                  onSelectSpecialist(spec.id);
                  onClose();
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: isSelected ? '#18181b' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1.5px solid #ffffff' : '1px solid #27272a',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#52525b';
                    e.currentTarget.style.background = '#18181b';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Top Badge & Checkmark */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: '#27272a',
                    color: '#ffffff'
                  }}>
                    {spec.badge}
                  </span>
                  {isSelected && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000000'
                    }}>
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Icon & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  <span style={{ fontSize: '24px' }}>{spec.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {spec.name}
                    </h3>
                  </div>
                </div>

                {/* Tagline */}
                <p style={{
                  fontSize: '11.5px',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  lineHeight: '1.45',
                  margin: '4px 0 0 0'
                }}>
                  {spec.tagline}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: '#71717a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} style={{ color: '#ffffff' }} />
            <span>Switching team members changes the active expert, system prompt, and specialized knowledge focus.</span>
          </div>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
