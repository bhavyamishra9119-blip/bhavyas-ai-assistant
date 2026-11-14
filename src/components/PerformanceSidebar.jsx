/**
 * COMPONENT: PerformanceSidebar (Clean Chat Drawer)
 * APPLICATION: Bhavya's AI Assistant
 * 
 * Clean, lightweight, battery-efficient drawer for:
 * 1. Starting a New Chat
 * 2. Real-time Search across conversation titles & messages
 * 3. Switching and Deleting saved chat sessions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, X, Plus, Trash, MessageSquare, UserCheck } from 'lucide-react';

export default function PerformanceSidebar({ 
  isOpen, 
  onClose, 
  chats = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onMouseEnter,
  onMouseLeave,
  isLightMode = false,
  isAdmin = false,
  onOpenInspector,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (c.title || '').toLowerCase().includes(q);
    const msgMatch = (c.messages || []).some(m => typeof m.content === 'string' && m.content.toLowerCase().includes(q));
    return titleMatch || msgMatch;
  });

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.12 }}
        className="sidebar-panel glass-panel"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          paddingTop: 'max(env(safe-area-inset-top, 0px), 38px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          background: isLightMode ? '#ffffff' : '#000000', 
          color: isLightMode ? '#000000' : '#ffffff', 
          borderRight: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a' 
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Header */}
        <div className="sidebar-header" style={{ flexShrink: 0 }}>
          <div className="sidebar-title-group">
            <Zap className="sidebar-zap-icon" />
            <h2 className="sidebar-title" style={{ color: isLightMode ? '#000000' : '#fff' }}>Conversations</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Chats Inspector — admin only */}
            {isAdmin && (
              <button
                onClick={() => {
                  if (onOpenInspector) onOpenInspector();
                  onClose();
                }}
                title="Inspect All User Chats (Super Admin)"
                style={{
                  background: isLightMode ? '#f4f4f5' : '#18181b',
                  border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  color: isLightMode ? '#000000' : '#ffffff',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = isLightMode ? '#000000' : '#52525b';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isLightMode ? '#e4e4e7' : '#27272a';
                }}
              >
                <UserCheck size={14} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Inspector</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="close-btn"
              title="Close sidebar"
            >
              <X className="close-icon" />
            </button>
          </div>
        </div>

        {/* Sidebar Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0 8px 16px 8px', gap: '10px' }}>
          
          {/* New Chat Button */}
          <button 
            onClick={() => { onNewChat(); onClose(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              borderRadius: '10px',
              background: isLightMode ? '#000000' : '#ffffff',
              border: 'none',
              color: isLightMode ? '#ffffff' : '#000000',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={15} style={{ color: 'currentColor' }} />
            <span>New Chat</span>
          </button>

          {/* Super Admin Inspection Button — Admin only */}
          {isAdmin && (
            <button 
              onClick={() => {
                if (onOpenInspector) onOpenInspector();
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isLightMode ? '#f4f4f5' : '#18181b',
                border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                color: isLightMode ? '#000000' : '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = isLightMode ? '#000000' : '#52525b';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isLightMode ? '#e4e4e7' : '#27272a';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={16} />
                <span>Inspect User Chats</span>
              </div>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#27272a',
                color: '#ffffff',
                letterSpacing: '0.04em'
              }}>
                ADMIN
              </span>
            </button>
          )}

          {/* 🔍 Fast Chat Search Input */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="🔍 Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: '8px',
                background: isLightMode ? '#f4f4f5' : '#121214',
                border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                color: isLightMode ? '#000000' : '#fff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Recent list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px' }}>
              <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Chats</span>
              {searchQuery.trim() && (
                <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600 }}>{filteredChats.length} found</span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {filteredChats.map(c => {
                const isActive = c.id === activeChatId;
                return (
                  <div
                    key={c.id}
                    onClick={() => { onSelectChat(c.id); onClose(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isActive ? '#18181b' : (isLightMode ? 'transparent' : 'transparent'),
                      border: isActive ? '1px solid #3f3f46' : '1px solid transparent',
                      color: isActive ? '#ffffff' : (isLightMode ? '#27272a' : '#a1a1aa'),
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    className="sidebar-chat-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <MessageSquare size={13} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'Untitled Chat'}</span>
                    </div>
                    
                    <button
                      type="button"
                      aria-label="Delete chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteChat(c.id, e);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        color: '#71717a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        marginLeft: '6px',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = isLightMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#71717a';
                        e.currentTarget.style.background = 'none';
                      }}
                      title="Delete chat"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                );
              })}

              {filteredChats.length === 0 && (
                <div style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', padding: '24px 0', fontStyle: 'italic' }}>
                  {searchQuery.trim() ? 'No chats found matching search' : 'No previous conversations'}
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
}
