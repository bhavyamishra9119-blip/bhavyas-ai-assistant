import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Database, Trash2, CheckCircle, Search, HardDrive } from 'lucide-react';

function safeStorageGet(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

export default function KnowledgeVault({ isOpen, onClose }) {
  const [documents, setDocuments] = useState(() => {
    const saved = safeStorageGet('user_knowledge_docs');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    safeStorageSet('user_knowledge_docs', JSON.stringify(documents));
  }, [documents]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const newDoc = {
          id: Date.now() + Math.random().toString(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.name.split('.').pop().toLowerCase(),
          content: text,
          date: new Date().toLocaleDateString()
        };
        setDocuments(prev => [newDoc, ...prev]);
        setIsUploading(false);
      };
      reader.readAsText(file);
    });
  };

  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '740px',
          background: 'rgba(15, 18, 35, 0.96)',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(167, 139, 250, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🧠</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                Knowledge Vault & Document Indexer
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#a1a1aa' }}>
                Upload files (.cpp, .js, .py, .md, .txt) to automatically index into AI memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#a1a1aa',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upload Zone */}
          <label style={{
            border: '2px dashed rgba(167, 139, 250, 0.4)',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(167, 139, 250, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Upload size={28} style={{ color: '#ffffff' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>
              Click or drag files here to index into Knowledge Vault
            </div>
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
              Supports code files (.cpp, .js, .py), Markdown notes, and text files
            </div>
            <input
              type="file"
              multiple
              accept=".txt,.md,.js,.jsx,.ts,.tsx,.cpp,.c,.py,.json,.css,.html"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {/* Search & List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={16} style={{ color: '#ffffff' }} />
            <input
              type="text"
              placeholder="Search indexed documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', width: '100%' }}
            />
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDocs.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                No documents indexed in Knowledge Vault yet. Upload your code or notes above!
              </div>
            ) : (
              filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={18} style={{ color: '#ffffff' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>{doc.name}</div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>{doc.size} • Indexed {doc.date}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
