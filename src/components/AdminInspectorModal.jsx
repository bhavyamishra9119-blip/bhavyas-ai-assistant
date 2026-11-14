/**
 * COMPONENT: AdminInspectorModal
 * APPLICATION: Bhavya's AI Assistant
 * 
 * Super Admin tool to:
 * 1. View all registered accounts
 * 2. Decrypt and inspect conversation sessions of any user
 * 3. Inspect user-uploaded documents/files
 * 4. Monitor user activity (creation date, last login)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Search, UserCheck, Shield, MessageSquare, 
  FileText, ChevronRight, RefreshCw, Clock, Bot, 
  User, Copy, Check, Eye, Calendar, Sparkles
} from 'lucide-react';
import { 
  fetchAllRegisteredUsers, 
  fetchUserChatsForAdmin, 
  fetchUserDocumentsForAdmin 
} from '../services/cloudSync';

export default function AdminInspectorModal({ isOpen, onClose, isLightMode = false }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'docs'
  
  const [chatsLoading, setChatsLoading] = useState(false);
  const [userChats, setUserChats] = useState([]);
  const [chatError, setChatError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  
  const [docsLoading, setDocsLoading] = useState(false);
  const [userDocs, setUserDocs] = useState([]);
  const [docsError, setDocsError] = useState(null);

  const [copiedId, setCopiedId] = useState(null);

  // Load all registered users on open
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    } else {
      setSelectedUser(null);
      setSelectedChat(null);
      setUserChats([]);
      setUserDocs([]);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchAllRegisteredUsers();
      setUsers(data || []);
      if (data && data.length > 0 && !selectedUser) {
        handleSelectUser(data[0]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSelectedChat(null);
    setChatError(null);
    setDocsError(null);

    // Load chats
    setChatsLoading(true);
    try {
      const res = await fetchUserChatsForAdmin(user.username);
      if (res && res.chats) {
        setUserChats(res.chats);
        if (res.chats.length > 0) {
          setSelectedChat(res.chats[0]);
        }
      } else if (res && res.error) {
        setChatError(res.error);
        setUserChats([]);
      } else {
        setUserChats([]);
      }
    } catch (err) {
      setChatError('Error loading chats for this user.');
      setUserChats([]);
    } finally {
      setChatsLoading(false);
    }

    // Load documents
    setDocsLoading(true);
    try {
      const docRes = await fetchUserDocumentsForAdmin(user.username);
      if (docRes && docRes.documents) {
        setUserDocs(docRes.documents);
      } else {
        setUserDocs([]);
      }
    } catch (err) {
      setDocsError('Error loading documents.');
      setUserDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div 
      className="modal-veil" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1100px',
          height: '88vh',
          background: isLightMode ? '#ffffff' : '#000000',
          color: isLightMode ? '#000000' : '#ffffff',
          borderRadius: '16px',
          border: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(124, 58, 237, 0.45)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(124, 58, 237, 0.08)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #27272a, #18181b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 12px rgba(124,58,237,0.5)'
            }}>
              <UserCheck size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Super Admin Chats Inspector</h2>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: 'rgba(124, 58, 237, 0.25)',
                  color: '#ffffff',
                  border: '1px solid rgba(124, 58, 237, 0.4)'
                }}>
                  MASTER VAULT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: isLightMode ? '#71717a' : '#a1a1aa' }}>
                Inspect registered users and decrypt dual-envelope conversation sessions in real time.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              title="Refresh users"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: isLightMode ? '#27272a' : '#d4d4d8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLightMode ? '#71717a' : '#a1a1aa',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body: Left = Users list, Right = User details & chat transcripts */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Column: Registered Users */}
          <div style={{
            width: '300px',
            borderRight: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            background: isLightMode ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            {/* Search Box */}
            <div style={{ padding: '12px', borderBottom: isLightMode ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                border: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <Search size={13} style={{ color: '#a1a1aa' }} />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'inherit',
                    fontSize: '11.5px',
                    width: '100%'
                  }}
                />
              </div>
              <div style={{ fontSize: '10.5px', color: '#a1a1aa', marginTop: '6px', paddingLeft: '2px' }}>
                {filteredUsers.length} registered user{filteredUsers.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {/* Users Scroll List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#a1a1aa', fontSize: '12px' }}>
                  <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  Loading accounts...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#a1a1aa', fontSize: '12px' }}>
                  No users found
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUser && selectedUser.username === user.username;
                  return (
                    <div
                      key={user.username}
                      onClick={() => handleSelectUser(user)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        background: isSelected 
                          ? 'rgba(124, 58, 237, 0.22)' 
                          : 'transparent',
                        border: isSelected 
                          ? '1px solid rgba(124, 58, 237, 0.5)' 
                          : '1px solid transparent',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{user.avatar || '👤'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#ffffff' : 'inherit',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.username}
                          </div>
                          <div style={{ fontSize: '10px', color: '#a1a1aa' }}>
                            {user.isAdmin ? (
                              <span style={{ color: '#ffffff', fontWeight: 600 }}>★ Admin</span>
                            ) : (
                              'Standard Account'
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: isSelected ? '#ffffff' : '#71717a', flexShrink: 0 }} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: User Chats / Docs Inspector */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedUser ? (
              <>
                {/* User Info Bar & Tab Switcher */}
                <div style={{
                  padding: '12px 18px',
                  borderBottom: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isLightMode ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.02)',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{selectedUser.avatar || '👤'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{selectedUser.username}</span>
                        {selectedUser.isAdmin && (
                          <span style={{
                            fontSize: '9px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#ffffff',
                            color: '#000',
                            fontWeight: 700
                          }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>
                        {selectedUser.createdAt ? `Joined: ${new Date(selectedUser.createdAt).toLocaleDateString()}` : 'Account active'}
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Chats vs Files */}
                  <div style={{
                    display: 'flex',
                    background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '3px'
                  }}>
                    <button
                      onClick={() => setActiveTab('chats')}
                      style={{
                        background: activeTab === 'chats' ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        color: activeTab === 'chats' ? '#fff' : '#a1a1aa',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Chats ({userChats.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('docs')}
                      style={{
                        background: activeTab === 'docs' ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        color: activeTab === 'docs' ? '#fff' : '#a1a1aa',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <FileText size={13} />
                      <span>Documents ({userDocs.length})</span>
                    </button>
                  </div>
                </div>

                {/* Tab: Chats View */}
                {activeTab === 'chats' && (
                  <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left: Chat Sessions List */}
                    <div style={{
                      width: '260px',
                      borderRight: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      overflowY: 'auto',
                      padding: '8px',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#a1a1aa', padding: '6px 8px', textTransform: 'uppercase' }}>
                        Sessions ({userChats.length})
                      </div>
                      {chatsLoading ? (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#a1a1aa', fontSize: '11.5px' }}>
                          <RefreshCw size={15} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                          Decrypting chats...
                        </div>
                      ) : chatError ? (
                        <div style={{ padding: '12px', color: '#ffffff', fontSize: '11.5px', lineHeight: 1.4 }}>
                          {chatError}
                        </div>
                      ) : userChats.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#a1a1aa', fontSize: '11.5px' }}>
                          No chats found for this user.
                        </div>
                      ) : (
                        userChats.map(c => {
                          const isChatActive = selectedChat && selectedChat.id === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedChat(c)}
                              style={{
                                padding: '9px 10px',
                                borderRadius: '8px',
                                marginBottom: '4px',
                                cursor: 'pointer',
                                background: isChatActive 
                                  ? 'rgba(124, 58, 237, 0.18)' 
                                  : 'transparent',
                                border: isChatActive 
                                  ? '1px solid rgba(124, 58, 237, 0.4)' 
                                  : '1px solid transparent',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{
                                fontSize: '12px',
                                fontWeight: isChatActive ? 700 : 500,
                                color: isChatActive ? '#ffffff' : 'inherit',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {c.title || 'Untitled Session'}
                              </div>
                              <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{(c.messages || []).length} messages</span>
                                {c.updatedAt && (
                                  <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Right: Message Transcript View */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {selectedChat ? (
                        <>
                          <div style={{
                            padding: '10px 16px',
                            borderBottom: isLightMode ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                          }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                                {selectedChat.title || 'Conversation Transcript'}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>
                                Session ID: {selectedChat.id} • {(selectedChat.messages || []).length} messages
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const transcript = (selectedChat.messages || [])
                                  .map(m => `[${(m.role || 'user').toUpperCase()}]:\n${m.content}\n`)
                                  .join('\n---\n');
                                handleCopy(transcript, 'transcript');
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11px',
                                color: '#d4d4d8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              {copiedId === 'transcript' ? <Check size={12} color="#ffffff" /> : <Copy size={12} />}
                              <span>{copiedId === 'transcript' ? 'Copied' : 'Copy All'}</span>
                            </button>
                          </div>

                          {/* Messages Thread */}
                          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {(selectedChat.messages || []).length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa', fontSize: '12px' }}>
                                This conversation has no recorded messages.
                              </div>
                            ) : (
                              (selectedChat.messages || []).map((m, idx) => {
                                const isUser = m.role === 'user';
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: isUser ? 'flex-end' : 'flex-start',
                                      maxWidth: '100%'
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      marginBottom: '4px',
                                      fontSize: '10.5px',
                                      color: '#a1a1aa'
                                    }}>
                                      {isUser ? (
                                        <>
                                          <span>{selectedUser.username}</span>
                                          <User size={12} />
                                        </>
                                      ) : (
                                        <>
                                          <Bot size={12} style={{ color: '#ffffff' }} />
                                          <span style={{ color: '#ffffff', fontWeight: 600 }}>
                                            {m.model || 'Assistant'}
                                          </span>
                                        </>
                                      )}
                                      {m.timestamp && (
                                        <span>• {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      )}
                                    </div>
                                    <div style={{
                                      maxWidth: '85%',
                                      padding: '10px 14px',
                                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                      background: isUser 
                                        ? '#27272a' 
                                        : (isLightMode ? '#f4f4f5' : 'rgba(255,255,255,0.06)'),
                                      color: isUser ? '#ffffff' : (isLightMode ? '#000000' : '#ffffff'),
                                      border: isUser ? '1px solid #3f3f46' : (isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)'),
                                      fontSize: '12.5px',
                                      lineHeight: 1.55,
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      userSelect: 'text'
                                    }}>
                                      {m.content}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontSize: '12px' }}>
                          Select a chat session on the left to view the decrypted conversation transcript.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Documents View */}
                {activeTab === 'docs' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Decrypted Attached Files ({userDocs.length})
                    </div>
                    {docsLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa', fontSize: '12px' }}>
                        <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                        Decrypting user documents...
                      </div>
                    ) : docsError ? (
                      <div style={{ padding: '16px', color: '#ffffff', fontSize: '12px' }}>
                        {docsError}
                      </div>
                    ) : userDocs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa', fontSize: '12px' }}>
                        No documents uploaded by this user yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                        {userDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              background: isLightMode ? '#ffffff' : 'rgba(255,255,255,0.04)',
                              border: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} style={{ color: '#ffffff' }} />
                              <span style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.name || doc.fileName || `Document #${idx + 1}`}
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#a1a1aa' }}>
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Uploaded file'} • {doc.type || 'Text/Doc'}
                            </div>
                            {doc.content && (
                              <div style={{
                                marginTop: '4px',
                                padding: '8px',
                                borderRadius: '6px',
                                background: isLightMode ? '#ffffff' : 'rgba(0,0,0,0.3)',
                                fontSize: '11px',
                                maxHeight: '100px',
                                overflowY: 'auto',
                                color: isLightMode ? '#71717a' : '#d4d4d8',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {typeof doc.content === 'string' ? doc.content.slice(0, 300) : JSON.stringify(doc.content).slice(0, 300)}
                                {doc.content.length > 300 && '...'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontSize: '13px' }}>
                Select a user account from the left sidebar to inspect their chats and documents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
