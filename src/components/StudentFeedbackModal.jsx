import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle, Heart, Share2, ThumbsUp, Sparkles } from 'lucide-react';

export default function StudentFeedbackModal({ isOpen, onClose, isLightMode }) {
  const [rating, setRating] = useState('love');
  const [subjectNeed, setSubjectNeed] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const existing = JSON.parse(localStorage.getItem('bhavya_student_feedback') || '[]');
      existing.push({
        rating,
        subjectNeed,
        comments,
        date: new Date().toISOString()
      });
      localStorage.setItem('bhavya_student_feedback', JSON.stringify(existing));
    } catch (err) {}
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  const shareText = encodeURIComponent("Hey! Check out Bhavya's AI Assistant for engineering students. It has 40+ college notes, lab manuals, and solves code assignments with green highlights: https://bhavyas-ai-assistant.vercel.app");

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
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
          maxWidth: '520px',
          background: isLightMode ? '#ffffff' : '#09090b',
          border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
          borderRadius: '16px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: isLightMode ? '#09090b' : '#ffffff', margin: 0 }}>
              Classmate Feedback & Requests
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLightMode ? '#71717a' : '#a1a1aa',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <CheckCircle size={44} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: isLightMode ? '#09090b' : '#ffffff', margin: '0 0 6px' }}>
              Thank You for Your Feedback!
            </h3>
            <p style={{ fontSize: '13px', color: isLightMode ? '#71717a' : '#a1a1aa', margin: 0 }}>
              Your feedback helps make this assistant better for every student.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: isLightMode ? '#3f3f46' : '#d4d4d8', marginBottom: '8px' }}>
                How is your experience with Bhavya's AI Assistant?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'love', icon: '🔥', label: 'Super Useful' },
                  { id: 'good', icon: '👍', label: 'Good' },
                  { id: 'needs_work', icon: '💡', label: 'Needs More Notes' }
                ].map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setRating(item.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      background: rating === item.id 
                        ? (isLightMode ? '#18181b' : '#ffffff') 
                        : (isLightMode ? '#f4f4f5' : '#18181b'),
                      color: rating === item.id 
                        ? (isLightMode ? '#ffffff' : '#000000') 
                        : (isLightMode ? '#52525b' : '#a1a1aa'),
                      border: rating === item.id ? '1px solid transparent' : '1px solid #27272a',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: isLightMode ? '#3f3f46' : '#d4d4d8', marginBottom: '6px' }}>
                What subject, PYQs, or lab notes should we add next?
              </label>
              <input
                type="text"
                placeholder="e.g. 3rd Sem Computer Graphics, Microprocessors, Java Lab..."
                value={subjectNeed}
                onChange={e => setSubjectNeed(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isLightMode ? '#ffffff' : '#18181b',
                  border: isLightMode ? '1px solid #d4d4d8' : '1px solid #3f3f46',
                  color: isLightMode ? '#000000' : '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: isLightMode ? '#3f3f46' : '#d4d4d8', marginBottom: '6px' }}>
                Any complaints or suggestions?
              </label>
              <textarea
                rows={3}
                placeholder="Tell us what was confusing, slow, or what we can improve..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isLightMode ? '#ffffff' : '#18181b',
                  border: isLightMode ? '1px solid #d4d4d8' : '1px solid #3f3f46',
                  color: isLightMode ? '#000000' : '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: '#22c55e',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={14} />
                <span>Submit Feedback</span>
              </button>

              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Share2 size={13} />
                <span>WhatsApp</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
