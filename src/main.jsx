import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'

try {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('is-capacitor');
  }
} catch (e) {}

class MobileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical mobile runtime error caught:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Bhavya's AI Workstation</h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '360px', marginBottom: '16px', lineHeight: 1.5 }}>
            A temporary display cache error was caught. Tap below to auto-repair, clear obsolete cache, and launch immediately.
          </p>

          {this.state.error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '10px 14px',
              maxWidth: '360px',
              width: '100%',
              margin: '0 auto 20px auto',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                System Diagnostic:
              </div>
              <pre style={{
                fontSize: '11px',
                color: '#d4d4d8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                maxHeight: '100px',
                overflowY: 'auto'
              }}>
                {this.state.error?.message || String(this.state.error)}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#000000',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)'
              }}
            >
              🔄 Auto-Repair & Restart App
            </button>

            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#a1a1aa',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🚀 Continue to App Anyway
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MobileErrorBoundary>
      <App />
    </MobileErrorBoundary>
  </StrictMode>,
)
