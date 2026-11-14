import React, { useState, useRef, useEffect } from 'react';
import { loginUser, registerUser, fetchUserChats, fetchUserDocuments } from '../services/cloudSync';
import { rateLimiter, validatePasswordStrength, validateUsername, isAdminUsername } from '../utils/security.js';

/* ══════════════════════════════════════════════════════════
   BHAVYA'S AI ASSISTANT — MODERN CENTERED WELCOME PORTAL
   - Clean, centered welcome & authentication card
   - Fast, zero-lag responsive layout on mobile, tablet & desktop
   - Zero-Knowledge Cloud Sync with PBKDF2 + AES-GCM-256
   ══════════════════════════════════════════════════════════ */

export default function LampLogin({ onLoginSuccess }) {
  const [logoError, setLogoError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [usernameWarning, setUsernameWarning] = useState('');

  const usernameInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const handleUsernameChange = (val) => {
    setUsername(val);

    if (authMode === 'register' && isAdminUsername(val)) {
      setUsernameWarning('⛔ Admin registration is restricted. Only the administrator can use this account.');
    } else if (/\s/.test(val)) {
      if (isAdminUsername(val)) {
        setUsernameWarning('👑 Admin account recognized.');
      } else {
        setUsernameWarning('⚠️ Spaces are not allowed in usernames! Only letters, numbers, and symbols are permitted.');
      }
    } else {
      setUsernameWarning('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const cleanUser = (username || '').trim();

    // 1. Rate Limiting Check
    const lock = rateLimiter.checkLock();
    if (lock.locked) {
      setErrorMsg(`🔒 Security Lockout Active: Too many failed attempts. Please wait ${lock.remainingSec}s before retrying.`);
      return;
    }

    if (!cleanUser) {
      setErrorMsg('Please enter your operator username.');
      return;
    }

    // 2. Strict Username Rules
    const userCheck = validateUsername(username);
    if (!userCheck.valid) {
      setErrorMsg(userCheck.message);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your access password.');
      return;
    }

    // 3. Password Validation
    if (authMode === 'register') {
      const passCheck = validatePasswordStrength(password);
      if (!passCheck.valid) {
        setErrorMsg(passCheck.message);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (authMode === 'register') {
        const regRes = await registerUser(cleanUser, password);
        if (!regRes.success) {
          rateLimiter.recordFailure();
          setErrorMsg(regRes.error || 'Registration failed.');
          setIsLoading(false);
          return;
        }
        rateLimiter.recordSuccess();
        setSuccessMsg('✨ Account created! Initializing secure workspace...');
      } else {
        const loginRes = await loginUser(cleanUser, password);
        if (!loginRes.success) {
          rateLimiter.recordFailure();
          const updatedLock = rateLimiter.checkLock();
          if (updatedLock.locked) {
            setErrorMsg(`🔒 Security Cooldown: Please wait ${updatedLock.remainingSec}s.`);
          } else {
            setErrorMsg(loginRes.error || 'Login failed.');
          }
          setIsLoading(false);
          return;
        }
        rateLimiter.recordSuccess();
        setSuccessMsg('🚀 Verified! Decrypting cloud chats & syncing workspace...');
      }

      // Fetch cloud chats & documents
      const [cloudData, cloudDocs] = await Promise.all([
        fetchUserChats(cleanUser).catch(() => null),
        fetchUserDocuments(cleanUser).catch(() => [])
      ]);

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            username: cleanUser,
            cloudData,
            cloudDocs: Array.isArray(cloudDocs) ? cloudDocs : [],
            isNewRegistration: authMode === 'register'
          });
        }
      }, 350);
    } catch (err) {
      console.error('Auth error:', err);
      rateLimiter.recordFailure();
      setErrorMsg('Connection error: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleGuestAccess = (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('bhavya_ai_guest_session_chats');
      localStorage.removeItem('bhavya_ai_guest_active_chat');
    } catch (err) {}
    if (onLoginSuccess) {
      onLoginSuccess({ username: 'Guest', isGuest: true, cloudData: null });
    }
  };

  return (
    <div className="login-portal-root">
      {/* Background ambient glow orbs */}
      <div className="login-glow-orb login-glow-orb--1" />
      <div className="login-glow-orb login-glow-orb--2" />

      {/* Main Centered Welcome Box */}
      <div className="login-card-container">
        <div className="login-card">

          {/* Logo badge with neon glow */}
          <div className="login-logo-wrap">
            <div className="login-logo-ring">
              {logoError ? (
                <div style={{ fontSize: '32px' }}>🤖</div>
              ) : (
                <img
                  src="/logo.png"
                  alt="Assistant Logo"
                  onError={() => setLogoError(true)}
                  className="login-logo-img"
                />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="login-title">
            WELCOME TO <span className="login-title-cyan">BHAVYA'S</span>
            <br />
            <span className="login-title-gold">AI ASSISTANT</span>
          </h1>
          <p className="login-subtitle">
            Autonomous multi-model engineering workstation
          </p>

          {/* Auth Mode Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${authMode === 'login' ? 'login-tab--active' : ''}`}
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              🔑 SIGN IN
            </button>
            <button
              type="button"
              className={`login-tab ${authMode === 'register' ? 'login-tab--active' : ''}`}
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              ✨ CREATE ACCOUNT
            </button>
          </div>

          {/* Status Messages */}
          {errorMsg && (
            <div className="login-banner login-banner--error">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="login-banner login-banner--success">
              <span>⚡</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-username">OPERATOR USERNAME</label>
                <span className="login-hint-text">NO SPACES ALLOWED</span>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon">👤</span>
                <input
                  id="login-username"
                  ref={usernameInputRef}
                  type="text"
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="Enter username (no spaces)..."
                  autoComplete="username"
                  className={usernameWarning && usernameWarning.includes('⚠️') ? 'input-warning' : ''}
                  required
                />
              </div>
              {usernameWarning && (
                <div className="login-warning-pill">
                  {usernameWarning}
                </div>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="login-password">ACCESS PASSWORD</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={authMode === 'login' ? 'Enter your password...' : 'Choose a password (min 4 chars)...'}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Primary Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading
                ? '🔄 SYNCING CREDENTIALS...'
                : (authMode === 'login' ? '🚀 SIGN IN & SYNC CHATS →' : '✨ CREATE ACCOUNT & INITIALIZE →')}
            </button>

            {/* Guest Access Option */}
            <button
              type="button"
              onClick={handleGuestAccess}
              className="login-guest-btn"
            >
              Continue as Guest (Local Offline Mode)
            </button>
          </form>

          {/* Footer status indicator */}
          <div className="login-footer">
            <span className="login-status-dot" />
            <span>NEURAL LINK ONLINE • AES-GCM-256 CLOUD ENCRYPTED</span>
          </div>

        </div>
      </div>

      {/* Scoped Styles for Guaranteed Pixel-Perfect Responsive Center Display */}
      <style>{`
        .login-portal-root {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding: 16px;
          box-sizing: border-box;
          z-index: 99;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .login-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .login-glow-orb--1 {
          top: 15%;
          left: 20%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 70%);
        }
        .login-glow-orb--2 {
          bottom: 15%;
          right: 20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%);
        }

        .login-card-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          display: flex;
          justify-content: center;
          margin: auto;
        }

        .login-card {
          width: 100%;
          background: rgba(14, 16, 32, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(124, 58, 237, 0.35);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.2);
          border-radius: 20px;
          padding: 28px 24px;
          box-sizing: border-box;
          text-align: center;
          color: #ffffff;
        }

        .login-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 14px;
        }

        .login-logo-ring {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.3));
          border: 1px solid rgba(167, 139, 250, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.35);
          overflow: hidden;
        }

        .login-logo-img {
          width: 42px;
          height: 42px;
          object-fit: cover;
          border-radius: 50%;
        }

        .login-title {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: 0.04em;
          line-height: 1.25;
          margin: 0 0 4px 0;
          color: #ffffff;
        }

        .login-title-cyan {
          color: #ffffff;
          text-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
        }

        .login-title-gold {
          color: #ffffff;
          text-shadow: 0 0 16px rgba(251, 191, 36, 0.6);
        }

        .login-subtitle {
          font-size: 12px;
          color: #a1a1aa;
          margin: 0 0 18px 0;
          letter-spacing: 0.02em;
        }

        .login-tabs {
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 16px;
        }

        .login-tab {
          flex: 1;
          padding: 8px 10px;
          background: transparent;
          border: none;
          color: #a1a1aa;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-tab--active {
          background: linear-gradient(135deg, #ffffff, #d4d4d8);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.35);
        }

        .login-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 12px;
          margin-bottom: 14px;
          text-align: left;
        }

        .login-banner--error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #d4d4d8;
        }

        .login-banner--success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #ffffff;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          text-align: left;
        }

        .login-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .login-field label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #a1a1aa;
        }

        .login-hint-text {
          font-size: 9px;
          font-family: monospace;
          color: #71717a;
        }

        .login-input-wrap {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0 12px;
          transition: border-color 0.2s;
        }

        .login-input-wrap:focus-within {
          border-color: #ffffff;
          box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.25);
        }

        .login-input-icon {
          font-size: 14px;
          margin-right: 8px;
          opacity: 0.7;
        }

        .login-input-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 11px 0;
          font-size: 13.5px;
          outline: none;
          width: 100%;
        }

        .login-input-wrap input::placeholder {
          color: #71717a;
        }

        .login-eye-btn {
          background: none;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }

        .login-warning-pill {
          font-size: 11px;
          color: #ffffff;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 5px 8px;
          border-radius: 6px;
        }

        .login-submit-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #71717a 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35);
          transition: transform 0.15s, box-shadow 0.15s;
          margin-top: 4px;
        }

        .login-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(124, 58, 237, 0.5);
        }

        .login-submit-btn:active {
          transform: translateY(0);
        }

        .login-guest-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #a1a1aa;
          padding: 9px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .login-guest-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .login-footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: #71717a;
        }

        .login-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px #ffffff;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 22px 18px;
            border-radius: 16px;
          }
          .login-title {
            font-size: 18px;
          }
          .login-subtitle {
            font-size: 11px;
            margin-bottom: 14px;
          }
        }
      `}</style>
    </div>
  );
}
