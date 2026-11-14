import React, { useState, useEffect } from 'react';
import LampLogin      from './components/LampLogin';
import ChatInterface  from './components/ChatInterface';

/*
  Page flow: Exactly 2 pages
    login (LampLogin)  →  chat (ChatInterface)
*/

export function safeStorageGet(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    return fallback;
  }
}

export function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

// 🕒 30-Day Rolling Session Lifetime (Standard for AI assistants like ChatGPT / Claude)
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getValidSessionUsername() {
  const savedUsername = safeStorageGet('ws_username', '');
  if (!savedUsername) return '';

  const rawLastActive = safeStorageGet('ws_session_last_active', '');
  const lastActive = rawLastActive ? parseInt(rawLastActive, 10) : 0;
  const now = Date.now();

  // If 30 days have elapsed since last active usage, invalidate session
  if (lastActive && (now - lastActive > SESSION_MAX_AGE_MS)) {
    try {
      localStorage.removeItem('ws_username');
      localStorage.removeItem('ws_session_last_active');
    } catch (e) {}
    return '';
  }

  // Refresh rolling session timestamp
  safeStorageSet('ws_session_last_active', now.toString());
  return savedUsername;
}

function App() {
  const savedUsername = getValidSessionUsername();
  const [page, setPage] = useState(() => {
    // Remember session: jump straight to chat if already logged in within 30 days!
    return savedUsername ? 'chat' : 'login';
  });
  const [isGuest, setIsGuest] = useState(false);

  const [theme,    setTheme]    = useState(() => {
    return 'pure-oled';
  });
  const [username, setUsername] = useState(savedUsername);
  const [userAvatar, setUserAvatar] = useState(() => safeStorageGet('ws_user_avatar', '🤖'));

  // Apply theme class to document body
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    safeStorageSet('ws_theme', theme);
  }, [theme]);

  // Persist username & heartbeat rolling session
  useEffect(() => {
    if (username && !isGuest) {
      safeStorageSet('ws_username', username);
      safeStorageSet('ws_session_last_active', Date.now().toString());
    }
  }, [username, isGuest, page]);

  /* ── Handlers ──────────────────────────────────────────── */
  const handleLoginSuccess = (loginData) => {
    const isGuestUser = typeof loginData === 'object' && Boolean(loginData?.isGuest);
    const name = isGuestUser ? 'Guest' : (typeof loginData === 'string' ? loginData : (loginData?.username || 'User'));
    
    setIsGuest(isGuestUser);
    setUsername(name);

    if (!isGuestUser) {
      safeStorageSet('ws_username', name);
      safeStorageSet('bhavya_user_name', name);
      safeStorageSet('ws_session_last_active', Date.now().toString());
      try {
        const chan = new BroadcastChannel('bhavya_ai_synapse');
        chan.postMessage({ type: 'USER_NAME_UPDATE', name });
        chan.close();
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem('bhavya_ai_guest_session_chats');
        localStorage.removeItem('bhavya_ai_guest_active_chat');
      } catch (e) {}
    }

    // Hydrate into user-isolated storage
    if (!isGuestUser && loginData?.cloudData?.chats && Array.isArray(loginData.cloudData.chats) && loginData.cloudData.chats.length > 0) {
      try {
        const userKey = `bhavya_ai_chats_${name.toLowerCase()}`;
        localStorage.setItem(userKey, JSON.stringify(loginData.cloudData.chats));
        if (loginData.cloudData.activeChatId) {
          localStorage.setItem(`bhavya_ai_active_chat_${name.toLowerCase()}`, loginData.cloudData.activeChatId);
        }
      } catch (e) {
        console.warn('Failed to pre-hydrate cloud chats:', e);
      }
    }

    // Hydrate cloud documents into user-isolated storage
    if (!isGuestUser && loginData?.cloudDocs && Array.isArray(loginData.cloudDocs) && loginData.cloudDocs.length > 0) {
      try {
        const docKey = `bhavya_uploaded_documents_${name.toLowerCase()}`;
        const serializedDocs = JSON.stringify(loginData.cloudDocs);
        localStorage.setItem(docKey, serializedDocs);
        localStorage.setItem('bhavya_uploaded_documents', serializedDocs);
      } catch (e) {
        console.warn('Failed to pre-hydrate cloud documents:', e);
      }
    }

    // Clean unnamespaced legacy keys so they never leak to guest
    if (!isGuestUser) {
      try {
        localStorage.removeItem('bhavya_ai_chats');
        localStorage.removeItem('bhavya_ai_active_chat');
      } catch (e) {}
    }

    // If user is registering a brand new account, initialize default preferences:
    // Soft Coach Mode, Fast Thinking Mode, and Gemini 2.0 Flash
    if (loginData?.isNewRegistration) {
      safeStorageSet('bhavya_ai_coach_mode', 'soft');
      safeStorageSet('bhavya_ai_thinking_mode', 'deep');
      safeStorageSet('bhavya_ai_selected_model', 'codestral-latest');
    }

    setPage('chat');
  };

  const handleLogout = () => {
    setPage('login');
    safeStorageSet('ws_page', 'login');
    setUsername('');
    safeStorageSet('ws_username', '');
    try {
      localStorage.removeItem('ws_session_last_active');
    } catch (e) {}
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      maxWidth: '100vw',
      height: '100dvh',
      minHeight: '100dvh',
      overflow: page === 'login' ? 'auto' : 'hidden',
      background: '#000000',
      color: '#ffffff',
      fontFamily: "'Outfit', sans-serif"
    }}>

      {/* ── Page router: Exactly 2 Pages (Centered Login & Main Chat) ── */}
      {page === 'login' && (
        <LampLogin
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {page === 'chat' && (
        <ChatInterface
          currentTheme={theme}
          onThemeChange={(newTheme) => setTheme(newTheme)}
          username={username}
          userAvatar={userAvatar}
          onLogout={handleLogout}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}

export default App;
