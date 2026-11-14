/**
 * ══════════════════════════════════════════════════════════════════
 * COMPONENT: Flagship AI Chat Interface (ChatInterface.jsx)
 * APPLICATION: Bhavya's AI Assistant
 * 
 * ARCHITECTURE OVERVIEW:
 * The primary conversational engine and user interface orchestrating:
 * 1. Multi-Provider Model Routing: Seamless switching between Groq,
 *    OpenAI, Anthropic, Gemini, Cohere, DeepSeek, and local Ollama models.
 * 2. Streaming Response Engine: Chunked SSE parsing with AbortController
 *    support for in-flight cancellations and prompt rewind branching.
 * 3. End-to-End Encrypted Cloud Sync: Dual-envelope AES-GCM-256 cloud
 *    persistence with Supabase and localStorage failover.
 * 4. Rich Multimodal Artifacts: Code execution sandboxes, live HTML
 *    Canvas preview, interactive Chart.js graphs, KaTeX math typesetting.
 * 5. Prompt Enhancement Tools: Prompt Architect Pro studio, Prompt Magic
 *    Wand, and "/" Prompt Lenses for instant task specialization.
 * 6. Super Admin Inspection: Authorized access to user directories,
 *    password resets, and decrypted conversation transcripts.
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu, Trash2, Sun, Moon, Info, Palette, Send, Plus,
  Copy, Check, Volume2, VolumeX, RotateCcw, Edit2, Bot, User,
  Zap, Sparkles, MessageSquare, ChevronDown, Mic, Settings, LogOut, Wand2,
  Database, GraduationCap, Globe, Terminal, Command, BookOpen, UserCheck, Eye, Download, Image, FileText, Tv, Play, Pause, Loader2, RefreshCw,
  Presentation, FileSpreadsheet, BrainCircuit, ExternalLink, PlusCircle, ShieldCheck
} from 'lucide-react';
import PerformanceSidebar from './PerformanceSidebar';
import ArtifactCanvas from './ArtifactCanvas';
import { executeCode } from '../utils/codeSandbox';
import { fetchUserChats, saveUserChats, fetchUserDocuments, fetchUserDocumentsWithMeta, saveUserDocuments } from '../services/cloudSync';
import { parseDocumentFile, unpackZipDocuments, parseZipFolderDocument, downloadDocumentFile, getDocumentMeta, formatFileSize } from '../utils/documentParser';
import { isAdminUsername } from '../utils/security';
import { PROMPT_LENSES, parsePromptLens, getAllPromptLenses, getCustomLenses, saveCustomLens, deleteCustomLens } from '../utils/promptLenses';
import { exportToPptx, exportToDocx } from '../utils/exportGenerators';
import { performWebSearch } from '../utils/webSearchService';
import { SPECIALIST_ASSISTANTS } from '../utils/specialists';
import SpecialistSwitchModal from './SpecialistSwitchModal';
import AdminInspectorModal from './AdminInspectorModal';
import CollegeNotesHubModal from './CollegeNotesHubModal';
import StudentFeedbackModal from './StudentFeedbackModal';

// ══════════════════════════════════════════════════════════════════
// SECTION 1: UTILITY HELPERS & ENVIRONMENT DETECTION
// ══════════════════════════════════════════════════════════════════
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

const IS_MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;


function BrandLogo({ size = 32, style = {} }) {
  const [logoError, setLogoError] = useState(false);
  const [logoUrl] = useState(() => '/logo_fallback.svg');
  const [fallbackUrl] = useState(() => '/logo_fallback.svg');

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '9px',
      flexShrink: 0,
      background: '#18181b',
      border: '1px solid #27272a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'none',
      color: '#fff',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      ...style
    }} className="hdr-brand-logo-container">
      {logoError ? (
        <img 
          src={fallbackUrl} 
          alt="AI Core" 
          style={{ width: '80%', height: '80%', objectFit: 'contain', animation: 'headerLogoFloat 4s ease-in-out infinite' }} 
          className="hdr-brand-logo-img"
        />
      ) : (
        <img
          src={logoUrl}
          alt="AI Assistant Logo"
          onError={() => setLogoError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'headerLogoFloat 4s ease-in-out infinite' }}
          className="hdr-brand-logo-img"
        />
      )}
    </div>
  );
}

const FALLBACK_MODELS = [];

/* 6 brand new ultra-modern themes — IDs match CSS class names (.theme-<id>) */
const THEMES = [
  { id: 'neon-prism',     label: '🌈 Holographic Prism' },
  { id: 'obsidian-amber', label: '🔥 Solar Amber'       },
  { id: 'cyber-neon',     label: '⚡ Neon Synthwave'     },
  { id: 'emerald-matrix', label: '🟢 Quantum Matrix'    },
  { id: 'cosmic-nebula',  label: '🌌 Cosmic Nebula'     },
  { id: 'pure-oled',      label: '⬛ OLED Stealth'      },
];

// Base Models available to Standard / Non-Admin users (clean, stable, untouched catalog)
// Sorted: fastest/smallest output first within each provider
// ── Non-Admin Standard Model Catalog ──────────────────────────────────────
// 3-4 tiers per provider: Efficient → Medium → All-Purpose → Powerful
// Sorted smallest→largest output tokens within each provider

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.8-pro',
  'gemini-3.7-flash',
  'gemini-3.7-flash-thinking',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemma-2-27b-it',
  'gemma-2-9b-it'
];

const OPENAI_MODELS = [
  'gpt-5.6-sol',
  'gpt-4o',
  'gpt-4o-mini',
  'o3-mini',
  'o1',
  'o1-mini',
  'gpt-4-turbo'
];

const ANTHROPIC_MODELS = [
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-opus-5',
  'claude-fable-5-1'
];

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'deepseek-ai/deepseek-v4-flash'
];

const OPENROUTER_MODELS = [
  'deepseek/deepseek-r1',
  'qwen/qwen-3.8-max',
  'qwen/qwen-2.5-coder-32b-instruct',
  'stepfun-ai/step-3.7-flash',
  'poolside/laguna-xs-2',
  'minimax/minimax-m3',
  'z-ai/glm-5.2',
  'moonshotai/kimi-k2.6',
  'openrouter/free'
];

const COHERE_MODELS = [
  'command-a-plus',
  'command-r-plus-08-2024',
  'command-r-08-2024',
  'command-light',
  'c4ai-aya-expanse-32b'
];

const MISTRAL_MODELS = [
  'mistral-large-latest',
  'mistral-medium-latest',
  'mistral-small-latest',
  'codestral-latest',
  'pixtral-large-latest',
  'open-mistral-7b'
];

const SAMBANOVA_MODELS = [
  'DeepSeek-R1-Distill-Llama-70B',
  'DeepSeek-V3',
  'Meta-Llama-3.1-405B-Instruct',
  'gpt-oss-120b'
];

const HUGGINGFACE_MODELS = [
  'HuggingFaceH4/zephyr-7b-beta',
  'Qwen/Qwen2.5-72B-Instruct',
  'deepseek-ai/DeepSeek-Coder-V2-Instruct'
];

const NVIDIA_MODELS = [
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'nvidia/nemotron-4-340b-instruct',
  'nvidia/mistral-nemo-12b-instruct',
  'nvidia/llama-3.2-11b-vision-instruct'
];

const META_MODELS = [
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-8b-instruct'
];

const MICROSOFT_MODELS = [
  'microsoft/phi-4',
  'microsoft/phi-3.5-moe-instruct',
  'microsoft/phi-3.5-mini-instruct'
];

const ZENMUX_MODELS = [
  'x-ai/grok-4.6',
  'x-ai/grok-4.5',
  'x-ai/grok-2-1212'
];

const CEREBRAS_MODELS = [
  'cerebras/llama-3.3-70b',
  'cerebras/llama-3.1-8b'
];

// Compatibility aliases
const STANDARD_GEMINI_MODELS = [...GEMINI_MODELS];
const STANDARD_OPENAI_MODELS = [...OPENAI_MODELS];
const STANDARD_ANTHROPIC_MODELS = [...ANTHROPIC_MODELS];
const STANDARD_GROQ_MODELS = [...GROQ_MODELS];
const STANDARD_MISTRAL_MODELS = [...MISTRAL_MODELS];
const STANDARD_OPENROUTER_MODELS = [...OPENROUTER_MODELS];
const STANDARD_COHERE_MODELS = [...COHERE_MODELS];
const STANDARD_ZENMUX_MODELS = [...ZENMUX_MODELS];
const STANDARD_CEREBRAS_MODELS = [...CEREBRAS_MODELS];
const STANDARD_NVIDIA_MODELS = [...NVIDIA_MODELS];
const STANDARD_META_MODELS = [...META_MODELS];
const STANDARD_MICROSOFT_MODELS = [...MICROSOFT_MODELS];
const STANDARD_SAMBANOVA_MODELS = [...SAMBANOVA_MODELS];
const STANDARD_HUGGINGFACE_MODELS = [...HUGGINGFACE_MODELS];

function syncTokensToEcosystemHub(app, tokensUsed, provider) {
  try {
    const tokens = Math.max(1, parseInt(tokensUsed || '0', 10));
    if (isNaN(tokens)) return;

    const appKey = `bhavya_ai_${app}_tokens`;
    const currentAppTokens = parseInt(localStorage.getItem(appKey) || '482150', 10);
    localStorage.setItem(appKey, (currentAppTokens + tokens).toString());

    const normProvider = (provider || 'gemini').toLowerCase();
    const providerKey = `bhavya_provider_${normProvider}_used`;
    const currentProviderUsed = parseInt(localStorage.getItem(providerKey) || '0', 10);
    localStorage.setItem(providerKey, (currentProviderUsed + tokens).toString());

    // ⚡ Direct Serverless Telemetry API Sync
    fetch('https://bhavyas-ai-hub.vercel.app/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: app, tokens: tokens, provider: normProvider })
    }).catch(err => console.warn('Telemetry API sync notice:', err));

  } catch(e) {
    console.warn('Telemetry bridge error:', e);
  }
}

export function getStoredUserMemories() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('bhavya_user_memory') || '';
    if (!raw) return [];
    // Auto-purge any stale facts regarding striver, harkirat, or dsa
    const filtered = raw.split('\n').filter(Boolean).filter(fact => {
      const lower = fact.toLowerCase();
      return !lower.includes('striver') && !lower.includes('harkirat') && !lower.includes('dsa') && !lower.includes('array');
    });
    if (filtered.length !== raw.split('\n').filter(Boolean).length) {
      if (filtered.length > 0) {
        localStorage.setItem('bhavya_user_memory', filtered.join('\n'));
      } else {
        localStorage.removeItem('bhavya_user_memory');
      }
    }
    return filtered;
  } catch (e) {
    return [];
  }
}

export function clearAllUserMemory() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bhavya_user_memory');
    }
  } catch (e) {}
}

function saveLearnedPreference(text) {
  if (!text || typeof localStorage === 'undefined') return;
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // If user requests to remove or forget memory, immediately purge it
  if (
    lower.includes('remove the data you saved') ||
    lower.includes('clear memory') ||
    lower.includes('clear my memory') ||
    lower.includes('forget me') ||
    lower.includes('delete my memory') ||
    lower.includes('forget everything') ||
    lower.includes('remove memory') ||
    lower.includes('delete memory') ||
    lower.includes('reset memory')
  ) {
    clearAllUserMemory();
    return;
  }

  // Only save if explicitly commanded with specific intent keywords
  if (
    lower.startsWith('remember that ') ||
    lower.startsWith('please remember ') ||
    lower.startsWith('save to memory ') ||
    lower.startsWith('always use ') ||
    lower.startsWith('my preferred stack is ')
  ) {
    try {
      const facts = getStoredUserMemories();
      const cleanFact = raw
        .replace(/^remember that\s+/i, '')
        .replace(/^please remember\s+/i, '')
        .replace(/^save to memory\s+/i, '')
        .trim();
      if (!facts.some(f => f.toLowerCase() === `• ${cleanFact}`.toLowerCase()) && cleanFact.length > 3) {
        facts.push(`• ${cleanFact}`);
        localStorage.setItem('bhavya_user_memory', facts.slice(-25).join('\n'));
      }
    } catch (e) {}
  }
}

const getCustomInstructions = (username) => {
  let memoryText = '';
  try {
    const facts = getStoredUserMemories();
    if (facts.length > 0) {
      memoryText = `\n\n[PERSISTENT LONG-TERM USER MEMORY & PREFERENCES]\nThe assistant has recorded these verified user traits and preferences across conversations:\n${facts.join('\n')}`;
    }
  } catch (e) {}

  return `[CURRENT USER PROFILE & SESSION IDENTITY]
• User: ${username || 'User'}
• Assistant: Bhavya's AI Assistant. Maintain a helpful, focused, direct relationship. Do not repeat the user's name in greetings or throughout answers.${memoryText}`;
};

const DEFAULT_CUSTOM_INSTRUCTIONS = getCustomInstructions('User');

const CORE_CHATGPT_RESPONSE_ENGINE = `
You are Bhavya's personal AI Assistant — an exceptionally clear, accurate, and helpful expert assistant.

══════════════════════════════════════════════════════════════════════════
🌟 CORE ACCURACY, CLEANLINESS & READABILITY CONTRACT:
══════════════════════════════════════════════════════════════════════════
1. 🎯 CLEAN, DIRECT ANSWERS FIRST:
   - Provide the direct answer or solution immediately without robotic templates.
   - NO FILLER OR CHEERLEADING: Never open with patronizing greetings ("Hello Bhavya Mishra! This is a wonderful start...", "Certainly!", "Great question!") or close with cheerleading outro lines ("You did a fantastic job! Keep it up!").
   - Do not repeat the user's name in the response.

2. 📖 EFFORTLESSLY READABLE FOR ANYONE (3RD CLASS STUDENT TO SENIOR ARCHITECT):
   - Explain concepts simply and intuitively using plain, direct language before introducing technical jargon.
   - Avoid walls of text. Keep paragraphs short (1 to 3 sentences maximum).
   - Use clean, well-spaced bullet points or numbered steps where each point conveys ONE clear idea.
   - NEVER spam emojis on every line or inside code identifiers. Use clean, plain formatting that is calm and effortless to read.

3. 🎯 COMPLETE WORKING CODE (WITH ADDED LINES IN GREEN):
   - "Don't remove important things in order to make the answer shorter or cleaner" — the user's primary goal is the complete, working code!
   - When code is shared, debugged, reviewed, or requested:
     a) Quick Diagnosis: 1-2 short bullet points stating what was wrong. Zero long essays.
     b) Complete Corrected Code: Provide the full, runnable code block.
        - STRICT BAN ON GIT JUNK: NEVER write git diff headers or hunk markers (such as '@@ -7,29 +7,30 @@', '--- a/main.cpp', '+++ b/main.cpp', or 'diff --git').
        - NEVER output removed lines with '-' (strictly adhere to: only show added/modified things in green, never show removed lines).
        - Mark newly added or modified lines by starting them with '+ ' so they are highlighted in bright GREEN. All unchanged lines have normal code syntax.
        - STRICT COMMENTING RULE: Use comments in the code ONLY on lines where you added or changed something (a brief 1-line explanation). DO NOT use comments everywhere or on unchanged code — excessive comments mess up and clutter the entire code.
        - Never truncate code with "..." or "// rest of logic".
     c) Simple Explanation: Explain why the fix works in simple, clean language so anyone can understand it easily, including Time & Space complexity ($O(N)$, $O(1)$) and key edge cases.

4. 📊 FACTUAL GROUNDING:
   - 100% accurate, precise, and verified. Never hallucinate or guess.
`;

const getSystemPrompts = (username) => ({
  soft: `[COACHING TONE: CLEAR & FRIENDLY MENTOR]
You are Bhavya's AI Assistant — a supportive, clear, and direct mentor.
- Direct, friendly, clean, and patient.
- Break down technical concepts into simple, intuitive ideas that anyone can understand.
- No patronizing cheerleading intros or outros. Go straight into the clean answer.
${CORE_CHATGPT_RESPONSE_ENGINE}`,

  moderate: `[COACHING TONE: PRAGMATIC SENIOR ENGINEER]
You are Bhavya's AI Assistant — a sharp, balanced, pragmatic Senior Staff Engineer.
- Objective, highly structured, articulate, and pragmatic.
- Focus on clarity, trade-offs, and clean production code.
- Clean bullet points, no walls of text, no fluff.
${CORE_CHATGPT_RESPONSE_ENGINE}`,

  brutal: `[COACHING TONE: DIRECT & RIGOROUS TECH LEAD]
You are Bhavya's AI Assistant — a rigorous, direct Tech Lead.
- 100% direct, zero fluff, zero sugarcoating.
- Focus on optimal complexity, edge cases, and clean code.
- No conversational pleasantries. Deliver the optimal solution immediately.
${CORE_CHATGPT_RESPONSE_ENGINE}`
});

function extractClarifyAndThinking(text) {
  if (!text) return { cleanText: '', thinking: '', parsedQuestion: null };

  let thinking = '';
  // Match complete <think>...</think> or <thought>...</thought>
  const completeThinkMatch = text.match(/<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/i);
  if (completeThinkMatch) {
    thinking = completeThinkMatch[1].trim();
  } else {
    // If thinking tag is opened but not closed yet
    const openThinkMatch = text.match(/<(?:think|thought)>([\s\S]*)/i);
    if (openThinkMatch) {
      thinking = openThinkMatch[1].trim();
    }
  }

  // Strip thinking tags from the text for final clean content
  let processedText = text.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, '');
  processedText = processedText.replace(/<(?:think|thought)>[\s\S]*/gi, '');

  const startTag = '<clarify>';
  const endTag = '</clarify>';
  
  const startIndex = processedText.indexOf(startTag);
  if (startIndex === -1) {
    return { cleanText: processedText.trim(), thinking, parsedQuestion: null };
  }
  
  const endIndex = processedText.indexOf(endTag, startIndex);
  if (endIndex === -1) {
    const insideSoFar = processedText.slice(startIndex + startTag.length).trim();
    if (insideSoFar.startsWith('{')) {
      return { cleanText: processedText.slice(0, startIndex).trim(), thinking, parsedQuestion: null };
    } else {
      const clean = processedText.replace(/<clarify>/gi, '').replace(/<\/clarify>/gi, '').trim();
      return { cleanText: clean, thinking, parsedQuestion: null };
    }
  }
  
  const rawTagContent = processedText.slice(startIndex + startTag.length, endIndex).trim();
  let parsedQuestion = null;
  if (rawTagContent.startsWith('{') && rawTagContent.endsWith('}')) {
    try {
      parsedQuestion = JSON.parse(rawTagContent);
    } catch (e) {
      parsedQuestion = { question: rawTagContent };
    }
  } else if (rawTagContent) {
    parsedQuestion = { question: rawTagContent };
  }
  
  const cleanTextCandidate = (processedText.slice(0, startIndex) + ' ' + processedText.slice(endIndex + endTag.length)).replace(/<clarify>[\s\S]*?<\/clarify>/gi, '').trim();
  const finalCleanText = cleanTextCandidate || (parsedQuestion ? (parsedQuestion.question || String(parsedQuestion)) : processedText.replace(/<clarify>/gi, '').replace(/<\/clarify>/gi, ''));

  return { cleanText: finalCleanText.trim(), thinking, parsedQuestion };
}

// Backwards compatibility alias
const extractClarifyTag = extractClarifyAndThinking;

function getOllamaUrl(path) {
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const base = isLocalHost ? '/api/ollama' : 'http://127.0.0.1:11434';
  return `${base}${path}`;
}
/* ── Animated typing cursor ─────────────────────────────── */
function TypingCursor() {
  return <span className="typing-cursor" aria-hidden="true" />;
}

/* ── Rotating thinking & processing messages ─────────────────────────── */
const THINKING_MESSAGES = [
  '🧠 AI is thinking & processing your request...',
  '⚡ Synthesizing response...',
  '🔍 Analyzing context & knowledge...',
  '💡 Assembling structured response...',
  '🚀 Processing model output...',
  '🌌 Connecting neural concepts...',
  '📚 Consulting knowledge base...',
  '⚙️ Computing answer at high speed...',
  '🎯 Formulating optimal recommendations...'
];

function ThinkingText() {
  const [idx, setIdx] = React.useState(() => Math.floor(Math.random() * THINKING_MESSAGES.length));
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % THINKING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 2px' }}>
      <div className="thinking-dots" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4d4d8', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#71717a', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
      </div>
      <span className="thinking-text" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', fontSize: '14.5px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.01em' }}>
        {THINKING_MESSAGES[idx]}
      </span>
    </div>
  );
}


export function isGitDiffHeader(line) {
  const trimmed = (line || '').trim();
  return /^(?:---|\+\+\+|@@|diff\s|index\s|[+-]{2,}|\+\s*\+{1,}|-\s*-{1,})/i.test(trimmed) ||
         trimmed.startsWith('@@') ||
         /@@\s*[-+\d,\s]+@@/.test(trimmed) ||
         /^[+-]?\s*(?:\+\+|--|[ab]\/).*?\b(?:main|\w+)\.\w+/.test(trimmed);
}

/* ═══════════════════════════════════════════════════════════
   PREMIUM VIBRANT MULTI-LANGUAGE SYNTAX HIGHLIGHTING ENGINE
═══════════════════════════════════════════════════════════ */
function highlightSyntax(rawCode, language) {
  if (!rawCode) return '';
  const lang = (language || '').toLowerCase().trim();

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 1. First Priority: Highlight.js Engine if available in browser
  if (typeof window !== 'undefined' && window.hljs) {
    try {
      const validLang = lang === 'html' || lang === 'xml' || lang === 'svg' ? 'xml' :
                        lang === 'js' || lang === 'javascript' ? 'javascript' :
                        lang === 'ts' || lang === 'typescript' ? 'typescript' :
                        lang === 'jsx' || lang === 'tsx' ? 'xml' :
                        lang === 'py' || lang === 'python' ? 'python' :
                        lang === 'css' || lang === 'scss' ? 'css' :
                        lang === 'json' ? 'json' :
                        lang === 'sh' || lang === 'bash' || lang === 'shell' ? 'bash' :
                        lang === 'sql' ? 'sql' :
                        lang === 'cpp' || lang === 'c++' ? 'cpp' :
                        lang === 'c' ? 'c' :
                        lang === 'java' ? 'java' :
                        lang === 'rust' || lang === 'rs' ? 'rust' :
                        lang === 'go' || lang === 'golang' ? 'go' : lang;

      let highlightedHtml = '';
      if (validLang && window.hljs.getLanguage(validLang)) {
        highlightedHtml = window.hljs.highlight(rawCode, { language: validLang, ignoreIllegals: true }).value;
      } else {
        highlightedHtml = window.hljs.highlightAuto(rawCode).value;
      }

      // Guarantee all hljs comments and any unhighlighted // comments render in vibrant green #4ade80
      highlightedHtml = highlightedHtml.replace(/class="hljs-comment([^"]*)"/g, 'class="hljs-comment$1 syn-comment" style="color: #4ade80 !important; font-style: italic !important;"');
      const lines = highlightedHtml.split('\n').map(l => {
        if (l.includes('class="hljs-comment') || l.includes('class="syn-comment')) return l;
        const idx = l.indexOf('//');
        if (idx !== -1) {
          const before = l.substring(0, idx);
          if (!before.endsWith(':') && !before.includes('http') && !before.includes('https') && !/<[^>]*$/.test(before)) {
            const comment = l.substring(idx);
            return before + '<span class="syn-comment" style="color: #4ade80 !important; font-style: italic !important;">' + comment + '</span>';
          }
        }
        return l;
      });
      return lines.join('\n');
    } catch(e) {
      console.warn('hljs error, fallback to native tokenizer:', e);
    }
  }

  // 2. High-Precision HTML / XML / SVG Fallback Tokenizer
  if (['html', 'xml', 'svg'].includes(lang) || (lang === '' && rawCode.trim().startsWith('<') && rawCode.trim().endsWith('>'))) {
    const escaped = escapeHtml(rawCode);
    return escaped.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE [^&gt;]+&gt;)|(&lt;\/?[a-zA-Z0-9\-:]+)|([a-zA-Z0-9\-:]+)(?=\=)|(="[^"]*"|='[^']*')|(&gt;|\/&gt;)/g, (m, comment, doctype, tag, attr, val, closeTag) => {
      if (comment) return '<span class="syn-comment" style="color: #4ade80; font-style: italic;">' + comment + '</span>';
      if (doctype) return '<span class="syn-doctype" style="color: #60a5fa; font-weight: 600;">' + doctype + '</span>';
      if (tag) return '<span class="syn-tag" style="color: #f472b6; font-weight: 600;">' + tag + '</span>';
      if (attr) return '<span class="syn-attr" style="color: #38bdf8; font-weight: 500;">' + attr + '</span>';
      if (val) return '<span class="syn-string" style="color: #4ade80;">' + val + '</span>';
      if (closeTag) return '<span class="syn-tag" style="color: #f472b6; font-weight: 600;">' + closeTag + '</span>';
      return m;
    });
  }

  // 2b. High-Precision CSS / SCSS Fallback Tokenizer
  if (['css', 'scss', 'less'].includes(lang) || (lang === '' && (rawCode.includes(':root') || rawCode.includes('{')) && !rawCode.includes('<html'))) {
    const escaped = escapeHtml(rawCode);
    return escaped.replace(/(\/\*[\s\S]*?\*\/)|(@[a-zA-Z-]+)|([.#]?[a-zA-Z0-9_-]+(?=\s*\{))|(--[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)(?=\s*:)|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|deg|fr)\b)|(:\s*[^;{}]+;)/g, (m, comment, atRule, selector, prop, hex, unit, val) => {
      if (comment) return '<span class="syn-comment" style="color: #4ade80; font-style: italic;">' + comment + '</span>';
      if (atRule) return '<span class="syn-keyword" style="color: #60a5fa; font-weight: 600;">' + atRule + '</span>';
      if (selector) return '<span class="syn-tag" style="color: #f472b6; font-weight: 600;">' + selector + '</span>';
      if (prop) return '<span class="syn-attr" style="color: #38bdf8; font-weight: 500;">' + prop + '</span>';
      if (hex) return '<span class="syn-string" style="color: #4ade80; font-weight: 500;">' + hex + '</span>';
      if (unit) return '<span class="syn-number" style="color: #f59e0b; font-weight: 600;">' + unit + '</span>';
      return m;
    });
  }

  // 3. High-Precision JSON Fallback Tokenizer
  if (lang === 'json') {
    const jsonRegex = /("(?:[^"\\]|\\.)*")(?:\s*:)?|(\b\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;
    let result = '';
    let lastIndex = 0;
    let match;
    while ((match = jsonRegex.exec(rawCode)) !== null) {
      result += escapeHtml(rawCode.substring(lastIndex, match.index));
      lastIndex = jsonRegex.lastIndex;
      const [full, str, num, bool] = match;
      if (str) {
        if (full.endsWith(':')) {
          result += '<span class="syn-key" style="color: #60a5fa; font-weight: 600;">' + escapeHtml(str) + '</span>:';
        } else {
          result += '<span class="syn-string" style="color: #4ade80;">' + escapeHtml(str) + '</span>';
        }
      } else if (num) {
        result += '<span class="syn-number" style="color: #f59e0b; font-weight: 600;">' + escapeHtml(num) + '</span>';
      } else if (bool) {
        result += '<span class="syn-constant" style="color: #fb923c; font-weight: 600;">' + escapeHtml(bool) + '</span>';
      }
    }
    result += escapeHtml(rawCode.substring(lastIndex));
    return result;
  }

  // 4. Multi-Language Lexer Fallback for JS, TS, Python, C++, etc.
  const KEYWORDS = new Set([
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'from',
    'as', 'implements', 'interface', 'package', 'private', 'protected', 'public',
    'static', 'type', 'enum', 'def', 'elif', 'except', 'pass', 'lambda', 'struct',
    'impl', 'fn', 'mut', 'pub', 'trait', 'where', 'select', 'insert', 'update', 'delete',
    'table', 'from', 'where', 'join', 'left', 'right', 'inner', 'group', 'by', 'order',
    'having', 'limit', 'create', 'alter', 'drop', 'primary', 'key', 'echo', 'set', 'get',
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'GROUP', 'ORDER'
  ]);

  const BUILTINS = new Set([
    'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON',
    'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Error', 'TypeError',
    'console', 'window', 'document', 'navigator', 'localStorage', 'sessionStorage',
    'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
    'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext',
    'print', 'len', 'range', 'dict', 'list', 'tuple', 'int', 'str', 'float', 'bool', 'self',
    'process', 'Buffer', 'require', 'module', 'exports'
  ]);

  const CONSTANTS = new Set([
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'nil', 'None', 'True', 'False'
  ]);

  const commentPattern = ['py', 'python', 'sh', 'bash', 'shell', 'yaml', 'yml', 'r'].includes(lang) 
    ? '(#.*$|\\/\\/.*$)' 
    : (lang === 'sql' ? '(--.*$|\\/\\/.*$)' : '(\\/\\/.*$)');

  const tokenRegex = new RegExp('(\\/\\*[\\s\\S]*?\\*\\/)|' + commentPattern + '|(`(?:[^`\\\\]|\\\\.)*`)|("(?:[^"\\\\]|\\\\.)*")|(\'(?:[^\'\\\\]|\\\\.)*\')|(\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?(?:ms|px|rem|em|%|s)?\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)|(=>|===|!==|==|!=|<=|>=|&&|\\|\\||\\+\\+|--|\\+=|-=|\\*=|\\/=|[-+*/%&|^!=<>?:])', 'gm');

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(rawCode)) !== null) {
    const textBefore = rawCode.substring(lastIndex, match.index);
    if (textBefore) {
      result += escapeHtml(textBefore);
    }
    lastIndex = tokenRegex.lastIndex;

    const [fullMatch, multiComment, singleComment, tmplString, doubleString, singleString, num, ident, op] = match;

    if (multiComment || singleComment) {
      result += '<span class="syn-comment" style="color: #4ade80 !important; font-style: italic !important;">' + escapeHtml(fullMatch) + '</span>';
    } else if (tmplString || doubleString || singleString) {
      result += '<span class="syn-string" style="color: #4ade80;">' + escapeHtml(fullMatch) + '</span>';
    } else if (num) {
      result += '<span class="syn-number" style="color: #f59e0b; font-weight: 600;">' + escapeHtml(fullMatch) + '</span>';
    } else if (ident) {
      if (CONSTANTS.has(ident)) {
        result += '<span class="syn-constant" style="color: #fb923c; font-weight: 600;">' + escapeHtml(ident) + '</span>';
      } else if (KEYWORDS.has(ident) || KEYWORDS.has(ident.toLowerCase())) {
        result += '<span class="syn-keyword" style="color: #60a5fa; font-weight: 600;">' + escapeHtml(ident) + '</span>';
      } else if (BUILTINS.has(ident) || BUILTINS.has(ident.toUpperCase())) {
        result += '<span class="syn-builtin" style="color: #c084fc; font-weight: 600;">' + escapeHtml(ident) + '</span>';
      } else {
        const rest = rawCode.substring(lastIndex);
        const isFnCall = /^\s*\(/.test(rest);
        if (isFnCall) {
          result += '<span class="syn-function" style="color: #38bdf8; font-weight: 600;">' + escapeHtml(ident) + '</span>';
        } else {
          result += '<span class="syn-ident" style="color: #f1f5f9;">' + escapeHtml(ident) + '</span>';
        }
      }
    } else if (op) {
      result += '<span class="syn-operator" style="color: #cbd5e1; font-weight: 500;">' + escapeHtml(fullMatch) + '</span>';
    } else {
      result += escapeHtml(fullMatch);
    }
  }

  const remaining = rawCode.substring(lastIndex);
  if (remaining) {
    result += escapeHtml(remaining);
  }

  return result;
}

function renderMarkdown(text) {
  if (!text) return '';

  // Smart Product Link Enhancer: Ensure Amazon / Flipkart links point directly to product search pages
  let currentProdName = '';
  const inputLines = text.split('\n');
  const processedInputLines = inputLines.map(line => {
    const headingMatch = line.match(/^(?:###?\s*(?:\d+\.|\*|-)?\s*|\*\*\s*\d+\.|\*\*\s*)([A-Za-z0-9\s\-\+\/\(\)]+?)(?:\*\*|$|:)/);
    if (headingMatch && headingMatch[1] && headingMatch[1].trim().length > 3) {
      const candidate = headingMatch[1].replace(/^(Key Specs|Pros|Cons|Buy Links|Summary|Option|Model)\b/i, '').trim();
      if (candidate.length > 2) currentProdName = candidate;
    }

    return line.replace(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:amazon\.in|flipkart\.com|amazon\.com))(?:\/|\/s|\/search)?\)/gi, (match, label, baseUrl) => {
      const query = encodeURIComponent(currentProdName || label || 'product');
      if (baseUrl.includes('amazon')) {
        return `[${label}](https://www.amazon.in/s?k=${query})`;
      } else if (baseUrl.includes('flipkart')) {
        return `[${label}](https://www.flipkart.com/search?q=${query})`;
      }
      return match;
    });
  });
  text = processedInputLines.join('\n');

  function parseInline(str) {
    if (!str) return '';
    let res = str;

    const inlineMathPlaceholders = [];
    // 1. Extract inline math ($...$ or \(...\)) safely before HTML escaping & markdown formatting
    res = res.replace(/(?:\$([^\$\n\r]+?)\$|\\\(([\s\S]*?)\\\))/g, (match, eq1, eq2) => {
      const eq = (eq1 || eq2 || '').trim();
      const ph = `KATEXINLINEPH${inlineMathPlaceholders.length}Z`;
      let rendered = `$${eq}$`;
      if (typeof window !== 'undefined' && window.katex) {
        try {
          rendered = window.katex.renderToString(eq, { displayMode: false, throwOnError: false });
        } catch (e) {
          rendered = `$${eq}$`;
        }
      }
      inlineMathPlaceholders.push(rendered);
      return ph;
    });

    // 2. Escape raw HTML for normal text safely
    res = res
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 3. Auto-convert scientific/engineering variable subscripts like R_A, R_B, R_C, V_in, I_out, R_12 to <sub>...</sub>
    res = res.replace(/\b([A-Za-z])_([A-Za-z0-9+]+)\b/g, '$1<sub>$2</sub>');
    res = res.replace(/\b([A-Za-z])\^([0-9+]+)\b/g, '$1<sup>$2</sup>');

    // 4. Markdown formatting (images, code, bold, italics, links)
    res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="md-image-wrapper" style="margin: 10px 0; text-align: center;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 4px 16px rgba(0,0,0,0.3);" loading="lazy" /><div style="font-size: 11px; color: #a1a1aa; margin-top: 4px; font-style: italic;">$1</div></div>');
    res = res.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
    res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    res = res.replace(/_([^_]+)_/g, '<em>$1</em>');
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // 5. Restore preserved unescaped KaTeX HTML safely
    inlineMathPlaceholders.forEach((html, idx) => {
      res = res.split(`KATEXINLINEPH${idx}Z`).join(html);
    });

    return res;
  }

  const codeBlocks = [];

  // 1. Pre-process text: normalize blockquoted code fences (e.g. `> ```html` or `   ```html`)
  let processedText = text.replace(/^[ \t]*>[ \t]*(`{3,})/gm, '$1');

  const createCodeBlock = (rawCode, langOpt) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    let lang = (langOpt || '').trim().toLowerCase();
    let cleanCode = rawCode;
    
    // Strip residual blockquote prefixes from code lines if present
    const rawLines = cleanCode.split('\n');
    if (rawLines.length > 0 && rawLines.every(l => l.trim() === '' || l.trim().startsWith('>'))) {
      cleanCode = rawLines.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
    }

    if (cleanCode.startsWith('\n')) {
      cleanCode = cleanCode.substring(1);
    }
    cleanCode = cleanCode.trim();

    // Auto-detect language if missing
    if (!lang) {
      if (/<!DOCTYPE html|<html|<head|<body|<div|<style/i.test(cleanCode)) lang = 'html';
      else if (/#include\b|using namespace\b|\bcout\b|\bcin\b|\bstd::|\bvector<|\bSolution\b|\bint main\b|\bvoid main\b|\bnullptr\b|\bpush_back\b/m.test(cleanCode)) lang = 'cpp';
      else if (/^(?:import|export|const|let|var|function)\b/m.test(cleanCode)) lang = 'javascript';
      else if (/^def\s+\w+|^import\s+\w+|\bself\b|\belif\b|\bprint\(/m.test(cleanCode)) lang = 'python';
      else if (/:root\s*\{|[a-z0-9_-]+\s*\{[^}]*:[^}]*\}/i.test(cleanCode)) lang = 'css';
      else if (/SELECT\b|INSERT\s+INTO|CREATE\s+TABLE|ALTER\s+TABLE/i.test(cleanCode)) lang = 'sql';
      else if (/public\s+class|System\.out\.println/i.test(cleanCode)) lang = 'java';
    }
    
    if (lang === 'mermaid') {
      const escapedMermaid = cleanCode
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlocks.push(`
        <div class="mermaid-container" style="background: #121214; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 12px 0; overflow-x: auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 11.5px; color: #ffffff; font-weight: bold; border-bottom: 1px dashed #27272a; padding-bottom: 6px;">
            <span>📊 Interactive Mermaid Diagram</span>
            <button class="code-action-btn btn-copy-code" data-code="${escapedMermaid}" style="padding: 2px 8px; font-size: 10px;">Copy Diagram Code</button>
          </div>
          <div class="mermaid-render">${cleanCode}</div>
        </div>
      `);
      return `\n${placeholder}\n`;
    }

    const escapeCodeLine = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const isDiffOrModified = lang === 'diff' || (
      cleanCode.split('\n').some(l => isGitDiffHeader(l) || /^[+-]\s?/.test(l)) &&
      (cleanCode.includes('\n+') || cleanCode.includes('\n-') || /^[+-]\s?/.test(cleanCode) || cleanCode.includes('@@'))
    );
    if (isDiffOrModified) {
      const lines = cleanCode.split('\n');
      const filteredLines = [];
      for (const line of lines) {
        // Skip git diff headers (e.g. `--- a/...`, `+++ b/...`, `@@ -7,29 ... @@`, `+ ++ b/...`, etc.)
        if (isGitDiffHeader(line)) continue;
        // User request: "Don't show the removed lines. Only shows the added things with green."
        if (line.startsWith('-')) continue;
        filteredLines.push(line);
      }

      // If lang was 'diff' or unspecified, detect underlying language for syntax highlighting
      let codeLang = (lang && lang !== 'diff') ? lang : '';
      if (!codeLang) {
        const fullFiltered = filteredLines.map(l => l.startsWith('+') ? l.replace(/^\+\s?/, '') : l).join('\n');
        if (/#include\b|using namespace\b/m.test(fullFiltered)) codeLang = 'cpp';
        else if (/^def\s+\w+|^import\s+\w+/m.test(fullFiltered)) codeLang = 'python';
        else if (/^(?:import|export|const|let|var|function)\b/m.test(fullFiltered)) codeLang = 'javascript';
        else if (/<!DOCTYPE html|<html|<body/i.test(fullFiltered)) codeLang = 'html';
        else if (/:root\s*\{/i.test(fullFiltered)) codeLang = 'css';
      }

      const diffFormatted = filteredLines.map(line => {
        if (line.startsWith('+')) {
          const displayLine = line.replace(/^\+\s?/, '');
          const highlighted = codeLang ? highlightSyntax(displayLine, codeLang) : escapeCodeLine(displayLine);
          return `<div class="diff-line diff-add" style="background: rgba(34, 197, 94, 0.16); color: #4ade80; padding: 2px 10px; border-left: 3px solid #22c55e; font-weight: 600; font-family: inherit; margin: 1px 0; border-radius: 2px;"><span style="color: #22c55e; font-weight: bold; margin-right: 6px; user-select: none;">+</span>${highlighted}</div>`;
        }
        const highlighted = codeLang ? highlightSyntax(line, codeLang) : escapeCodeLine(line);
        return `<div class="diff-line diff-context" style="padding: 2px 10px; opacity: 0.9; color: #cbd5e1; font-family: inherit;">${highlighted}</div>`;
      }).join('');

      const cleanForCopy = filteredLines.map(l => l.startsWith('+') ? l.replace(/^\+\s?/, '') : l).join('\n');
      const escapedCleanForCopy = cleanForCopy
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      codeBlocks.push(`
        <div class="diff-block-container" style="background: #09090b; border: 1px solid #27272a; border-radius: 10px; margin: 12px 0; overflow: hidden; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.6;">
          <div style="background: rgba(255,255,255,0.03); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #27272a; font-size: 11.5px; color: #ffffff; font-weight: bold;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
              <span>Updated Code (<span style="color: #4ade80; font-weight: bold;">Added / Modified in Green</span>)</span>
            </div>
            <button class="code-action-btn btn-copy-code" data-code="${escapedCleanForCopy}" style="padding: 2px 8px;">Copy Code</button>
          </div>
          <div style="padding: 8px 0; overflow-x: auto;">${diffFormatted}</div>
        </div>
      `);
      return `\n${placeholder}\n`;
    }

    // Standard code block fallback — strip any residual git headers or removed lines as well
    const sanitizedCleanCode = cleanCode
      .split('\n')
      .filter(line => !isGitDiffHeader(line) && !line.startsWith('-'))
      .join('\n');

    const escapedCode = sanitizedCleanCode
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const htmlContent = highlightSyntax(sanitizedCleanCode, lang);

    let overlayHtml = `<div class="code-block-header">
      <span class="code-block-lang">${lang || 'code'}</span>
      <div class="code-block-actions">
        <button class="code-action-btn btn-copy-code" data-code="${escapedCode}" title="Copy code">Copy</button>
      </div>
    </div>`;

    codeBlocks.push(`<div class="md-code-block-container">${overlayHtml}<pre class="md-code-block"><code class="hljs language-${lang || 'plaintext'}" data-highlighted="yes">${htmlContent}</code></pre></div>`);
    return `\n${placeholder}\n`;
  };

  // 2. Extract standard and multi-backtick closed code blocks (supports ``` or ````)
  processedText = processedText.replace(/(`{3,})([a-zA-Z0-9_\-\+]*)\s*\n([\s\S]*?)\n[ \t]*\1/g, (match, fence, langOpt, p1) => {
    return createCodeBlock(p1, langOpt);
  });

  // Handle standard 3-backtick without requiring trailing newline before close
  processedText = processedText.replace(/```([a-zA-Z0-9_\-\+]*)([\s\S]*?)```/g, (match, langOpt, p1) => {
    return createCodeBlock(p1, langOpt);
  });

  // Handle unclosed code blocks (e.g. streaming or truncated)
  processedText = processedText.replace(/```([a-zA-Z0-9_\-\+]*)([\s\S]*?)$/g, (match, langOpt, p1) => {
    return createCodeBlock(p1, langOpt);
  });

  // 3. Safety Net: Auto-detect raw un-fenced HTML documents (<!DOCTYPE html> ... </html> or <html> ... </html>)
  processedText = processedText.replace(/(?:^|\n)(<!DOCTYPE html[\s\S]*?<\/html>)/gi, (match, htmlCode) => {
    return createCodeBlock(htmlCode, 'html');
  });
  processedText = processedText.replace(/(?:^|\n)(<html(?:\s+[^>]*?)?>[\s\S]*?<\/html>)/gi, (match, htmlCode) => {
    return createCodeBlock(htmlCode, 'html');
  });

  // 4. Safety Net: Auto-detect raw un-fenced <style> or <script> blocks
  processedText = processedText.replace(/(?:^|\n)(<style[\s\S]*?<\/style>)/gi, (match, styleCode) => {
    return createCodeBlock(styleCode, 'html');
  });
  processedText = processedText.replace(/(?:^|\n)(<script[\s\S]*?<\/script>)/gi, (match, scriptCode) => {
    return createCodeBlock(scriptCode, 'javascript');
  });

  // 5. Safety Net: Auto-detect raw un-fenced C++ programs (#include <...> up to main / Solution / return 0)
  processedText = processedText.replace(/(?:^|\n)(#include\s*<[^>]+>[\s\S]*?(?:return\s+0;?\s*\}|\}\s*;?\s*$))/g, (match, cppCode) => {
    return createCodeBlock(cppCode, 'cpp');
  });

  // Extract Block Math ($$...$$ and \[...\]) before line processing
  const mathBlocks = [];
  processedText = processedText.replace(/(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g, (match, eq1, eq2) => {
    const eq = (eq1 || eq2 || '').trim();
    const placeholder = `__MATH_BLOCK_PLACEHOLDER_${mathBlocks.length}__`;
    let mathHtml = `<div class="katex-display-block">$$${eq}$$</div>`;
    if (typeof window !== 'undefined' && window.katex) {
      try {
        mathHtml = `<div class="katex-display-block">${window.katex.renderToString(eq, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {}
    }
    mathBlocks.push(mathHtml);
    return `\n${placeholder}\n`;
  });

  const lines = processedText.split('\n');
  const resultBlocks = [];
  let currentList = null;
  let currentTable = null;
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushList = () => {
    if (currentList) {
      const tag = currentList.type;
      const lis = currentList.items.map(item => {
        const styleStr = item.indent > 0 ? ` style="margin-left: ${item.indent * 8}px"` : '';
        if (tag === 'ol') {
          return `<li value="${item.index}"${styleStr}>${parseInline(item.content)}</li>`;
        }
        return `<li${styleStr}>${parseInline(item.content)}</li>`;
      }).join('');
      resultBlocks.push(`<${tag} class="md-${tag}">${lis}</${tag}>`);
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      let html = '<div class="md-table-wrapper"><table class="md-table">';
      if (currentTable.headers.length > 0) {
        html += '<thead><tr>';
        currentTable.headers.forEach((h, i) => {
          const align = currentTable.alignments[i] || 'left';
          html += `<th style="text-align: ${align}">${parseInline(h)}</th>`;
        });
        html += '</tr></thead>';
      }
      if (currentTable.rows.length > 0) {
        html += '<tbody>';
        currentTable.rows.forEach(row => {
          html += '<tr>';
          row.forEach((cell, i) => {
            const align = currentTable.alignments[i] || 'left';
            html += `<td style="text-align: ${align}">${parseInline(cell)}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody>';
      }
      html += '</table></div>';

      // Check if table contains numbers for interactive Chart Visualizer
      const containsNumbers = currentTable.rows.some(r => r.some(c => !isNaN(parseFloat(c.replace(/[^0-9.-]/g, '')))));
      if (containsNumbers) {
        const encHeaders = encodeURIComponent(JSON.stringify(currentTable.headers));
        const encRows = encodeURIComponent(JSON.stringify(currentTable.rows));
        html += `<div class="interactive-chart-box" style="margin-top: 10px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid #27272a;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #ffffff;">📊 Visual Chart:</span>
            <button class="btn-render-chart" data-type="bar" data-headers="${encHeaders}" data-rows="${encRows}" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-weight: 600;">📊 Bar</button>
            <button class="btn-render-chart" data-type="line" data-headers="${encHeaders}" data-rows="${encRows}" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-weight: 600;">📈 Line</button>
            <button class="btn-render-chart" data-type="pie" data-headers="${encHeaders}" data-rows="${encRows}" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-weight: 600;">🍕 Pie</button>
          </div>
          <div class="chart-canvas-container" style="display: none; height: 220px; position: relative;">
            <canvas class="chart-render-canvas"></canvas>
          </div>
        </div>`;
      }

      resultBlocks.push(html);
      currentTable = null;
    }
  };

  const flushBlockquote = () => {
    if (inBlockquote) {
      if (blockquoteLines.length > 0) {
        const fullContent = blockquoteLines.join('\n');
        const alertMatch = fullContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/i);
        if (alertMatch) {
          const type = alertMatch[1].toUpperCase();
          const body = alertMatch[2];
          const icons = {
            NOTE: 'ℹ️',
            TIP: '💡',
            IMPORTANT: '📌',
            WARNING: '⚠️',
            CAUTION: '🚨'
          };
          resultBlocks.push(`<div class="md-alert md-alert--${type.toLowerCase()}"><div class="md-alert-header"><span class="md-alert-icon">${icons[type] || 'ℹ️'}</span><span class="md-alert-title">${type}</span></div><div class="md-alert-body">${renderMarkdown(body)}</div></div>`);
        } else {
          resultBlocks.push(`<blockquote class="md-blockquote">${renderMarkdown(fullContent)}</blockquote>`);
        }
      }
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const flushAll = () => {
    flushList();
    flushTable();
    flushBlockquote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('__CODE_BLOCK_PLACEHOLDER_')) {
      flushAll();
      const match = trimmed.match(/\d+/);
      if (match) {
        const index = parseInt(match[0], 10);
        if (codeBlocks[index]) resultBlocks.push(codeBlocks[index]);
      }
      continue;
    }

    if (trimmed.startsWith('__MATH_BLOCK_PLACEHOLDER_')) {
      flushAll();
      const match = trimmed.match(/\d+/);
      if (match) {
        const index = parseInt(match[0], 10);
        if (mathBlocks[index]) resultBlocks.push(mathBlocks[index]);
      }
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushList();
      flushTable();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^\s*>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
      // Current non-quote line falls through to be processed normally below
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushAll();
      resultBlocks.push('<hr class="md-hr" />');
      continue;
    }

    const headerMatch = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushAll();
      const level = headerMatch[2].length;
      const content = headerMatch[3].trim();
      resultBlocks.push(`<h${level} class="md-h${level}">${parseInline(content)}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

    if (ulMatch) {
      flushTable();
      flushBlockquote();
      const indent = ulMatch[1].length;
      const content = ulMatch[3].trim();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [{ content, indent }] };
      } else {
        currentList.items.push({ content, indent });
      }
      continue;
    }

    if (olMatch) {
      flushTable();
      flushBlockquote();
      const indent = olMatch[1].length;
      const indexValue = parseInt(olMatch[2], 10);
      const content = olMatch[3].trim();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [{ content, indent, index: indexValue }] };
      } else {
        currentList.items.push({ content, indent, index: indexValue });
      }
      continue;
    }

    const hasPipes = trimmed.includes('|');
    const isTableLine = hasPipes && (
      (trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.split('|').length >= 3)) ||
      (trimmed.split('|').length >= 3)
    );

    if (isTableLine) {
      flushList();
      flushBlockquote();
      
      let cleanLine = trimmed;
      if (cleanLine.startsWith('|')) cleanLine = cleanLine.slice(1);
      if (cleanLine.endsWith('|')) cleanLine = cleanLine.slice(0, -1);
      
      const cells = cleanLine.split('|').map(c => c.trim());
      const isSeparator = cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c) || c.replace(/[:\-]/g, '').trim() === '');

      if (isSeparator) {
        if (currentTable) {
          currentTable.alignments = cells.map(c => {
            if (c.startsWith(':') && c.endsWith(':')) return 'center';
            if (c.endsWith(':')) return 'right';
            return 'left';
          });
        }
      } else {
        if (!currentTable) {
          currentTable = { headers: cells, rows: [], alignments: [] };
        } else {
          currentTable.rows.push(cells);
        }
      }
      continue;
    }

    if (trimmed === '') {
      flushAll();
      continue;
    }

    flushAll();
    resultBlocks.push(`<p class="md-p">${parseInline(trimmed)}</p>`);
  }

  flushAll();
  return resultBlocks.join('\n');
}

function categorizeModels(modelList) {
  const categories = {
    fast: {
      title: '⚡ Flash / Low Tasks',
      desc: 'Fast, lightweight models for quick answers and low VRAM usage.',
      items: []
    },
    balanced: {
      title: '✨ Pro / All-Round Balance',
      desc: 'High-quality reasoning, general text tasks, and math.',
      items: []
    },
    specialized: {
      title: '🔥 Ultra / Specialized Coding',
      desc: 'Top-tier coding capabilities, vision processing, and deep logic.',
      items: []
    }
  };

  modelList.forEach(m => {
    const name = m.toLowerCase();
    if (name.includes('coder') || name.includes('code') || name.includes('vision') || name.includes('minicpm')) {
      categories.specialized.items.push(m);
    } else if (name.includes('mini') || name.includes('flash') || name.includes('lite') || 
               name.includes('3b') || name.includes('2b') || name.includes('1.5b') || 
               name.includes('moondream') || name.includes('phi3') || name.includes('phi4')) {
      categories.fast.items.push(m);
    } else {
      categories.balanced.items.push(m);
    }
  });

  return categories;
}

function getBestModelForTier(tier, allModels) {
  if (!allModels || allModels.length === 0) return '';
  const lowerModels = allModels.map(m => ({ original: m, lower: m.toLowerCase() }));

  if (tier === 'flash-lite') {
    // ⚡ FAST MODE CHAMPION: #1 llama-3.1-8b-instant (Groq LPU 850 tok/s)
    const targets = [
      'llama-3.1-8b-instant',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-3.7-flash',
      'openrouter/free'
    ];
    for (const target of targets) {
      const match = lowerModels.find(m => m.lower === target || m.lower.endsWith('/' + target) || m.lower.includes(target));
      if (match) return match.original;
    }
    const fastCat = lowerModels.filter(m => m.lower.includes('mini') || m.lower.includes('flash') || m.lower.includes('8b') || m.lower.includes('3b'));
    if (fastCat.length > 0) return fastCat[0].original;
    return allModels[0];
  }

  if (tier === 'flash') {
    // ⚖️ BALANCED MODE CHAMPION: #1 gemini-3.7-flash (Multimodal & Fast)
    const targets = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gpt-4o',
      'gemini-2.5-flash',
      'llama-3.3-70b-versatile',
      'claude-3-7-sonnet-latest',
      'openrouter/free'
    ];
    for (const target of targets) {
      const match = lowerModels.find(m => m.lower === target || (m.lower.includes(target) && !m.lower.includes('-lite')));
      if (match) return match.original;
    }
    const balancedCat = lowerModels.filter(m => !m.lower.includes('lite') && (m.lower.includes('70b') || m.lower.includes('flash') || m.lower.includes('4o')));
    if (balancedCat.length > 0) return balancedCat[0].original;
    return allModels[Math.min(allModels.length - 1, 1)] || allModels[0];
  }

  if (tier === 'pro') {
    // 🧠 DEEP THINKING CHAMPION: #1 deepseek/deepseek-r1 (671B CoT Reasoning)
    const targets = [
      'gemini-3.8-pro',
      'deepseek/deepseek-r1',
      'claude-opus-5',
      'gemini-2.5-pro',
      'gpt-5.6-turbo',
      'openrouter/free'
    ];
    for (const target of targets) {
      const match = lowerModels.find(m => m.lower === target || m.lower.includes(target));
      if (match) return match.original;
    }
    const proCat = lowerModels.filter(m => m.lower.includes('r1') || m.lower.includes('opus') || m.lower.includes('pro') || m.lower.includes('coder'));
    if (proCat.length > 0) return proCat[0].original;
    return allModels[allModels.length - 1];
  }

  return allModels[0];
}

function groupModelsByProvider(modelList, geminiModels = [], groqModels = [], openRouterModels = [], cohereModels = [], mistralModels = [], sambaNovaModels = [], huggingFaceModels = [], nvidiaModels = [], zenmuxModels = [], anthropicModels = [], openaiModels = [], cerebrasModels = [], metaModels = [], microsoftModels = []) {
  const groups = {
    gemini: { title: '♊ Gemini API', items: [] },
    openai: { title: '🟢 OpenAI API', items: [] },
    anthropic: { title: '🔮 Anthropic API', items: [] },
    groq: { title: '⚡ Groq API', items: [] },
    openrouter: { title: '🌐 OpenRouter API', items: [] },
    cohere: { title: '🌀 Cohere API', items: [] },
    mistral: { title: '🛡️ Mistral AI', items: [] },
    sambanova: { title: '🧠 SambaNova API', items: [] },
    huggingface: { title: '🤗 Hugging Face API', items: [] },
    nvidia: { title: '🟩 NVIDIA NIM API', items: [] },
    meta: { title: '♾️ Meta Llama API (NVIDIA NIM)', items: [] },
    microsoft: { title: '🪟 Microsoft Phi API (NVIDIA NIM)', items: [] },
    zenmux: { title: '✖️ ZenMux API', items: [] },
    cerebras: { title: '🧠 Cerebras AI', items: [] },
  };

  modelList.forEach(m => {
    const name = m.toLowerCase();
    const addOnce = (groupKey) => {
      if (groups[groupKey] && !groups[groupKey].items.includes(m)) {
        groups[groupKey].items.push(m);
      }
    };

    // 1. Direct explicit catalog array checks
    if (geminiModels.includes(m)) {
      addOnce('gemini');
    } else if (openaiModels.includes(m)) {
      addOnce('openai');
    } else if (anthropicModels.includes(m)) {
      addOnce('anthropic');
    } else if (groqModels.includes(m)) {
      addOnce('groq');
    } else if (openRouterModels.includes(m)) {
      addOnce('openrouter');
    } else if (cohereModels.includes(m)) {
      addOnce('cohere');
    } else if (mistralModels.includes(m)) {
      addOnce('mistral');
    } else if (sambaNovaModels.includes(m)) {
      addOnce('sambanova');
    } else if (huggingFaceModels.includes(m)) {
      addOnce('huggingface');
    } else if (nvidiaModels.includes(m)) {
      addOnce('nvidia');
    } else if (metaModels.includes(m)) {
      addOnce('meta');
    } else if (microsoftModels.includes(m)) {
      addOnce('microsoft');
    } else if (zenmuxModels.includes(m)) {
      addOnce('zenmux');
    } else if (cerebrasModels.includes(m)) {
      addOnce('cerebras');
    } 
    // 2. Prefix & Substring fallbacks for dynamically added models
    else if (name.startsWith('meta/')) {
      addOnce('meta');
    } else if (name.startsWith('microsoft/')) {
      addOnce('microsoft');
    } else if (name.startsWith('nvidia/')) {
      addOnce('nvidia');
    } else if (name.includes('cerebras')) {
      addOnce('cerebras');
    } else if (name.includes('claude')) {
      addOnce('anthropic');
    } else if (name.startsWith('gpt-') || name.startsWith('o1') || name.startsWith('o3') || name.startsWith('o4')) {
      addOnce('openai');
    } else if (name.includes('groq')) {
      addOnce('groq');
    } else if (name.includes('gemini') || name.includes('gemma')) {
      addOnce('gemini');
    } else if (name.includes('command') || name.includes('aya')) {
      addOnce('cohere');
    } else if (name.includes('mistral') || name.includes('codestral') || name.includes('pixtral')) {
      addOnce('mistral');
    } else if (name.includes('/')) {
      addOnce('openrouter');
    } else {
      addOnce('gemini');
    }
  });

  return groups;
}


function MessageBubble({ msg, index, total, isGenerating, copiedId, editingId, editText, userAvatar,
  onCopy, onSpeak, onRegenerate, onStartEdit, onSaveEdit, onCancelEdit, onEditTextChange, onCodeBlockClick, onExportPDF, onExportPPTX, onExportDOCX, onSwitchVersion, onInspectDocSource }) {
  const isUser    = msg.role === 'user';
  const isEditing = editingId === msg.id;
  const isEmpty   = msg.content === '' && isGenerating && index === total - 1;
  const hasVersions = msg.versions && msg.versions.length > 1;
  const versionIndex = msg.versionIndex || 0;
  const totalVersions = hasVersions ? msg.versions.length : 1;



  // Extract Deep Research Protocol if present
  let hasDeepResearch = false;
  let researchJourneyText = '';
  let displayContent = msg.displayContent || msg.content || '';

  if (!isUser && displayContent.includes('<deep_research_journey>')) {
    const match = displayContent.match(/<deep_research_journey>([\s\S]*?)<\/deep_research_journey>/i);
    if (match) {
      hasDeepResearch = true;
      researchJourneyText = match[1].trim();
      displayContent = displayContent.replace(/<deep_research_journey>[\s\S]*?<\/deep_research_journey>/i, '').trim();
    }
  }

  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--bot'}`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="avatar avatar--bot" style={{ overflow: 'hidden', padding: 0 }}>
          <img src="/logo.png" alt="Assistant Logo" className="avatar-icon-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          <div className="avatar-ring" />
        </div>
      )}

      <div className="msg-col">
        {/* Role label with Version Rewind Carousel (ChatGPT / Claude Parity) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="msg-role-label" style={{
            marginBottom: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: isUser ? '#38bdf8' : '#a1a1aa',
            fontWeight: 600,
            fontSize: '12px'
          }}>
            {isUser ? '👤 You (Your Question)' : '🤖 AI Assistant'}
          </span>
          {hasVersions && (
            <div className="msg-version-paginator" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#a1a1aa',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              padding: '1px 8px'
            }}>
              <button
                disabled={versionIndex <= 0}
                onClick={() => onSwitchVersion && onSwitchVersion(msg.id, versionIndex - 1)}
                style={{
                  background: 'none', border: 'none', color: versionIndex <= 0 ? 'rgba(255,255,255,0.2)' : '#d4d4d8',
                  cursor: versionIndex <= 0 ? 'default' : 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center'
                }}
                title="Previous version"
              >
                ◀
              </button>
              <span>{versionIndex + 1} / {totalVersions}</span>
              <button
                disabled={versionIndex >= totalVersions - 1}
                onClick={() => onSwitchVersion && onSwitchVersion(msg.id, versionIndex + 1)}
                style={{
                  background: 'none', border: 'none', color: versionIndex >= totalVersions - 1 ? 'rgba(255,255,255,0.2)' : '#d4d4d8',
                  cursor: versionIndex >= totalVersions - 1 ? 'default' : 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center'
                }}
                title="Next version"
              >
                ▶
              </button>
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>
          {((msg.images && msg.images.length > 0) || msg.image) && (
            <div className="bubble-image-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(msg.images && msg.images.length > 0 ? msg.images : [msg.image]).filter(Boolean).map((img, i) => (
                <img key={i} src={img} alt={`Attachment ${i + 1}`} className="bubble-image" />
              ))}
            </div>
          )}
          {isEditing ? (
            <div className="edit-wrapper">
              <textarea
                value={editText}
                onChange={e => onEditTextChange(e.target.value)}
                className="edit-ta"
                rows={3}
                autoFocus
              />
              <div className="edit-actions">
                <button onClick={onCancelEdit} className="edit-cancel">Cancel</button>
                <button onClick={() => onSaveEdit(msg.id)} className="edit-save">
                  Save & Resend
                </button>
              </div>
            </div>
          ) : isEmpty ? (
            <ThinkingText />
          ) : (
            <div>
              {/* Deep Research Journey Interactive Accordion */}
              {!isUser && hasDeepResearch && (
                <details className="deep-research-accordion" open style={{
                  marginBottom: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12px'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🧠</span>
                      <span>Autonomous Deep Research Protocol</span>
                    </div>
                    <span style={{ fontSize: '10.5px', background: '#18181b', border: '1px solid #27272a', padding: '2px 8px', borderRadius: '10px', color: '#f4f4f5', fontWeight: 700 }}>
                      4/4 PHASES VERIFIED ✓
                    </span>
                  </summary>
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#d4d4d8', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    {researchJourneyText}
                  </div>
                </details>
              )}

              {!isUser && msg.thinking && (
                <details className="ai-thinking-dropdown">
                  <summary className="ai-thinking-summary">
                    <div className="ai-thinking-summary-left">
                      <span className="ai-thinking-icon">🧠</span>
                      <span className="ai-thinking-title">Thought Process</span>
                    </div>
                    <span className="ai-thinking-badge">Reasoning</span>
                  </summary>
                  <div 
                    className="ai-thinking-body"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.thinking) }} 
                    onClick={onCodeBlockClick}
                  />
                </details>
              )}
              {isUser && (displayContent.includes('```') || /^\s*(?:#include|import\s+|def\s+|class\s+|function\s+|public\s+class|<[a-z]+)/i.test(displayContent.trim())) && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <span>📄 Your Submitted Code / Input:</span>
                </div>
              )}
              <div
                className="bubble-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
                onClick={(e) => {
                  if (onCodeBlockClick) onCodeBlockClick(e);
                  const clickedText = e.target.innerText || e.target.textContent || '';
                  const srcMatch = clickedText.match(/\[Source:\s*([^\]]+)\]/i);
                  if (srcMatch && onInspectDocSource) {
                    e.stopPropagation();
                    onInspectDocSource(srcMatch[1].trim());
                  }
                }}
              />

              {/* Verified Web Grounding Sources */}
              {!isUser && msg.webSources && msg.webSources.length > 0 && (
                <div className="web-sources-row" style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #27272a', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={12} /> Verified Web Sources:
                  </span>
                  {msg.webSources.map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid #27272a',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#e4e4e7',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title={source.snippet}
                    >
                      <span>[{sIdx + 1}] {source.title ? source.title.slice(0, 26) : source.source}</span>
                      <ExternalLink size={10} style={{ opacity: 0.8 }} />
                    </a>
                  ))}
                </div>
              )}

              {msg.ragSources && msg.ragSources.length > 0 && (
                <div className="rag-sources-citation" style={{ marginTop: '10px', fontSize: '10.5px', color: '#a1a1aa', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ opacity: 0.8 }}>🧠 From memory:</span>
                  {msg.ragSources.map((src, sIdx) => (
                    <span
                      key={sIdx}
                      className="rag-source-badge"
                      onClick={() => onInspectDocSource && onInspectDocSource(src)}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #27272a', color: '#e4e4e7', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Click to inspect source excerpt"
                    >
                      📌 {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shimmer edge when bot is streaming */}
          {!isUser && isGenerating && index === total - 1 && !isEmpty && (
            <div className="bubble-streaming-bar" />
          )}
        </div>

        {/* Action tray */}
        {!isEditing && (
          <div className="action-tray">
            <span className="msg-time">{msg.timestamp}</span>

            <button onClick={() => onCopy(msg.id, msg.content)} className="tray-btn" title="Copy">
              {copiedId === msg.id
                ? <Check className="tray-icon tray-icon--green" />
                : <Copy className="tray-icon" />}
            </button>

            

            {!isUser && index >= 1 && (
              <button onClick={() => onRegenerate(index)} className="tray-btn" title="Regenerate">
                <RotateCcw className="tray-icon" />
              </button>
            )}

            {isUser && (
              <>
                <button onClick={() => onStartEdit(msg.id, msg.content)} className="tray-btn" title="Edit">
                  <Edit2 className="tray-icon" />
                </button>
                <button onClick={() => onRegenerate(index + 1)} className="tray-btn" title="Retry">
                  <RotateCcw className="tray-icon" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="avatar avatar--user" style={{ background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px', lineHeight: 1 }}>{userAvatar || '👤'}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const makeWelcomeMsg = (name) => ({
  id: Date.now().toString(),
  role: 'assistant',
  content: `Hello, ${name || 'User'}! I'm Bhavya's AI assistant. How can I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});


function dedupeMessages(msgs) {
  if (!Array.isArray(msgs)) return msgs || [];
  const seenIds = new Set();
  const result = [];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!m) continue;
    const msgId = m.id || ('msg_' + i);
    if (seenIds.has(msgId)) continue;
    seenIds.add(msgId);

    // Prevent consecutive duplicate assistant responses with identical text
    const prev = result[result.length - 1];
    if (
      prev &&
      prev.role === 'assistant' &&
      m.role === 'assistant' &&
      prev.content &&
      m.content &&
      typeof prev.content === 'string' &&
      typeof m.content === 'string' &&
      prev.content.trim() === m.content.trim()
    ) {
      continue;
    }
    result.push(m);
  }
  return result;
}

export default function ChatInterface({ currentTheme, onThemeChange, username, userAvatar, onLogout, isGuest = false }) {
  const effectiveUsername = username || safeStorageGet('ws_username', 'User');
  const isGuestMode = isGuest || username === 'Guest' || username === 'Guest Operator';
  const cleanUsername = (username || '').trim().toLowerCase();
  const isAdmin = isAdminUsername(effectiveUsername);
  const userStorageKey = `bhavya_ai_chats_${cleanUsername}`;
  const userActiveKey = `bhavya_ai_active_chat_${cleanUsername}`;

  useEffect(() => {
    if (username) {
      setChats(prevChats => {
        let changed = false;
        const updated = prevChats.map(chat => {
          if (chat.messages && chat.messages[0] && chat.messages[0].role === 'assistant') {
            if (chat.messages[0].content.includes("I'm Bhavya's AI assistant")) {
              const expectedGreeting = `Hello, ${username}! I'm Bhavya's AI assistant. How can I help you today?`;
              if (chat.messages[0].content !== expectedGreeting) {
                changed = true;
                const newMsgs = [...chat.messages];
                newMsgs[0] = { ...newMsgs[0], content: expectedGreeting };
                return { ...chat, messages: newMsgs };
              }
            }
          }
          return chat;
        });
        return changed ? updated : prevChats;
      });
    }
  }, [username]);
  const effectiveUserAvatar = userAvatar || safeStorageGet('ws_user_avatar', '🤖');

  /* ── Multi-chat session state ──────────────────────────── */
  const [chats, setChats] = useState(() => {
    // GUEST: Always a 100% clean and empty page (single fresh welcome chat)
    if (isGuestMode) {
      const firstId = 'guest_' + Date.now();
      return [{ id: firstId, title: 'New Chat', messages: [makeWelcomeMsg('Guest')] }];
    }

    // ADMIN AUTO-MIGRATION: If Bhavya Mishra is logging in, migrate legacy chats if present
    if (cleanUsername === 'bhavya mishra') {
      try {
        const legacyChats = localStorage.getItem('bhavya_ai_chats');
        if (legacyChats) {
          const parsed = JSON.parse(legacyChats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(userStorageKey, legacyChats);
            const legacyActive = localStorage.getItem('bhavya_ai_active_chat');
            if (legacyActive) localStorage.setItem(userActiveKey, legacyActive);
            localStorage.removeItem('bhavya_ai_chats');
            localStorage.removeItem('bhavya_ai_active_chat');
            return parsed;
          }
        }
      } catch (e) {}
    }

    // Read from user-specific isolated storage
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(chat => {
            if (chat.messages && Array.isArray(chat.messages)) {
              chat.messages = chat.messages.map(m => ({
                ...m,
                content: typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.map(c => c.text || '').join(' ') : String(m.content || '')),
                images: Array.isArray(m.images) ? m.images.filter(img => typeof img === 'string') : []
              }));
              if (chat.messages.length > 0 && chat.messages[0].role === 'assistant') {
                if (chat.messages[0].content.includes("I'm Bhavya's AI assistant")) {
                  chat.messages[0].content = `Hello, ${username || 'User'}! I'm Bhavya's AI assistant. How can I help you today?`;
                }
              }
            }
          });
          return parsed;
        }
      }
    } catch {}

    const firstId = 'chat_' + Date.now();
    return [{ id: firstId, title: 'New Chat', messages: [makeWelcomeMsg(username)] }];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    if (isGuestMode) return null;
    try {
      const saved = localStorage.getItem(userActiveKey);
      const allSaved = JSON.parse(localStorage.getItem(userStorageKey) || 'null');
      if (saved && allSaved?.some(c => c.id === saved)) return saved;
    } catch {}
    return null;
  });

  // Resolve the true active chat id on mount if null
  const resolvedActiveChatId = activeChatId || chats[0]?.id || null;

  const chatsRef = useRef(chats);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  /* ── Multi-Device Cloud Synchronization ─────────────────── */
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // Initial cloud hydration on mount/login
  useEffect(() => {
    let isMounted = true;
    if (isGuestMode || !username || username === 'Guest Operator') return;

    const hydrateCloud = async () => {
      try {
        setCloudSyncStatus('syncing');
        const cloudData = await fetchUserChats(username);
        if (!isMounted) return;

        const currentLocal = JSON.parse(localStorage.getItem(userStorageKey) || 'null');
        const localChats = Array.isArray(currentLocal) ? currentLocal : [];
        const cloudChats = (cloudData && Array.isArray(cloudData.chats)) ? cloudData.chats : [];

        const countMessages = (list) => list.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
        const countContentLen = (list) => list.reduce((sum, c) => sum + (c.messages || []).reduce((mSum, m) => mSum + (m.content?.length || 0), 0), 0);

        const localTotalMsgs = countMessages(localChats);
        const cloudTotalMsgs = countMessages(cloudChats);
        const localContentLen = countContentLen(localChats);
        const cloudContentLen = countContentLen(cloudChats);

        // Smart Reconciliation: If local storage has more messages or more up-to-date content
        // (e.g. user submitted a prompt and refreshed before cloud debounce timer finished):
        if (localTotalMsgs > cloudTotalMsgs || (localTotalMsgs === cloudTotalMsgs && localContentLen > cloudContentLen && localTotalMsgs > 1)) {
          // Local storage is more fresh. Protect local chats from being overwritten!
          setChats(localChats);
          const activeId = localStorage.getItem(userActiveKey) || localChats[0]?.id || null;
          setActiveChatId(activeId);
          // Sync local state up to Supabase Cloud so both stay in sync
          await saveUserChats(username, localChats, activeId);
          if (isMounted) {
            setCloudSyncStatus('synced');
            setLastSyncedAt(Date.now());
          }
          return;
        }

        if (cloudChats.length > 0) {
          setChats(cloudChats);
          if (cloudData.activeChatId && cloudChats.some(c => c.id === cloudData.activeChatId)) {
            setActiveChatId(cloudData.activeChatId);
          } else {
            setActiveChatId(cloudChats[0]?.id || null);
          }
          setCloudSyncStatus('synced');
          setLastSyncedAt(Date.now());
        } else if (localChats.length > 0) {
          // Cloud has 0 chats, but local has chats
          setChats(localChats);
          setActiveChatId(localChats[0]?.id || null);
          await saveUserChats(username, localChats, localChats[0]?.id || null);
          if (isMounted) {
            setCloudSyncStatus('synced');
            setLastSyncedAt(Date.now());
          }
        } else {
          setChats([]);
          setActiveChatId(null);
          if (isMounted) {
            setCloudSyncStatus('synced');
            setLastSyncedAt(Date.now());
          }
        }
      } catch (err) {
        console.warn('Initial cloud sync warning:', err);
        if (isMounted) setCloudSyncStatus('offline');
      }
    };

    hydrateCloud();
    return () => { isMounted = false; };
  }, [username, isGuestMode, userStorageKey]);

  // Debounced auto-save to cloud on chat modifications
  useEffect(() => {
    if (isGuestMode || !username || username === 'Guest Operator' || !Array.isArray(chats)) return;

    const timer = setTimeout(async () => {
      try {
        setCloudSyncStatus('syncing');
        const ok = await saveUserChats(username, chats, resolvedActiveChatId);
        setCloudSyncStatus(ok ? 'synced' : 'offline');
        if (ok) setLastSyncedAt(Date.now());
      } catch (err) {
        setCloudSyncStatus('offline');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [chats, resolvedActiveChatId, username, isGuestMode]);

  // Manual trigger for cross-device instant sync
  const handleManualSync = async () => {
    if (isGuestMode || !username || username === 'Guest Operator') return;
    setCloudSyncStatus('syncing');
    try {
      const [cloudData, cloudDocsMeta] = await Promise.all([
        fetchUserChats(username),
        fetchUserDocumentsWithMeta(username)
      ]);
      if (cloudData?.chats?.length > 0) {
        setChats(cloudData.chats);
        if (cloudData.activeChatId) setActiveChatId(cloudData.activeChatId);
      } else if (chats && chats.length > 0) {
        await saveUserChats(username, chats, resolvedActiveChatId);
      }

      if (cloudDocsMeta && !cloudDocsMeta.error) {
        if (cloudDocsMeta.exists) {
          setUploadedDocs(cloudDocsMeta.documents);
          lastDocSyncTimestampRef.current = cloudDocsMeta.updatedAt || Date.now();
        } else if (uploadedDocs && uploadedDocs.length > 0) {
          await saveUserDocuments(username, uploadedDocs);
          lastDocSyncTimestampRef.current = Date.now();
        }
      }

      setCloudSyncStatus('synced');
      setLastSyncedAt(Date.now());
    } catch {
      setCloudSyncStatus('offline');
    }
  };

  // Derive messages from the active chat
    // Derive messages from the active chat (with auto-deduplication)
  const activeChat = chats.find(c => c.id === resolvedActiveChatId) || chats[0] || null;
  const rawMessages = activeChat?.messages || [];
  const messages = useMemo(() => dedupeMessages(rawMessages), [rawMessages]);

  const setMessages = (updater) => {
    setChats(prev => {
      const activeId = resolvedActiveChatId || prev[0]?.id;
      if (!activeId || !prev.some(c => c.id === activeId)) {
        const newId = 'chat_' + Date.now();
        const initialMsgs = typeof updater === 'function' ? updater([]) : updater;
        const firstUserMsg = initialMsgs.find(m => m.role === 'user');
        const title = firstUserMsg
          ? firstUserMsg.content.trim().slice(0, 36) + (firstUserMsg.content.length > 36 ? '…' : '')
          : 'New Chat';
        setActiveChatId(newId);
        return [{ id: newId, title, messages: initialMsgs }, ...prev];
      }
      return prev.map(c => {
        if (c.id !== activeId) return c;
        const newMsgs = typeof updater === 'function' ? updater(c.messages) : updater;
        // Auto-title chat from first user message
        const firstUserMsg = newMsgs.find(m => m.role === 'user');
        const title = firstUserMsg
          ? firstUserMsg.content.trim().slice(0, 36) + (firstUserMsg.content.length > 36 ? '…' : '')
          : c.title;
        return { ...c, messages: newMsgs, title };
      });
    });
  };

  // Persist user chats to localStorage under isolated key (never persist to global key)
  useEffect(() => {
    if (isGuestMode) return;
    try {
      const cleanChats = chats.map(c => ({
        ...c,
        messages: (c.messages || []).map(m => {
          const cleanMsg = { ...m };
          // Trim massive base64 strings if present to stay under 5MB browser quota
          if (cleanMsg.image && typeof cleanMsg.image === 'string' && cleanMsg.image.length > 500 && cleanMsg.image.startsWith('data:')) {
            cleanMsg.image = cleanMsg.image.slice(0, 100) + '...[truncated]';
          }
          if (Array.isArray(cleanMsg.images)) {
            cleanMsg.images = cleanMsg.images.map(img =>
              typeof img === 'string' && img.length > 500 && img.startsWith('data:') ? img.slice(0, 100) + '...[truncated]' : img
            );
          }
          return cleanMsg;
        })
      }));
      localStorage.setItem(userStorageKey, JSON.stringify(cleanChats));
    } catch (e) {
      console.warn('Could not save chats to user storage:', e);
    }
  }, [chats, isGuestMode, userStorageKey]);

  useEffect(() => {
    if (isGuestMode) return;
    if (resolvedActiveChatId) {
      try {
        localStorage.setItem(userActiveKey, resolvedActiveChatId);
      } catch {}
    } else {
      try {
        localStorage.removeItem(userActiveKey);
      } catch {}
    }
  }, [resolvedActiveChatId, isGuestMode, userActiveKey]);

  const [inputText,      setInputText]      = useState('');
  const [models,         setModels]         = useState([]);
  const [selectedModel,  setSelectedModel]  = useState(() => safeStorageGet('bhavya_ai_selected_model') || 'codestral-latest');

  useEffect(() => {
    if (selectedModel) {
      safeStorageSet('bhavya_ai_selected_model', selectedModel);
    }
  }, [selectedModel]);

  const [isConnected,    setIsConnected]    = useState(false);
  const [coachMode,      setCoachMode]      = useState(() => safeStorageGet('bhavya_ai_coach_mode') || 'soft');
  const [activeSpecialist, setActiveSpecialist] = useState(() => safeStorageGet('bhavya_ai_specialist_assistant') || 'code-reviewer');
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [showCollegeNotesModal, setShowCollegeNotesModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const currentSpecialist = useMemo(() => {
    return SPECIALIST_ASSISTANTS.find(s => s.id === activeSpecialist) || SPECIALIST_ASSISTANTS[0];
  }, [activeSpecialist]);

  const [thinkingMode,   setThinkingMode]   = useState(() => safeStorageGet('bhavya_ai_thinking_mode') || 'deep');
  const [suiteDropOpen,  setSuiteDropOpen]  = useState(false);
  const suiteDropRef                       = useRef(null);

  // Auto-render Mermaid diagrams, KaTeX math equations, and Highlight.js syntax
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (window.hljs) {
          if (window.hljs.configure) {
            window.hljs.configure({ ignoreUnescapedHTML: true });
          }
          document.querySelectorAll('pre code').forEach((el) => {
            if (!el.dataset.highlighted) {
              window.hljs.highlightElement(el);
            }
          });
        }
        const mermaidEls = document.querySelectorAll('.mermaid-render:not([data-processed])');
        if (mermaidEls.length > 0) {
          const runMermaid = () => {
            if (window.mermaid) {
              window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
              mermaidEls.forEach((el) => {
                if (!el.dataset.processed) {
                  window.mermaid.run({ nodes: [el] });
                }
              });
            }
          };
          if (window.mermaid) {
            runMermaid();
          } else if (!document.getElementById('mermaid-lazy-script')) {
            const s = document.createElement('script');
            s.id = 'mermaid-lazy-script';
            s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
            s.onload = runMermaid;
            document.head.appendChild(s);
          }
        }
        if (window.renderMathInElement) {
          window.renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\[', right: '\\]', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false }
            ]
          });
        }
      } catch (err) {
        console.warn('Auto-render extensions notice:', err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (coachMode) safeStorageSet('bhavya_ai_coach_mode', coachMode);
  }, [coachMode]);

  useEffect(() => {
    if (thinkingMode) safeStorageSet('bhavya_ai_thinking_mode', thinkingMode);
  }, [thinkingMode]);
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [isSidebarOpen,  setIsSidebarOpen]  = useState(false);
  const [copiedId,       setCopiedId]       = useState('');
  const [editingId,      setEditingId]      = useState(null);
  const [editText,       setEditText]       = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [attachedFiles,  setAttachedFiles]  = useState([]);
  const [isListening,    setIsListening]    = useState(false);
  const recognitionRef = useRef(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Touch swipe gesture support for native drawer opening/closing on mobile
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - (touchStartYRef.current || 0));

    // Swipe right starting near left screen edge (within 55px) opens sidebar
    if (touchStartXRef.current <= 55 && deltaX > 55 && deltaY < 45) {
      setIsSidebarOpen(true);
    }
    // Swipe left closes sidebar if open
    else if (isSidebarOpen && deltaX < -55 && deltaY < 45) {
      setIsSidebarOpen(false);
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Knowledge Base RAG State
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useMemory, setUseMemory] = useState(() => null === 'true');
  /* ── Multi-Document Knowledge Base ── */
  const userDocStorageKey = username && username !== 'Guest' && username !== 'Guest Operator'
    ? `bhavya_uploaded_documents_${username.toLowerCase()}`
    : 'bhavya_uploaded_documents';

  const [uploadedDocs, setUploadedDocs] = useState(() => {
    try {
      const userKey = username && username !== 'Guest' && username !== 'Guest Operator'
        ? `bhavya_uploaded_documents_${username.toLowerCase()}`
        : null;
      const userSaved = userKey ? localStorage.getItem(userKey) : null;
      if (userSaved) return JSON.parse(userSaved);

      const legacySaved = localStorage.getItem('bhavya_uploaded_documents');
      return legacySaved ? JSON.parse(legacySaved) : [];
    } catch {
      return [];
    }
  });
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [isDocDragOver, setIsDocDragOver] = useState(false);
  const [docsSyncStatus, setDocsSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'
  const [isDocRefreshing, setIsDocRefreshing] = useState(false);
  const multiDocInputRef = useRef(null);
  const zipDocInputRef = useRef(null);

  // Guards and timestamps for rock-solid cross-device sync & deletion propagation
  const isDocsHydratedRef = useRef(false);
  const lastDocSyncTimestampRef = useRef(0);
  const lastDocCheckTimeRef = useRef(0);

  // Helper to persist lean docs directly to user-isolated localStorage
  const persistDocsLocally = (docs, user) => {
    try {
      const cleanDocs = (docs || []).map(d => {
        const copy = { ...d };
        delete copy.base64Data;
        if (copy.content && copy.content.length > 80000) {
          copy.content = copy.content.slice(0, 80000);
        }
        return copy;
      });
      const serialized = JSON.stringify(cleanDocs);
      if (user && user !== 'Guest' && user !== 'Guest Operator') {
        localStorage.setItem(`bhavya_uploaded_documents_${user.toLowerCase()}`, serialized);
      }
      localStorage.setItem('bhavya_uploaded_documents', serialized);
    } catch (e) {
      console.warn('Could not persist documents to localStorage:', e);
    }
  };

  // Persist uploaded documents to user-isolated localStorage whenever uploadedDocs changes
  useEffect(() => {
    persistDocsLocally(uploadedDocs, username);
  }, [uploadedDocs, username]);

  // Initial cloud hydration & automatic migration for Multi-Document Knowledge Base
  useEffect(() => {
    let isMounted = true;
    if (isGuestMode || !username || username === 'Guest Operator') return;

    const hydrateCloudDocuments = async () => {
      try {
        setDocsSyncStatus('syncing');
        const meta = await fetchUserDocumentsWithMeta(username);
        if (!isMounted) return;

        if (meta.error) {
          setDocsSyncStatus('offline');
          isDocsHydratedRef.current = true;
          return;
        }

        if (meta.exists) {
          // Cloud has an authoritative record for this user (including empty [] if documents were cleared or deleted!)
          // Overwrite local state directly with cloud state — NEVER resurrect deleted files!
          setUploadedDocs(meta.documents);
          persistDocsLocally(meta.documents, username);
          lastDocSyncTimestampRef.current = meta.updatedAt || Date.now();
          setDocsSyncStatus('synced');
          isDocsHydratedRef.current = true;
        } else {
          // Cloud has no record for this user yet. Check if this device already had local documents to auto-migrate.
          const userKey = `bhavya_uploaded_documents_${username.toLowerCase()}`;
          const localRaw = localStorage.getItem(userKey) || localStorage.getItem('bhavya_uploaded_documents');
          let localDocs = [];
          try { localDocs = localRaw ? JSON.parse(localRaw) : []; } catch {}
          if (Array.isArray(localDocs) && localDocs.length > 0) {
            console.log('Auto-migrating existing local documents to cloud for user:', username);
            const ok = await saveUserDocuments(username, localDocs);
            if (isMounted) {
              setDocsSyncStatus(ok ? 'synced' : 'offline');
              if (ok) lastDocSyncTimestampRef.current = Date.now();
            }
          } else {
            if (isMounted) setDocsSyncStatus('synced');
          }
          isDocsHydratedRef.current = true;
        }
      } catch (err) {
        console.warn('Document cloud sync warning:', err);
        if (isMounted) {
          setDocsSyncStatus('offline');
          isDocsHydratedRef.current = true;
        }
      }
    };

    hydrateCloudDocuments();
    return () => { isMounted = false; };
  }, [username, isGuestMode]);

  // Cross-device auto-sync when switching tabs / focusing window
  useEffect(() => {
    if (isGuestMode || !username || username === 'Guest Operator') return;

    let isChecking = false;
    const checkCloudDocUpdates = async () => {
      if (isChecking || document.visibilityState === 'hidden') return;
      const now = Date.now();
      // Debounce window focus checks to at least every 4 seconds
      if (now - (lastDocCheckTimeRef.current || 0) < 4000) return;
      lastDocCheckTimeRef.current = now;

      try {
        isChecking = true;
        const meta = await fetchUserDocumentsWithMeta(username);
        if (meta && meta.exists && !meta.error) {
          if (meta.updatedAt > (lastDocSyncTimestampRef.current || 0)) {
            // Cloud has newer modifications (e.g. deletion from another device)!
            setUploadedDocs(meta.documents);
            persistDocsLocally(meta.documents, username);
            lastDocSyncTimestampRef.current = meta.updatedAt;
            setDocsSyncStatus('synced');
          }
        }
      } catch (e) {
        // silent background check
      } finally {
        isChecking = false;
      }
    };

    window.addEventListener('focus', checkCloudDocUpdates);
    document.addEventListener('visibilitychange', checkCloudDocUpdates);
    return () => {
      window.removeEventListener('focus', checkCloudDocUpdates);
      document.removeEventListener('visibilitychange', checkCloudDocUpdates);
    };
  }, [username, isGuestMode]);

  // On-demand manual refresh for latest cloud documents across devices
  const handleRefreshCloudDocuments = async () => {
    if (isGuestMode || !username || username === 'Guest Operator') return;
    try {
      setIsDocRefreshing(true);
      setDocsSyncStatus('syncing');
      const meta = await fetchUserDocumentsWithMeta(username);
      
      if (meta.error) {
        setDocsSyncStatus('offline');
        setThemeToast('⚠️ Cloud sync offline');
        setTimeout(() => setThemeToast(''), 2500);
        return;
      }

      if (meta.exists) {
        // Cloud is authoritative: replace local state directly with cloud state!
        // This ensures deletions made on Device 1 immediately disappear on Device 2!
        setUploadedDocs(meta.documents);
        persistDocsLocally(meta.documents, username);
        lastDocSyncTimestampRef.current = meta.updatedAt || Date.now();
        setDocsSyncStatus('synced');
        setThemeToast(meta.documents.length > 0
          ? `🔄 Synced ${meta.documents.length} document${meta.documents.length === 1 ? '' : 's'} from cloud!`
          : '🔄 Knowledge base synced (0 documents in cloud)'
        );
        setTimeout(() => setThemeToast(''), 2500);
      } else {
        // No cloud record exists yet
        if (uploadedDocs.length > 0) {
          const ok = await saveUserDocuments(username, uploadedDocs);
          if (ok) lastDocSyncTimestampRef.current = Date.now();
          setDocsSyncStatus(ok ? 'synced' : 'offline');
          setThemeToast('☁️ Synced local documents to cloud!');
        } else {
          setDocsSyncStatus('synced');
          setThemeToast('🔄 Documents synced from cloud');
        }
        setTimeout(() => setThemeToast(''), 2500);
      }
    } catch (err) {
      console.warn('Manual document refresh warning:', err);
      setDocsSyncStatus('offline');
      setThemeToast('⚠️ Cloud sync offline');
      setTimeout(() => setThemeToast(''), 2500);
    } finally {
      setIsDocRefreshing(false);
    }
  };

  // Debounced auto-save to cloud when documents change
  useEffect(() => {
    if (isGuestMode || !username || username === 'Guest Operator') return;
    // CRITICAL: Prevent saving stale localStorage docs before initial cloud hydration finishes!
    if (!isDocsHydratedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        setDocsSyncStatus('syncing');
        const ok = await saveUserDocuments(username, uploadedDocs);
        setDocsSyncStatus(ok ? 'synced' : 'offline');
        if (ok) lastDocSyncTimestampRef.current = Date.now();
      } catch (e) {
        setDocsSyncStatus('offline');
        console.warn('Auto-save documents to cloud error:', e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [uploadedDocs, username, isGuestMode]);

  const handleDownloadDocument = async (doc) => {
    if (!doc) return;
    try {
      const ok = await downloadDocumentFile(doc);
      if (ok) {
        setThemeToast(`⬇️ Downloaded ${doc.name}!`);
      } else {
        setThemeToast(`❌ Could not download ${doc.name}`);
      }
      setTimeout(() => setThemeToast(''), 3000);
    } catch (err) {
      console.error('Download document failed:', err);
      setThemeToast('❌ Failed to download file');
      setTimeout(() => setThemeToast(''), 3000);
    }
  };

  const handleMultiDocUpload = async (e) => {
    const files = Array.from(e.target.files || (e.dataTransfer ? e.dataTransfer.files : []) || []);
    if (files.length === 0) return;

    setIsUploadingDocs(true);
    const parsedDocs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';

      if (isZip) {
        setUploadProgressText(`Processing ZIP folder: ${file.name}...`);
        try {
          const zipFolderDoc = await parseZipFolderDocument(file);
          parsedDocs.push(zipFolderDoc);
          setThemeToast(`📦 Uploaded ZIP folder "${file.name}" (${zipFolderDoc.fileCount || 0} files)!`);
          setTimeout(() => setThemeToast(''), 3500);
        } catch (zipErr) {
          console.error(`Error processing zip ${file.name}:`, zipErr);
          try {
            const parsed = await parseDocumentFile(file);
            parsedDocs.push(parsed);
          } catch (e) {}
        }
      } else {
        setUploadProgressText(`Parsing ${i + 1}/${files.length}: ${file.name}...`);
        try {
          const parsed = await parseDocumentFile(file);
          parsedDocs.push(parsed);
        } catch (err) {
          console.error(`Error parsing ${file.name}:`, err);
        }
      }
    }

    if (parsedDocs.length > 0) {
      setUploadedDocs(prev => {
        const existingNames = new Set(prev.map(d => d.name));
        const filteredNew = parsedDocs.filter(d => !existingNames.has(d.name));
        const updated = [...filteredNew, ...prev];
        persistDocsLocally(updated, username);
        if (!isGuestMode && username && username !== 'Guest Operator') {
          setDocsSyncStatus('syncing');
          saveUserDocuments(username, updated)
            .then(ok => {
              setDocsSyncStatus(ok ? 'synced' : 'offline');
              if (ok) lastDocSyncTimestampRef.current = Date.now();
            })
            .catch(() => setDocsSyncStatus('offline'));
        }
        return updated;
      });
    }

    setIsUploadingDocs(false);
    setUploadProgressText('');
    if (e.target) e.target.value = '';
  };

  const handleDeleteDocument = (docId) => {
    setUploadedDocs(prev => {
      const updated = prev.filter(d => d.id !== docId);
      persistDocsLocally(updated, username);
      if (!isGuestMode && username && username !== 'Guest Operator') {
        setDocsSyncStatus('syncing');
        saveUserDocuments(username, updated)
          .then(ok => {
            setDocsSyncStatus(ok ? 'synced' : 'offline');
            if (ok) lastDocSyncTimestampRef.current = Date.now();
          })
          .catch(() => setDocsSyncStatus('offline'));
      }
      return updated;
    });
  };

  const handleClearAllDocuments = () => {
    if (window.confirm('Are you sure you want to remove all uploaded documents from memory?')) {
      setUploadedDocs([]);
      persistDocsLocally([], username);
      if (!isGuestMode && username && username !== 'Guest Operator') {
        setDocsSyncStatus('syncing');
        saveUserDocuments(username, [])
          .then(ok => {
            setDocsSyncStatus(ok ? 'synced' : 'offline');
            if (ok) lastDocSyncTimestampRef.current = Date.now();
          })
          .catch(() => setDocsSyncStatus('offline'));
      }
    }
  };

  const handleExportChat = (format = 'markdown') => {
    if (!messages || messages.length === 0) {
      alert('No messages to export.');
      return;
    }
    if (format === 'json') {
      const contentStr = JSON.stringify(messages, null, 2);
      const blob = new Blob([contentStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setThemeToast('📥 Chat exported as JSON!');
      setTimeout(() => setThemeToast(''), 3000);
    } else if (format === 'pdf') {
      let combined = '';
      messages.forEach(m => {
        const role = m.role === 'user' ? '**User**' : '**Assistant**';
        combined += `### ${role} (${m.timestamp || ''})\n\n${m.content}\n\n---\n\n`;
      });
      handleExportPDF(combined, "Bhavya's AI Assistant - Full Session Transcript");
    } else {
      let md = `# Bhavya's AI Assistant - Research Session\n`;
      md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      messages.forEach(m => {
        const roleName = m.role === 'user' ? '👤 User' : '🤖 Assistant';
        md += `### ${roleName} (${m.timestamp || ''})\n\n${m.content || ''}\n\n---\n\n`;
      });
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_session_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setThemeToast('📥 Chat exported as Markdown (.md)!');
      setTimeout(() => setThemeToast(''), 3000);
    }
  };

  const SUPABASE_URL = "https://igjljyssjyeblhaqffiw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_UqEHmg5gH11JRak3MJPC8w_55Pc5Stu";

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/college_notes?select=document_name`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const names = [...new Set(data.map(d => d.document_name))].filter(n => n && !n.startsWith('__bh_'));
        setUploadedFiles(names);
      }
    } catch (err) {
      console.error("Failed to load uploaded files:", err);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}" from memory?`)) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/college_notes?document_name=eq.${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f !== fileName));
      } else {
        alert("Failed to delete file from Supabase.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await file.text();
      const chunks = [];
      const chunkSize = 500;
      const overlap = 100;
      let i = 0;
      while (i < text.length) {
        chunks.push(text.substring(i, i + chunkSize));
        i += chunkSize - overlap;
      }

      const key = cohereKey || null;
      if (!key) {
        throw new Error("Please configure your Cohere API Key in Settings first.");
      }

      for (let c = 0; c < chunks.length; c++) {
        const chunkText = chunks[c];
        const embedResponse = await fetch('/api/cohere/v1/embed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: 'embed-english-v3.0',
            texts: [chunkText],
            input_type: 'search_document'
          })
        });

        if (!embedResponse.ok) {
          throw new Error(`Cohere embedding failed: ${embedResponse.statusText}`);
        }

        const embedData = await embedResponse.json();
        const vector = embedData.embeddings[0];

        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/college_notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            document_name: file.name,
            content: chunkText,
            embedding: vector
          })
        });

        if (!supabaseResponse.ok) {
          throw new Error("Failed to save chunk to Supabase.");
        }

        setUploadProgress(Math.round(((c + 1) / chunks.length) * 100));
      }

      alert(`Successfully uploaded "${file.name}"!`);
      await fetchUploadedFiles();
    } catch (err) {
      console.error(err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  useEffect(() => {
    fetchUploadedFiles();

    const userInst = null;
    if (userInst === null) {
      setCustomInstructions(DEFAULT_CUSTOM_INSTRUCTIONS);
    }
  }, []);

  const REAL_SYSTEM_GEMINI_KEY = "";
  const getCleanGeminiKey = (k) => {
    if (!k || typeof k !== 'string' || k.includes('Cr_FkX') || k.length < 25) {
      return REAL_SYSTEM_GEMINI_KEY;
    }
    return k;
  };

  const SYSTEM_KEYS = {
    gemini: REAL_SYSTEM_GEMINI_KEY,
    groq: "",
    cohere: "",
    nvidia: "",
    sambaNova: "",
    mistral: "",
    huggingFace: "",
    openRouter: "",
    zenmux: "",
    anthropic: "",
    openai: "",
    cerebras: ""
  };

  const [geminiKey, setGeminiKey] = useState(() => getCleanGeminiKey(safeStorageGet('bhavya_ai_gemini_key') || safeStorageGet('bhavya_ai_gemini_api_key')));
  const [groqKey, setGroqKey] = useState(() => safeStorageGet('bhavya_ai_groq_key') || safeStorageGet('bhavya_ai_groq_api_key') || SYSTEM_KEYS.groq);
  const [openRouterKey, setOpenRouterKey] = useState(() => safeStorageGet('bhavya_ai_openrouter_key') || safeStorageGet('bhavya_ai_openrouter_api_key') || SYSTEM_KEYS.openRouter);

  // Sync to shared cross-app storage whenever keys change
  useEffect(() => {
    if (geminiKey) safeStorageSet('bhavya_ai_gemini_key', geminiKey);
    if (groqKey) safeStorageSet('bhavya_ai_groq_key', groqKey);
    if (openRouterKey) safeStorageSet('bhavya_ai_openrouter_key', openRouterKey);
  }, [geminiKey, groqKey, openRouterKey]);
  const [cohereKey, setCohereKey] = useState(() =>  SYSTEM_KEYS.cohere);
  const [huggingFaceKey, setHuggingFaceKey] = useState(() =>  SYSTEM_KEYS.huggingFace);
  const [mistralKey, setMistralKey] = useState(() =>  SYSTEM_KEYS.mistral);
  const [sambaNovaKey, setSambaNovaKey] = useState(() =>  SYSTEM_KEYS.sambaNova);
  const [nvidiaKey, setNvidiaKey] = useState(() =>  SYSTEM_KEYS.nvidia);
  const [zenmuxKey, setZenmuxKey] = useState(() =>  SYSTEM_KEYS.zenmux);
  const [anthropicKey, setAnthropicKey] = useState(() =>  SYSTEM_KEYS.anthropic);
  const [openaiKey, setOpenaiKey] = useState(() =>  SYSTEM_KEYS.openai);
  const [cerebrasKey, setCerebrasKey] = useState(() =>  SYSTEM_KEYS.cerebras);
  const [customInstructions, setCustomInstructions] = useState(() => {
    const saved = null;
    return saved !== null ? saved : DEFAULT_CUSTOM_INSTRUCTIONS;
  });

  // Full comprehensive model catalog across all 14 providers
  const rawModels = [
    ...models,
    ...GEMINI_MODELS,
    ...OPENAI_MODELS,
    ...ANTHROPIC_MODELS,
    ...GROQ_MODELS,
    ...OPENROUTER_MODELS,
    ...COHERE_MODELS,
    ...MISTRAL_MODELS,
    ...SAMBANOVA_MODELS,
    ...HUGGINGFACE_MODELS,
    ...NVIDIA_MODELS,
    ...META_MODELS,
    ...MICROSOFT_MODELS,
    ...ZENMUX_MODELS,
    ...CEREBRAS_MODELS
  ];
  // Absolute 100% duplicate immunity across all providers and tiers:
  const allModels = Array.from(new Set(rawModels));
  const [lightsOut,      setLightsOut]      = useState(true);
  const [isLightMode,    setIsLightMode]    = useState(false);
  const [modelDropOpen,  setModelDropOpen]  = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [themeToast,     setThemeToast]     = useState('');
  const [modelSearch,    setModelSearch]    = useState('');
  const [showAllModels,  setShowAllModels]  = useState(false);
  // 🚀 Core Canvas & Web Search States
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasContent, setCanvasContent] = useState('');
  const [canvasLang, setCanvasLang] = useState('html');

  // Web Search is permanently enabled at all times
  const isWebSearchEnabled = true;

  // 🎯 Flagship UX Parity: Multi-File Drag & Drop
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // 🌟 Advanced Productivity Suite States
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speechRate, setSpeechRate] = useState(1);
  const [inspectedDocExcerpt, setInspectedDocExcerpt] = useState(null); // { fileName, excerpt, type, size }
  const [isCustomLensModalOpen, setIsCustomLensModalOpen] = useState(false);
  const [customLensesList, setCustomLensesList] = useState(() => getCustomLenses(effectiveUsername || 'default'));
  const [newLensForm, setNewLensForm] = useState({ name: '', tag: '', desc: '', icon: '⚡', prompt: '' });
  const [showAdminInspectorModal, setShowAdminInspectorModal] = useState(false);



  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const modelDropRef   = useRef(null);
  const abortControllerRef = useRef(null);
  const isGeneratingRef    = useRef(false);
  const isSendingRef       = useRef(false);
  const lastSendTimeRef    = useRef(0);
  const scrollContainerRef = useRef(null);
  const fileInputRef       = useRef(null);

  const sidebarCloseTimerRef = useRef(null);
  const prevLengthRef = useRef(0);

  const openSidebar = () => {
    clearTimeout(sidebarCloseTimerRef.current);
    setIsSidebarOpen(true);
  };

  const closeSidebar = (delay = 250) => {
    clearTimeout(sidebarCloseTimerRef.current);
    if (delay === 0) {
      setIsSidebarOpen(false);
    } else {
      sidebarCloseTimerRef.current = setTimeout(() => {
        setIsSidebarOpen(false);
      }, delay);
    }
  };

  const cancelSidebarClose = () => {
    clearTimeout(sidebarCloseTimerRef.current);
  };

  const handleExportPDF = (content, title = "Bhavya's AI Assistant Report") => {
    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) return alert('Please allow popups to export PDF.');
    
    const htmlBody = renderMarkdown(content);
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; color: #000000; line-height: 1.65; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
    h1, h2, h3, h4 { color: #000000; margin-top: 1.4em; margin-bottom: 0.5em; line-height: 1.3; }
    h1 { font-size: 24px; border-bottom: 2px solid #000000; padding-bottom: 8px; }
    h2 { font-size: 19px; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; }
    pre, code { font-family: 'Fira Code', monospace; background: #18181b; color: #ffffff; border-radius: 8px; padding: 12px; font-size: 13px; overflow-x: auto; }
    code { padding: 2px 6px; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #e4e4e7; padding: 8px 12px; text-align: left; font-size: 13.5px; }
    th { background: #f4f4f5; font-weight: 600; }
    blockquote { border-left: 4px solid #000000; margin: 0; padding-left: 16px; color: #52525b; font-style: italic; }
    .doc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 24px; }
    .doc-header h2 { margin: 0; border: none; padding: 0; color: #000000; font-size: 20px; }
    .doc-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="doc-header">
    <h2>Bhavya's AI Assistant Document</h2>
    <span style="font-size: 12px; color: #71717a;">${new Date().toLocaleDateString()}</span>
  </div>
  <div>${htmlBody}</div>
  <div class="doc-footer">Generated by Bhavya's AI Assistant • Confidential</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;
    printWin.document.write(fullHtml);
    printWin.document.close();
  };

  const handleExportPPTX = async (content, title = "Bhavya's AI Presentation") => {
    try {
      await exportToPptx(content, title);
    } catch (err) {
      console.error('PPTX export error:', err);
      alert('Failed to export presentation: ' + (err.message || 'Unknown error'));
    }
  };

  const handleExportDOCX = async (content, title = "Bhavya's AI Document") => {
    try {
      await exportToDocx(content, title);
    } catch (err) {
      console.error('DOCX export error:', err);
      alert('Failed to export document: ' + (err.message || 'Unknown error'));
    }
  };

  const handleInspectDocSource = (fileName) => {
    if (!fileName) return;
    const cleanTarget = fileName.trim().toLowerCase();
    const doc = uploadedDocs.find(d => (d.name || '').toLowerCase() === cleanTarget || (d.name || '').toLowerCase().includes(cleanTarget));
    if (doc) {
      setInspectedDocExcerpt({
        fileName: doc.name,
        excerpt: doc.content ? doc.content.slice(0, 1500) : 'Content not available for preview.',
        type: doc.type || 'text',
        size: doc.size ? formatFileSize(doc.size) : 'Verified Context'
      });
    } else {
      setInspectedDocExcerpt({
        fileName,
        excerpt: `Referenced document "${fileName}" was cited by the assistant from current context.`,
        type: 'citation',
        size: 'Verified Context'
      });
    }
  };

  /* ── Multi-Turn Interactive Canvas AI Editor (Claude & ChatGPT Canvas Parity) ── */
  const handleCanvasAiEdit = async (userPrompt, currentCode, applyCode) => {
    try {
      const activeGroqKey = groqKey || SYSTEM_KEYS.groq || "";
      const sysInstruction = `You are a world-class principal software engineer. You are editing an artifact file live in a side-by-side canvas workspace.
The user will provide the CURRENT CODE and their REQUESTED CHANGE.
Return ONLY the 100% updated, fully working, complete code inside a single markdown code block (e.g. \`\`\`html ... \`\`\`).
Do NOT truncate code, do NOT write placeholders or '// rest of code here', and do NOT include conversational chit-chat outside the code fence.`;

      const promptBody = `CURRENT CODE:\n\`\`\`\n${currentCode}\n\`\`\`\n\nREQUESTED MODIFICATION:\n${userPrompt}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeGroqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: sysInstruction },
            { role: 'user', content: promptBody }
          ],
          temperature: 0.2,
          max_tokens: 8000
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
        const newCode = match ? match[1].trim() : text.trim();
        if (newCode) {
          applyCode(newCode);
          setCanvasContent(newCode);
          setThemeToast('✨ Canvas updated by AI!');
          setTimeout(() => setThemeToast(''), 3000);
        }
      } else {
        alert('Failed to refactor canvas code with AI. Please check your API keys.');
      }
    } catch (err) {
      console.error('Canvas AI edit failed:', err);
      alert(`Error updating canvas: ${err.message}`);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = e => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = e => {
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript;
          }
        }
        if (final) {
          setInputText(prev => prev + (prev ? " " : "") + final);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(sidebarCloseTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /* ── Cloud Model Default Initialization ──────────────────── */
  useEffect(() => {
    setIsConnected(false);
    setModels([]);
    const savedModel = safeStorageGet('bhavya_ai_selected_model');
    if (savedModel && !savedModel.includes('1.5-flash') && !savedModel.includes('1.5-pro')) {
      setSelectedModel(savedModel);
    } else {
      setSelectedModel('gemini-2.0-flash');
      safeStorageSet('bhavya_ai_selected_model', 'gemini-2.0-flash');
    }
  }, []);

  /* ── Load Keys from Server ──────────────────────────────── */
  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await fetch('/api/keys');
        if (res.ok) {
          const data = await res.json();
          const gemini = data.geminiKey || data["gemini Key"];
          if (gemini) {
            setGeminiKey(gemini);
            
          }
          const groq = data.groqKey || data["groq Key"];
          if (groq) {
            setGroqKey(groq);
            
          }
          const openrouter = data.openRouterKey || data["openRouter Key"];
          if (openrouter) {
            setOpenRouterKey(openrouter);
            
          }
          const cohere = data.cohereKey || data["cohere Key"];
          if (cohere) {
            setCohereKey(cohere);
            
          }
          const huggingface = data.huggingFaceKey || data["huggingface Key"] || data["huggingFace Key"];
          if (huggingface) {
            setHuggingFaceKey(huggingface);
            
          }
          const mistral = data.mistralKey || data["mistral Key"];
          if (mistral) {
            setMistralKey(mistral);
            
          }
          const sambanova = data.sambaNovaKey || data["cloudSambaNova Key"] || data["sambaNova Key"];
          if (sambanova) {
            setSambaNovaKey(sambanova);
            
          }
          const nvidia = data.nvidiaKey || data["nvidia Key"];
          if (nvidia) {
            setNvidiaKey(nvidia);
            
          }
          const zenmux = data.zenMuxKey || data["zenmuxKey"] || data["zenMux Key"];
          if (zenmux) {
            setZenmuxKey(zenmux);
            
          }
          const anthropic = data.anthropicKey || data["anthropic Key"];
          if (anthropic) {
            setAnthropicKey(anthropic);
            
          }
          const openai = data.openaiKey || data["openai Key"];
          if (openai) {
            setOpenaiKey(openai);
            
          }
        }
      } catch (e) {
        console.error('Failed to load keys from server:', e);
      }
    }
    loadKeys();
  }, []);

  /* ── Model Migration / Deprecation Fallback ──────────────── */
  useEffect(() => {
    const isCloudDeepseek = selectedModel === 'deepseek/deepseek-r1' || selectedModel === 'deepseek/deepseek-r1:free' || selectedModel === 'deepseek-r1';
    
    if (isCloudDeepseek) {
      const hasLocalR1 = models.includes('deepseek-r1:8b') || models.some(m => m.toLowerCase().includes('deepseek-r1'));
      if (hasLocalR1) {
        const localMatch = models.find(m => m.toLowerCase().includes('deepseek-r1')) || 'deepseek-r1:8b';
        setSelectedModel(localMatch);
      } else {
        setSelectedModel('openrouter/free');
      }
    } else if (
      selectedModel === 'anthropic/claude-3.5-sonnet' || 
      selectedModel === 'meta-llama/llama-3.3-70b-instruct' ||
      selectedModel === 'meta-llama/llama-3.1-8b-instruct:free' ||
      selectedModel === 'google/gemma-2-9b-it:free' ||
      selectedModel === 'qwen/qwen-2.5-7b-instruct:free'
    ) {
      setSelectedModel('openrouter/free');
    }
  }, [selectedModel, models]);

  const handleCodeBlockClick = async (e) => {
    const target = e.target;
    if (!target) return;

    if (target.classList.contains('btn-render-chart')) {
      const type = target.getAttribute('data-type') || 'bar';
      const rawHeaders = JSON.parse(decodeURIComponent(target.getAttribute('data-headers') || '[]'));
      const rawRows = JSON.parse(decodeURIComponent(target.getAttribute('data-rows') || '[]'));

      const box = target.closest('.interactive-chart-box');
      if (!box) return;

      const container = box.querySelector('.chart-canvas-container');
      const canvas = box.querySelector('.chart-render-canvas');
      if (!container || !canvas || typeof window === 'undefined') return;
      if (!window.Chart) {
        if (!document.getElementById('chart-lazy-script')) {
          const s = document.createElement('script');
          s.id = 'chart-lazy-script';
          s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
          s.onload = () => {
            // Re-trigger chart rendering once loaded
            box.querySelector('.btn-render-chart')?.click();
          };
          document.head.appendChild(s);
        }
        return;
      }

      container.style.display = 'block';

      if (canvas._chartInstance) {
        canvas._chartInstance.destroy();
      }

      const labels = rawRows.map(r => r[0] || 'Item');
      const numericColIndex = rawRows[0] ? rawRows[0].findIndex((val, idx) => idx > 0 && !isNaN(parseFloat(val.replace(/[^0-9.-]/g, '')))) : 1;
      const targetCol = numericColIndex > 0 ? numericColIndex : 1;
      const values = rawRows.map(r => parseFloat((r[targetCol] || '0').replace(/[^0-9.-]/g, '')) || 0);
      const datasetLabel = rawHeaders[targetCol] || 'Data Metrics';

      canvas._chartInstance = new window.Chart(canvas, {
        type: type,
        data: {
          labels: labels,
          datasets: [{
            label: datasetLabel,
            data: values,
            backgroundColor: type === 'pie' 
              ? ['#ffffff', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b']
              : 'rgba(255, 255, 255, 0.25)',
            borderColor: '#ffffff',
            borderWidth: 1.5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#ffffff' } }
          },
          scales: type !== 'pie' ? {
            x: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          } : {}
        }
      });

      return;
    }

    if (target.classList.contains('btn-copy-code') || target.closest('.btn-copy-code')) {
      const btn = target.classList.contains('btn-copy-code') ? target : target.closest('.btn-copy-code');
      let code = btn.getAttribute('data-code');
      if (code) {
        // Strip any diff symbols or git metadata headers to ensure copied code is 100% clean, runnable code
        const lines = code.split('\n');
        if (lines.some(l => l.startsWith('+') || l.startsWith('-') || isGitDiffHeader(l))) {
          code = lines
            .filter(l => !isGitDiffHeader(l) && !l.startsWith('-'))
            .map(l => l.startsWith('+') ? l.replace(/^\+\s?/, '') : l)
            .join('\n');
        }
        navigator.clipboard.writeText(code);
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.color = '#4ade80';
        btn.style.borderColor = 'rgba(74, 222, 128, 0.4)';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 1500);
      }
      return;
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const threshold = 150;
      const isAtBottom = container.scrollHeight - container.clientHeight - container.scrollTop <= threshold;

      // Check if a new message was just added to the chat history
      const hasNewMessage = messages.length > prevLengthRef.current;
      prevLengthRef.current = messages.length;

      if (hasNewMessage) {
        // If a new message is sent or generated, always force scroll to bottom
        container.scrollTop = container.scrollHeight;
      } else if (isGenerating) {
        // If streaming answers, only scroll if the user is already looking at the bottom
        if (isAtBottom) {
          container.scrollTop = container.scrollHeight;
        }
      } else {
        // Smooth scroll when generation finishes
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isGenerating]);

  /* ── Auto-resize textarea ──────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const sh = textareaRef.current.scrollHeight;
      if (sh > 0) {
        textareaRef.current.style.height = `${Math.min(sh, 160)}px`;
      } else {
        textareaRef.current.style.height = '32px';
      }
    }
  }, [inputText]);

  /* ── Close model dropdown on outside click ─────────────── */
  useEffect(() => {
    function handler(e) {
      if (
        modelDropRef.current && 
        !modelDropRef.current.contains(e.target) && 
        !e.target.closest('[data-model-dropdown="true"]')
      ) {
        setModelDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Helpers ───────────────────────────────────────────── */
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleSpeak = (id, text) => {
    handleToggleSpeech(id, text);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      // 1. Immediately abort any active AI generation to prevent stray background responses
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch {}
        abortControllerRef.current = null;
      }
      isGeneratingRef.current = false;
      setIsGenerating(false);

      // 2. Clear messages to clean slate
      setMessages([]);

      // 3. Immediately persist clean state to localStorage and cloud
      setChats(prev => {
        const updated = prev.map(c => {
          if (c.id !== resolvedActiveChatId) return c;
          return { ...c, messages: [], title: 'New Chat' };
        });
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(updated));
        } catch (e) {}
        if (!isGuestMode && username && username !== 'Guest Operator') {
          saveUserChats(username, updated, resolvedActiveChatId).catch(() => {});
        }
        return updated;
      });

      setThemeToast('🗑️ Conversation cleared!');
      clearTimeout(window._themeToastTimer);
      window._themeToastTimer = setTimeout(() => setThemeToast(''), 2500);
    }
  };

  const handleSaveSettings = async () => {
    
    
    
    
    
    
    
    
    
    
    
    
    

    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          geminiKey, groqKey, openRouterKey,
          cohereKey, huggingFaceKey, mistralKey, sambaNovaKey, nvidiaKey, zenMuxKey: zenmuxKey, anthropicKey, openaiKey, cerebrasKey
        })
      });
    } catch (e) {
      console.error('Failed to save keys to server:', e);
    }
    setShowSettingsModal(false);
  };

  const handleCycleTheme = () => {
    const idx = THEMES.findIndex(t => t.id === currentTheme);
    const next = THEMES[(idx + 1) % THEMES.length];
    onThemeChange(next.id);
    setThemeToast(next.label);
    clearTimeout(window._themeToastTimer);
    window._themeToastTimer = setTimeout(() => setThemeToast(''), 1800);
  };

  const handleCycleCoachMode = () => {
    const modes = ['soft', 'moderate', 'brutal'];
    const currentIdx = modes.indexOf(coachMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setCoachMode(nextMode);
    

    const labels = {
      soft: 'Soft Mentor Mode 😇',
      moderate: 'Moderate Mentor Mode ⚖️',
      brutal: 'Brutal Coach Mode 💀'
    };
    setThemeToast(labels[nextMode]);
    clearTimeout(window._themeToastTimer);
    window._themeToastTimer = setTimeout(() => setThemeToast(''), 1800);
  };

  const handleNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newChat = { id: newId, title: 'New Chat', messages: [makeWelcomeMsg(username)] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
  };

  const handleDeleteChat = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();

    // 1. Abort generation if active chat being generated is deleted
    if (id === resolvedActiveChatId && isGenerating) {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch {}
        abortControllerRef.current = null;
      }
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }

    // 2. Compute the next chat list synchronously
    const remaining = chats.filter(c => c.id !== id);
    let nextActiveId = null;

    if (remaining.length > 0) {
      if (id === resolvedActiveChatId) {
        nextActiveId = remaining[0].id;
      } else {
        nextActiveId = activeChatId;
      }
    } else {
      nextActiveId = null;
    }

    // 3. Update React states cleanly
    setChats(remaining);
    setActiveChatId(nextActiveId);

    // 4. Immediately persist to localStorage
    if (!isGuestMode && userStorageKey) {
      try {
        localStorage.setItem(userStorageKey, JSON.stringify(remaining));
        if (nextActiveId) {
          localStorage.setItem(userActiveKey, nextActiveId);
        } else {
          localStorage.removeItem(userActiveKey);
        }
      } catch (err) {
        console.warn('Failed to persist chats after delete:', err);
      }
    }

    // 5. Immediately sync deletion to Supabase Cloud
    if (!isGuestMode && username && username !== 'Guest Operator') {
      try {
        setCloudSyncStatus('syncing');
        const ok = await saveUserChats(username, remaining, nextActiveId);
        setCloudSyncStatus(ok ? 'synced' : 'offline');
        if (ok) setLastSyncedAt(Date.now());
      } catch (err) {
        setCloudSyncStatus('offline');
      }
    }

    // 6. User notification toast
    setThemeToast('🗑️ Conversation deleted');
    clearTimeout(window._themeToastTimer);
    window._themeToastTimer = setTimeout(() => setThemeToast(''), 2000);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = async (e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    const files = e.clipboardData.files;

    let fileToProcess = null;

    if (items) {
      for (const item of items) {
        if (item.type && item.type.indexOf('image') !== -1) {
          fileToProcess = item.getAsFile();
          if (fileToProcess) break;
        }
      }
    }

    if (!fileToProcess && files && files.length > 0) {
      for (const f of files) {
        if (f.type && f.type.startsWith('image/')) {
          fileToProcess = f;
          break;
        }
      }
    }

    if (fileToProcess) {
      e.preventDefault();
      const compressed = await compressImage(fileToProcess);
      if (compressed) {
        setAttachedImages(prev => prev.length < 10 ? [...prev, compressed] : prev);
      }
    }
  };

  // Register global Ctrl+V paste listener so user can paste screenshots anywhere on the page
  useEffect(() => {
    const globalPasteHandler = (e) => {
      // Avoid hijacking paste if user is typing in a non-chat text input modal (like settings or search)
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const activeId = document.activeElement ? document.activeElement.id : '';
      if (activeTag === 'INPUT' && activeId !== 'chat-text-input') {
        return;
      }
      handlePaste(e);
    };
    window.addEventListener('paste', globalPasteHandler);
    return () => window.removeEventListener('paste', globalPasteHandler);
  }, []);

  const processUploadedFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;

    for (const f of files) {
      if (f.name.endsWith('.zip')) {
        try {
          if (!window.JSZip) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          const zip = await window.JSZip.loadAsync(f);
          const zipExtracted = [];
          for (const relPath of Object.keys(zip.files)) {
            const zFile = zip.files[relPath];
            if (!zFile.dir && !relPath.includes('node_modules/') && !relPath.includes('.git/')) {
              const ext = relPath.split('.').pop().toLowerCase();
              if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'md', 'txt', 'csv', 'sql'].includes(ext)) {
                const text = await zFile.async('string');
                zipExtracted.push({ name: relPath, content: text });
              }
            }
          }
          if (zipExtracted.length > 0) {
            setAttachedFiles(prev => [...prev, ...zipExtracted].slice(0, 25));
            setThemeToast(`📦 Extracted ${zipExtracted.length} source code files from ${f.name}!`);
            setTimeout(() => setThemeToast(''), 3000);
          }
        } catch (err) {
          console.error("ZIP extraction failed:", err);
        }
      } else if (f.type.startsWith('image/')) {
        const compressed = await compressImage(f);
        if (compressed) {
          setAttachedImages(prev => prev.length < 10 ? [...prev, compressed] : prev);
        }
      } else {
        try {
          const text = await f.text();
          setAttachedFiles(prev => [...prev, { name: f.name, content: text }].slice(0, 25));
        } catch (err) {
          console.warn("Could not read file text:", err);
        }
      }
    }
  };

  const handleFileChange = async (e) => {
    await processUploadedFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    if (window.innerWidth <= 768) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    if (window.innerWidth <= 768) return;
    e.preventDefault();
    e.stopPropagation();
    // Only turn off if leaving window/root
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = async (e) => {
    if (window.innerWidth <= 768) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(e.dataTransfer.files);
      setThemeToast(`📎 Attached ${e.dataTransfer.files.length} file(s)!`);
      setTimeout(() => setThemeToast(''), 3000);
    }
  };

  /* ── Send ──────────────────────────────────────────────── */
  const handleSend = async (textToSend = inputText) => {
    const now = Date.now();
    // 1. Debounce guard: Discard duplicate triggers within 650ms
    if (now - lastSendTimeRef.current < 650) {
      console.warn("Blocked duplicate handleSend: trigger within 650ms");
      return;
    }
    // 2. Synchronous ref locks: prevent concurrent execution before React state re-renders
    if (isSendingRef.current || isGeneratingRef.current || isGenerating) {
      console.warn("Blocked duplicate handleSend: response generation in flight");
      return;
    }

    const rawContent = typeof textToSend === 'string' ? textToSend : (inputText || '');
    if (!rawContent.trim() && !attachedImages.length && !attachedFiles.length) return;

    // Immediately acquire locks synchronously
    lastSendTimeRef.current = now;
    isSendingRef.current = true;
    isGeneratingRef.current = true;
    setIsGenerating(true);

    // Immediately clear input fields synchronously
    setInputText('');
    const currentImages = [...attachedImages];
    const currentFiles = [...attachedFiles];
    setAttachedImages([]);
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }

    try {
      setActiveQuestion(null);
      saveLearnedPreference(rawContent);
      const botId = (Date.now() + 1).toString();
      let finalContent = rawContent.trim() ? rawContent : (currentImages.length > 0 ? "Analyze this attached screenshot/image in detail." : rawContent);

      const lensResult = parsePromptLens(finalContent, effectiveUsername);
      let lensDisplayLabel = null;
      if (lensResult.isLens) {
        lensDisplayLabel = `${lensResult.lens.icon} **[${lensResult.lens.title}]** ${lensResult.query}`;
        finalContent = lensResult.lens.directive(lensResult.query);
        setThemeToast(`✨ Applied ${lensResult.lens.command} (${lensResult.lens.title})`);
        setTimeout(() => setThemeToast(''), 3000);
      }

      const shouldDeepResearch = isDeepResearch || (lensResult.isLens && lensResult.lens.command === '/DEEP_RESEARCH');
      const shouldWebSearch = isWebSearchActive || (lensResult.isLens && lensResult.lens.command === '/SEARCH');

      let webSources = [];
      if (shouldWebSearch) {
        const queryToSearch = lensResult.isLens ? lensResult.query : rawContent.trim();
        if (queryToSearch) {
          setThemeToast('🌐 Searching the web in real-time...');
          try {
            webSources = await performWebSearch(queryToSearch);
          } catch (e) {
            console.warn('Web search lookup error:', e);
          }
          setTimeout(() => setThemeToast(''), 3000);
        }
      }

      if (currentFiles.length > 0) {
        const fileTextStr = currentFiles.map(f => '\n\n📄 [ATTACHED FILE: ' + f.name + ']\n```\n' + f.content + '\n```').join('');
        finalContent += fileTextStr;
      }

      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: finalContent,
        displayContent: lensDisplayLabel,
        images: currentImages,
        image: currentImages[0] || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const botMsg = {
        id: botId,
        role: 'assistant',
        content: '',
        webSources: webSources.length > 0 ? webSources : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updated = dedupeMessages([...messages, userMsg]);
      const newChatMessages = dedupeMessages([...updated, botMsg]);
      setMessages(newChatMessages);

      if (!isGuestMode && userStorageKey) {
        try {
          const activeId = resolvedActiveChatId || chats[0]?.id;
          const currentStored = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
          const newStored = currentStored.map(c => c.id === activeId ? { ...c, messages: newChatMessages } : c);
          if (newStored.length > 0) {
            localStorage.setItem(userStorageKey, JSON.stringify(newStored));
          }
        } catch (e) {
          console.warn('Sync storage error on handleSend:', e);
        }
      }

      await generateBotReply(updated, botId, webSources, shouldDeepResearch);
    } finally {
      isSendingRef.current = false;
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  /* ── Version Switcher (ChatGPT & Claude Parity) ── */
  const handleSwitchVersion = (msgId, newVersionIdx) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.versions && m.versions[newVersionIdx]) {
        const v = m.versions[newVersionIdx];
        return {
          ...m,
          content: v.content,
          thinking: v.thinking,
          telemetry: v.telemetry,
          versionIndex: newVersionIdx
        };
      }
      return m;
    }));
  };

  /* ── Regenerate with Version Branching (ChatGPT & Claude Parity) ── */
  const handleRegenerate = async idx => {
    if (isGenerating) return;
    const history = messages.slice(0, idx);
    if (!history.length) return;

    // Target bot message to append a new version to
    const targetMsg = messages[idx];
    const isAssistantTarget = targetMsg && targetMsg.role === 'assistant';

    let botId;
    if (isAssistantTarget) {
      botId = targetMsg.id;
      // Initialize or preserve versions array
      const existingVersions = targetMsg.versions || [{
        content: targetMsg.content,
        thinking: targetMsg.thinking,
        telemetry: targetMsg.telemetry
      }];
      setMessages(prev => prev.map(m =>
        m.id === botId ? {
          ...m,
          content: '',
          thinking: undefined,
          versions: [...existingVersions, { content: '', thinking: undefined }],
          versionIndex: existingVersions.length
        } : m
      ));
    } else {
      botId = (Date.now() + 1).toString();
      const botMsg = {
        id: botId, role: 'assistant', content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        versions: [{ content: '', thinking: undefined }],
        versionIndex: 0
      };
      setMessages([...history, botMsg]);
    }

    await generateBotReply(history, botId);
  };

  /* ── Prompt & Code Enhancement Magic Wand (Gemini & ChatGPT caliber) ── */
  const handleEnhancePrompt = async () => {
    const original = inputText.trim();
    
    if (!original) {
      setThemeToast('💡 Type your idea or question first, then tap to enhance with AI!');
      setTimeout(() => setThemeToast(''), 3000);
      return;
    }

    setIsEnhancingPrompt(true);
    setThemeToast('✨ Synthesizing master prompt with AI (Gemini & ChatGPT caliber)...');

    // Advanced dynamic AI prompt expansion via fast LLM
    try {
      const activeGroqKey = groqKey || SYSTEM_KEYS.groq || "";
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);

      const sys = `You are an elite, world-class Prompt Engineer and Prompt Architect matching the highest standards of OpenAI's meta-prompting team and Google DeepMind researchers.
Transform the user's raw idea, question, or request into a MASTERPIECE, WORLD-CLASS PROMPT that elicits the most thorough, precise, and high-impact response possible from advanced AI models (GPT-4o, Gemini 2.5 Pro, Claude 3.5 Sonnet).

STRICT STRUCTURE OF THE MASTER PROMPT:
1. Expert Role & Persona: Define the authoritative domain identity, mindset, and standards.
2. Context & Mission Objective: Clear background, target audience, and precise goal.
3. Execution Methodology & Step-by-Step Chain-of-Thought: Phased instructions for the AI to reason and build.
4. Key Constraints & Quality Guardrails: What to avoid, zero truncation, edge cases, strict factual accuracy.
5. Output Format & Deliverables: Explicit formatting requirements (clean markdown, tables, bullet points, production code).

RULES:
- Return ONLY the final enhanced prompt.
- Do NOT include any intro (like "Here is your enhanced prompt:"), commentary, or conversational filler.
- Ready to execute immediately.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeGroqKey}`
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: `Transform this request into an elite master prompt:\n"${original}"` }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        let promptContent = data.choices?.[0]?.message?.content?.trim();
        if (promptContent) {
          if (promptContent.includes('</think>')) {
            promptContent = promptContent.split('</think>')[1].trim();
          }
          setInputText(promptContent);
          if (textareaRef.current) {
            setTimeout(() => textareaRef.current.focus(), 50);
          }
          setIsEnhancingPrompt(false);
          setThemeToast('🪄 Master Prompt synthesized with AI!');
          setTimeout(() => setThemeToast(''), 3000);
          return;
        }
      }
    } catch (err) {
      console.warn("AI prompt enhancement fast-fallback:", err);
    }

    // High-grade algorithmic structured fallback if offline / timeout
    const isCode = /function|const|let|var|def|class|import|return|select|from|where|<[a-z]+|{|}|\(\)|=>/i.test(original);
    const isUI = /3d|box|card|ui|button|component|landing|page|web|header|footer|navbar|sidebar|form|modal|hero|css|design/i.test(original);
    const isWriting = /write|essay|article|post|copy|story|email|script|blog|pitch/i.test(original);
    
    let enhanced = '';
    if (isCode) {
      enhanced = `Act as a Principal Software Architect and Staff Engineer.

## MISSION OBJECTIVE
Refactor, optimize, and harden the following code into production-grade, enterprise-ready software:
\`\`\`
${original}
\`\`\`

## EXECUTION METHODOLOGY & STEP-BY-STEP WORKFLOW
1. Architectural Review: Identify anti-patterns, performance bottlenecks, and concurrency or memory issues.
2. Production-Grade Implementation: Rewrite 100% complete, un-truncated, idiomatic code with strict type safety and modern best practices.
3. Edge-Case & Error Hardening: Handle invalid inputs, null/undefined states, async rejections, and boundary cases.
4. Complexity & Optimization: Provide Big-O Time and Space complexity analysis alongside implementation notes.

## STRICT CONSTRAINTS
- STRICT COMMENTING: Include comments ONLY on lines where you added or changed something. Never put comments everywhere across unchanged code.`;
    } else if (isUI) {
      enhanced = `Act as an Award-Winning Lead UI/UX Designer and Principal Full-Stack Engineer (Awwwards / Dribbble caliber).

## MISSION OBJECTIVE
Design and build a world-class, 3D interactive, responsive, and visually stunning web application for:
"${original}"

## ARCHITECTURE & DESIGN SYSTEM
1. Visual Aesthetic: Modern glassmorphism (backdrop-filter: blur), glowing neon accents, smooth hover transforms (translateY(-4px)), and clean typography.
2. Interactive Features: Mouse orbital physics/3D tilt, responsive drawer/modal interactions, dynamic search/filter, and instant dark/light mode toggle.
3. Complete Implementation: Self-contained, working HTML5/CSS3/JS or React code ready to execute with zero missing dependencies.

## STRICT CONSTRAINTS
- NEVER truncate code or omit CSS/JS.
- Ensure 100% responsiveness across mobile, tablet, and desktop screens.`;
    } else if (isWriting) {
      enhanced = `Act as an Elite Direct-Response Copywriter and Master Storyteller.

## MISSION OBJECTIVE
Create a deeply engaging, persuasive, and high-impact piece of writing on:
"${original}"

## EXECUTION METHODOLOGY
1. The Hook: Open with a compelling pattern interrupt or visceral insight that immediately captures attention.
2. Core Narrative Engine: Deliver high-density, actionable value with rhythmic sentence variation and vivid metaphors.
3. Call to Action: Conclude with a clear, psychologically persuasive takeaway or next step.

## STRICT CONSTRAINTS
- Eliminate all corporate jargon, cliché filler words ('delve', 'tapestry', 'testament'), and passive voice.
- Maximize scannability with punchy subheaders and bullet points.`;
    } else {
      enhanced = `Act as a World-Class Subject Matter Expert and Senior Consultant.

## MISSION OBJECTIVE
Provide an exhaustive, high-fidelity, and mathematically/factually rigorous master breakdown for:
"${original}"

## STEP-BY-STEP REASONING METHODOLOGY
1. First-Principles Deconstruction: Define core mechanics, foundational definitions, and critical assumptions.
2. Deep Comparative Analysis: Evaluate trade-offs, alternative approaches, and real-world benchmarks.
3. Actionable Implementation: Provide clear, prioritized action steps and practical takeaways.

## STRICT CONSTRAINTS
- Zero hallucination: Base all assertions on verified real-world facts.
- Use clear markdown headers, bold key concepts, and structured comparison tables.`;
    }

    setInputText(enhanced);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 50);
    }
    setIsEnhancingPrompt(false);
    setThemeToast('🪄 Master Prompt synthesized!');
    setTimeout(() => setThemeToast(''), 3000);
  };

  /* ── Edit flow ─────────────────────────────────────────── */
  const startEditing   = (id, text) => { setEditingId(id); setEditText(text); };
  const cancelEditing  = ()         => setEditingId(null);

  const saveEditedMessage = async id => {
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return;
    const edited = {
      ...messages[idx], content: editText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...messages.slice(0, idx), edited];
    const botId = (Date.now() + 1).toString();
    const botMsg = {
      id: botId, role: 'assistant', content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...updated, botMsg]);
    setEditingId(null);
    await generateBotReply(updated, botId);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isGeneratingRef.current = false;
    setIsGenerating(false);
  };

async function fetchLiveWebSearch(query) {
  if (!query) return null;
  let snippets = [];
  try {
    const cleanQuery = query.replace(/[^\w\s+]/g, ' ').trim();
    const encoded = encodeURIComponent(cleanQuery);

    const stopWords = new Set(['i', 'have', 'heard', 'of', 'a', 'an', 'which', 'has', 'more', 'than', 'some', 'the', 'is', 'are', 'was', 'were', 'for', 'with', 'about', 'what', 'who', 'where', 'how', 'can', 'you', 'tell', 'me', 'please', 'help', 'do', 'does', 'in', 'on', 'at']);
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w.toLowerCase()));
    
    // Distill conversational sentences into high-density keywords for superior search relevance
    const distilledQuery = words.length > 0 ? words.slice(0, 6).join(' ') : cleanQuery;
    const keywordQuery = encodeURIComponent(distilledQuery);
    const altQuery = encodeURIComponent(words.filter(w => !['repo', 'github', 'repository'].includes(w.toLowerCase())).slice(0, 5).join(' ') || distilledQuery);
    const searchTarget = (words.length >= 4) ? keywordQuery : encoded;

    // 1. GitHub Repository Search API
    try {
      const ghRes = await fetch(`https://api.github.com/search/repositories?q=${altQuery}&sort=stars&order=desc`);
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        if (ghData.items && ghData.items.length > 0) {
          ghData.items.slice(0, 3).forEach(repo => {
            snippets.push(`[GitHub Repository: ${repo.full_name} | ⭐ ${repo.stargazers_count}]\nDescription: ${repo.description || 'N/A'}\nURL: ${repo.html_url}`);
          });
        }
      }
    } catch (e) {}

    // 2. Tavily AI Search & DuckDuckGo via Same-Origin Serverless Proxy
    try {
      const ddgRes = await fetch(`/api/search?q=${searchTarget}`);
      if (ddgRes.ok) {
        const data = await ddgRes.json();
        if (data.results && data.results.length > 0) {
          data.results.forEach(item => {
            snippets.push(`[Web Source: ${item.title} | ${item.url}]\n${item.snippet}`);
          });
          if (data.answer) {
            snippets.unshift(`[AI Research Summary: Tavily Deep Search]\n${data.answer}`);
          }
        } else if (data.AbstractText) {
          snippets.push(`[Source: ${data.AbstractURL || 'DuckDuckGo'}]\n${data.AbstractText}`);
        }
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          data.RelatedTopics.slice(0, 3).forEach(topic => {
            if (topic.Text) snippets.push(`- ${topic.Text}`);
          });
        }
      }
    } catch (e) {}

    // 3. Wikipedia Search API
    try {
      const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${keywordQuery}&format=json&origin=*`);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
          wikiData.query.search.slice(0, 2).forEach(item => {
            const cleanSnippet = item.snippet.replace(/<[^>]*>?/gm, '');
            snippets.push(`[Wikipedia: ${item.title}]\n${cleanSnippet}`);
          });
        }
      }
    } catch (e) {}

    if (snippets.length > 0) {
      return snippets.join('\n\n');
    }
  } catch (err) {
    console.warn("Live web search fetch failed:", err);
  }
  return null;
}

    /* ── Core generation ───────────────────────────────────── */
  const generateBotReply = async (rawHistory, passedBotId, injectedWebSources = null, isDeepModeActive = null) => {
    setIsGenerating(true);
    isGeneratingRef.current = true;
    const startTime = Date.now();
    const isFastMode = thinkingMode === 'fast';

    const specialistDirective = `
══════════════════════════════════════════════════════════════════
[🚨 SPECIALIZED ASSISTANT ACTIVATED: ${currentSpecialist.name.toUpperCase()} (${currentSpecialist.badge})]
${currentSpecialist.systemPrompt}
══════════════════════════════════════════════════════════════════
`;

    let systemPrompt;

    if (isFastMode && (!currentSpecialist || currentSpecialist.id === 'general')) {
      // ⚡ FAST MODE: crisp, direct, visual formatting, 100% accurate and factually grounded
      systemPrompt = `${specialistDirective}
You are Bhavya's AI Assistant. Current Year: 2026.
CRITICAL ACCURACY & CHATGPT-STYLE SPEED MANDATE:
- Be 100% factually accurate, precise, and correct. Never fabricate, hallucinate, or guess facts.
- 🚫 ZERO BORING PARAGRAPHS: Do not write essays or dense blocks of text.
- ⚡ BULLET POINTS & SYMBOLS: Deliver answers directly using bold bullet points (• **Key Point**: ...), emojis (⚡, 💡, 🎯, 📌), and visual symbols (→, ✓).
- 📊 COMPARISON TABLES: If comparing items or explaining options/metrics, use a concise Markdown table.
- 💻 CODE: Clean, exact, complete snippets with zero fluff.
- Maximize scannability — make the solution crystal clear in 5 seconds.`;
    } else {
      const prompts = getSystemPrompts(effectiveUsername);
      const baseSystemPrompt = prompts[coachMode] || prompts.moderate;
      const userInstructions = getCustomInstructions(effectiveUsername);
      systemPrompt = `${specialistDirective}\n\n${baseSystemPrompt}\n\n[USER PROFILE & MEMORY CONTEXT]\n${userInstructions}`;

      if (isWebSearchEnabled) {
        systemPrompt += "\n\n[DEEP WEB RESEARCH DIRECTIVE]\nReal-time web search mode is ACTIVE. Provide up-to-date, comprehensive information, live facts, code snippets, structured research summaries, and source links.";
      }

      const activeDeepResearch = isDeepModeActive !== null ? isDeepModeActive : isDeepResearch;
      if (activeDeepResearch) {
        systemPrompt += `\n\n[AUTONOMOUS DEEP RESEARCH & MULTI-HOP REASONING PROTOCOL]
You are operating in DEEP RESEARCH MODE. You must conduct an exhaustive, academic-grade investigation.
CRITICAL FORMATTING MANDATE:
You MUST begin your response by wrapping your structured multi-hop investigative path inside a <deep_research_journey>...</deep_research_journey> tag:
<deep_research_journey>
- Phase 1: Problem Decomposition & Hypothesis Formulation
- Phase 2: Multi-Hop Evidence Synthesis & Data Gathering
- Phase 3: Stress-Testing Contradictions, Failure Modes & Edge Cases
- Phase 4: Final Synthesis & Confidence Scoring
</deep_research_journey>

Immediately after closing </deep_research_journey>, deliver the comprehensive deep research report with:
1. 🎯 Executive Summary & Core Verdict
2. 🔬 Multi-Hop Deep Dive Analysis (Underlying mechanisms, historical & empirical data)
3. 📊 Comparative Benchmark Matrix (Clean Markdown table with numeric data)
4. ⚠️ Critical Risks, Trade-offs & Limitations
5. 🚀 Actionable Strategic Roadmap / Implementation Guide`;
      }

      const activeSources = (injectedWebSources && injectedWebSources.length > 0) ? injectedWebSources : null;
      if (activeSources) {
        const sourceSummaries = activeSources.map((s, idx) => `[Web Source ${idx + 1}]: "${s.title}" (${s.url})\nSnippet: ${s.snippet}`).join('\n\n');
        systemPrompt += `\n\n[REAL-TIME LIVE WEB SEARCH FINDINGS]\nYou have live web search results for this query:\n${sourceSummaries}\nIncorporate these up-to-date real-world facts directly into your answer and cite sources where relevant.`;
      }

      systemPrompt += "\n\n[CONVERSATIONAL MEMORY & CONTEXT RETENTION DIRECTIVE]\nYou must maintain strict context continuity across all turns in this chat. When the user asks follow-up questions or gives short replies (e.g. 'I want to listen to music at the next level', 'Which one is better?', 'What about the second option?'), ALWAYS connect your response directly to the specific items, products, options, code, or context discussed in the immediately preceding messages in this conversation!";
    }

    const THINKING_MODE_DIRECTIVES = {
      fast: `\n\n[AI REASONING MODE: ULTRA-FAST MODE 🚀]
CRITICAL SPEED & ACCURACY MANDATE:
- Deliver lightning-fast output with zero hallucination.
- Give direct, concise, mathematically and factually rigorous answers.
- ALWAYS DELIVER FULL WORKING CODE: When reviewing, fixing, or answering with code, NEVER omit or cut off the code. Deliver the complete, corrected code block immediately.
- No long textbook introductions, no cheerleading or conversational filler.
- Present the verified solution, code, and brief explanation cleanly!`,

      deep: `\n\n[AI REASONING MODE: 100X DEEP THINKING MODE (MAXIMUM LOGICAL REASONING) 🧠]\nCRITICAL REASONING & CHAIN-OF-THOUGHT MANDATE:
1. INTERNAL REASONING DIRECTIVE (<think>): You MUST begin your response with an internal chain-of-thought analysis enclosed inside <think>...</think> tags.
2. MANDATORY 3-POINT PRE-FLIGHT VERIFICATION PASS inside <think>:
   - ✓ Correctness & Bounds: Verify variable scopes, 0-indexing, off-by-one bounds, and type/memory safety.
   - ✓ Edge Cases: Stress-test null/empty states, negative numbers, 0, overflow, and concurrent race conditions.
   - ✓ Arithmetic & Constraint Check: Manually calculate all mathematical expressions step-by-step and verify 100% adherence to all user constraints.
3. PRISTINE FINAL OUTPUT: After closing </think>, deliver the polished, master-level response. Lead with the core insight or executive summary in bold, followed by structured, elegant explanations.
4. UNCOMPROMISING FACTUAL RIGOR: Cross-verify all facts, APIs, formulas, and edge cases.`,

      expert: `\n\n[AI REASONING MODE: EXPERT MENTOR MODE 🎓]\nCRITICAL MENTOR MANDATE - ALWAYS TEACH DEEPLY WITH TIMELINES & EXAMPLES:
- You are a world-class senior professor, master mentor, and lead software architect.
- You may include internal planning inside <think>...</think> tags to outline your curriculum or debugging strategy.
- NEVER just write code and exit! You MUST thoroughly explain the internal logic, execution flow, and real-world implications.
- When explaining any code with sequential steps, timers (setTimeout/sleep), asynchronous operations, or event loops, you MUST:
  1. Explicitly break down the exact TIMING of every output (e.g., "[0ms / Immediately]: ...", "[After 2000ms (2.0s delay)]: ...").
  2. Explain WHY the outputs came one after another in that exact chronological order (call stack vs queue, non-blocking asynchronous event loop, callback chaining).
  3. Provide an Execution Timeline Table showing: | Timestamp / Order | Stage / Thread State | Console Output | Why It Occurs At This Moment |
  4. Teach using relatable real-world analogies, explain the underlying 'Why', and detail practical takeaways.`,

      genius: `\n\n[AI REASONING MODE: QUANTUM GENIUS ARCHITECT MODE ⚡]\nAct as a principal software architect and polymath genius. Formulate comprehensive architectural reasoning and execute a 3-point pre-flight sanity check inside <think>...</think> tags before presenting production-grade, enterprise-ready solutions with complete trade-off evaluations.`
    };

    systemPrompt += THINKING_MODE_DIRECTIVES[thinkingMode] || THINKING_MODE_DIRECTIVES.deep;

    systemPrompt += `\n\n[PRECISION & PRODUCTION CODE CONTRACT]
- SKIP THE BASICS MANDATE (CRITICAL): NEVER explain elementary textbook definitions, obvious concepts, or beginner tutorials (e.g. what is an array, what is a loop, what is a function). The user is an advanced software engineer / computer science student who already knows the fundamentals. Go straight into the technical depth, underlying mechanics, edge cases, and high-performance trade-offs.
- CODE PRESERVATION MANDATE (CRITICAL): When reviewing, debugging, or fixing user-provided code, ALWAYS preserve the user's original logic, variable names, function signatures, and algorithmic approach. Surgically fix the bug IN-PLACE directly inside their code. NEVER discard their code or generate an entirely different algorithm/solution from scratch unless the user explicitly requests an alternative.
- Fenced Code Blocks: Always specify the explicit language tag (e.g. \`\`\`html, \`\`\`cpp, \`\`\`python). Never output raw un-fenced markup or bare code.
- 100% Complete & Runnable: Zero truncation, zero "// TODO", zero "// ... rest of code".
- Strict Zero-Clutter Commenting: ONLY place a 1-line comment directly on the exact line(s) where you fixed or added logic. Unchanged lines must have NO comments. All comments render in green.
- KaTeX Math Formatting: Inline math MUST use $...$ (no internal spaces, e.g. $O(N)$); display formulas MUST use $...$ on their own dedicated blank lines. Never emit raw LaTeX outside dollar delimiters.`;

    const COACH_ENFORCEMENT_DIRECTIVES = {
      soft: `\n\n═══════════════════════════════════════════════════════════
[🚨 ACTIVE COACHING TONE MANDATE: CLEAR & ENCOURAGING MENTOR 😇]
PRIORITY: HIGHEST OVERRIDE.
- Direct, friendly, patient, and crystal clear.
- Explain concepts simply and intuitively so anyone can understand without confusion.
- NO conversational filler intros (e.g. "Hello Bhavya Mishra!", "Certainly!"). Start directly with the clean solution.
- Keep paragraphs short (1-3 sentences) and use clean bullet points.
═══════════════════════════════════════════════════════════`,

      moderate: `\n\n═══════════════════════════════════════════════════════════
[🚨 ACTIVE COACHING TONE MANDATE: BALANCED PRAGMATIC ENGINEER ⚖️]
PRIORITY: HIGHEST OVERRIDE.
- Objective, articulate, pragmatic, and cleanly structured.
- Provide clear comparisons, pros/cons, and clean code without emotional bias or filler text.
- NO conversational filler intros. Start directly with the clean solution.
═══════════════════════════════════════════════════════════`,

      brutal: `\n\n═══════════════════════════════════════════════════════════
[🚨 CRITICAL COACHING TONE MANDATE: BRUTAL REALITY-CHECK & TOUGH-LOVE COACH 💀]
PRIORITY: HIGHEST OVERRIDE — OVERRULES ALL CORPORATE POLITENESS AND DEFAULT POLITE ASSISTANT BEHAVIOR.
- YOU ARE STRICTLY FORBIDDEN FROM BEING POLITE, GENTLE, OR SYCOPHANTIC.
- NEVER say: "Certainly!", "Sure thing!", "I'd be happy to help", "That's a great question!", "I hope this helps!", or use soft cheerleading.
- For casual greetings or small talk (e.g. "hi", "how are you"): Cut the pleasantries immediately. Demand to know what they're actually building, or tell them to stop procrastinating and get to work.
- BE RADICALLY HONEST, BLUNT, DIRECT, AND DEMANDING. Zero sugarcoating. Zero fluff.
- Call out weak logic, excuses, indecision, shallow thinking, and wishful thinking without hesitation.
- Tell the user the hard, unvarnished truth they NEED to hear, not what flatters them.
- Demand ruthless discipline, accountability, and world-class standards.
═══════════════════════════════════════════════════════════`
    };

    systemPrompt += (COACH_ENFORCEMENT_DIRECTIVES[coachMode] || COACH_ENFORCEMENT_DIRECTIVES.moderate);

    // 🎯 Precision & Task-Adaptive Temperature Steering:
    // - 0.05 (Deterministic greedy decoding) for Code, Math, SQL, JSON, Algorithms, Bug fixing to eliminate syntax hallucination and errors.
    // - 0.15 - 0.25 (Focused & low latency) for Fast Mode and general technical Q&A.
    // - 0.65 (Expressive) for Brutal coach mode or creative writing.
    const lastUserPrompt = rawHistory.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
    const isDeterministicTask = /```|function\b|class\b|def\b|select\b|from\b|where\b|\bmath\b|calculate|solve|derive|integral|algorithm|regex|json|sql|typescript|javascript|python|c\+\+|bug|error|fix|debug|leetcode/i.test(lastUserPrompt);

    const effectiveTemperature = isDeterministicTask
      ? 0.05
      : (coachMode === 'brutal' ? 0.65 : (coachMode === 'soft' ? 0.4 : (isFastMode ? 0.15 : 0.25)));

    const hasImagesInRawHistory = rawHistory.some(m => (m.images && m.images.length > 0) || m.image);
    if (hasImagesInRawHistory) {
      systemPrompt += "\n\n[CRITICAL VISION DIRECTIVE]\nAn image or screenshot has been attached to the conversation. You MUST perform immediate, direct visual analysis. Read all visible text, identify the application, window, settings, storage, code, or terminal shown, extract all metrics, numbers, and options, and explain what is displayed. DO NOT ask the user what their question is or say 'It seems like you didn't ask a question'—provide direct detailed visual analysis immediately!";
    }
    const botId = passedBotId || (Date.now() + 1).toString();
    if (!passedBotId) {
      setMessages(prev => [...prev, {
        id: botId, role: 'assistant', content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // Filter out previous API error messages from history so they don't break subsequent AI calls
    let history = rawHistory.filter(m => {
      if (m.role === 'assistant' && (
        !m.content ||
        m.content.includes('API Error:') ||
        m.content.includes('Could not reach Ollama') ||
        m.content.includes('HF Status') ||
        m.content.includes('(Model returned an empty response')
      )) {
        return false;
      }
      return true;
    });

    // 🧠 Dynamic Sliding Context Window & Memory Compaction (Claude / ChatGPT standard):
    // Passing 20+ raw turns causes attention dilution, slow responses, and hallucinations.
    const MAX_CONTEXT_TURNS = isFastMode ? 6 : 14;
    if (history.length > MAX_CONTEXT_TURNS) {
      const olderCount = history.length - MAX_CONTEXT_TURNS;
      const olderHistory = history.slice(0, olderCount);
      const recentHistory = history.slice(olderCount);

      const earlierTopics = olderHistory
        .filter(m => m.role === 'user' && m.content)
        .map(m => m.content.slice(0, 80).replace(/\n/g, ' '))
        .slice(-4)
        .join('; ');

      if (earlierTopics && recentHistory.length > 0) {
        const contextRecap = `\n\n[CONVERSATION CONTINUITY CONTEXT]: Earlier in this chat, the user and assistant covered: "${earlierTopics}". Continue seamlessly from the current conversation without re-introducing yourself or repeating earlier answers.`;
        if (recentHistory[0].role === 'user') {
          recentHistory[0] = {
            ...recentHistory[0],
            content: contextRecap + "\n\n" + recentHistory[0].content
          };
        }
      }
      history = recentHistory;
    }

    if (isWebSearchEnabled && !isFastMode && history.length > 0) {
      const lastUserMsg = history[history.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user' && lastUserMsg.content) {
        const rawTxt = lastUserMsg.content.trim().toLowerCase().replace(/[^\w\s]/gi, '');
        const GREETINGS = ['hi', 'hello', 'hey', 'heya', 'hiya', 'hola', 'namaste', 'yo', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'whats up', "what's up", 'how are you', 'who are you', 'thanks', 'thank you'];
        const isGreeting = GREETINGS.includes(rawTxt) || rawTxt.length <= 2;

        if (!isGreeting) {
          const liveSearchData = await fetchLiveWebSearch(lastUserMsg.content);
          if (liveSearchData) {
            history[history.length - 1] = {
              ...lastUserMsg,
              content: `${lastUserMsg.content}\n\n[REAL-TIME LIVE WEB GROUNDING & SEARCH DATA (GROUND TRUTH)]:\n${liveSearchData}\n\n[CRITICAL ACCURACY INSTRUCTION]: Use these live search results as authoritative ground truth to provide 100% factual, up-to-date, and verified answers. If answering about modern releases, news, version numbers, or real-world events, strictly adhere to these facts and never hallucinate!`
            };
          }
        }
      }
    }
    let ragSources = null;

    // ── Inject Uploaded Documents Context into AI generation (skipped in Fast mode) ──
    if (!isFastMode && uploadedDocs && uploadedDocs.length > 0 && history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === 'user') {
        const queryLower = (lastMsg.content || '').toLowerCase();
        
        // Find matching documents by filename or keyword, or include all if requested
        const matched = uploadedDocs.filter(d => {
          if (queryLower.includes(d.name.toLowerCase())) return true;
          const words = queryLower.split(/\s+/).filter(w => w.length > 3);
          return words.some(w => d.name.toLowerCase().includes(w) || (d.content && d.content.toLowerCase().includes(w)));
        });

        const activeDocs = matched.length > 0
          ? matched
          : (useMemory || queryLower.includes('document') || queryLower.includes('file') || queryLower.includes('pdf') || queryLower.includes('code') || queryLower.includes('excel') || queryLower.includes('sheet') || queryLower.includes('word') || queryLower.includes('powerpoint') || queryLower.includes('presentation')
              ? uploadedDocs
              : (uploadedDocs.length <= 3 ? uploadedDocs : []));

        if (activeDocs.length > 0) {
          const docExcerpts = activeDocs.map(doc => {
            const snippet = doc.content.length > 6000
              ? doc.content.slice(0, 6000) + '...[content truncated]'
              : doc.content;
            return `### Attached Document: "${doc.name}" (${doc.type}, ${doc.sizeFormatted})\n${snippet}`;
          }).join('\n\n---\n\n');

          const contextNotice = `\n\n[WORKSPACE ATTACHED DOCUMENTS - You have access to the following documents uploaded by the user. Use and cite them accurately]:\n${docExcerpts}\n\n[INTERACTIVE CITATION MANDATE]: When you quote, reference, or rely on any statement or number from an attached document, you MUST include a bracketed citation tag in the exact format: [Source: exact_filename.ext]. For example: [Source: ${activeDocs[0].name}]. This enables one-click Jump-to-Source inspection for the user!`;

          history[history.length - 1] = {
            ...lastMsg,
            content: lastMsg.content + contextNotice
          };

          ragSources = [...(ragSources || []), ...activeDocs.map(d => d.name)];
        }
      }
    }

    if (useMemory && !isFastMode && history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === 'user') {
        try {
          const key = cohereKey || null;
          if (key) {
            const memCtrl = new AbortController();
            const memTimer = setTimeout(() => memCtrl.abort(), 1500);
            try {
              const embedResponse = await fetch('/api/cohere/v1/embed', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${key}`
                },
                signal: memCtrl.signal,
                body: JSON.stringify({
                  model: 'embed-english-v3.0',
                  texts: [lastMsg.content],
                  input_type: 'search_query'
                })
              });
              clearTimeout(memTimer);
              
              if (embedResponse.ok) {
                const embedData = await embedResponse.json();
                const queryVector = embedData.embeddings[0];

                const matchCtrl = new AbortController();
                const matchTimer = setTimeout(() => matchCtrl.abort(), 1500);
                try {
                  const matchResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_notes`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'apikey': SUPABASE_KEY,
                      'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    signal: matchCtrl.signal,
                    body: JSON.stringify({
                      query_embedding: queryVector,
                      match_threshold: 0.55,
                      match_count: 3
                    })
                  });
                  clearTimeout(matchTimer);

                  if (matchResponse.ok) {
                    const matches = await matchResponse.json();
                    if (matches && matches.length > 0) {
                      const contextText = "\n\n[Memory Context: Use this stored information to help answer the user query]:\n" + 
                        matches.map(m => `- ${m.content}`).join('\n');
                      
                      history[history.length - 1] = {
                        ...lastMsg,
                        content: lastMsg.content + contextText
                      };
                      
                      ragSources = [...new Set(matches.map(m => m.document_name))];
                    }
                  }
                } catch { clearTimeout(matchTimer); }
              }
            } catch { clearTimeout(memTimer); }
          }
        } catch (err) {
          console.warn("Failed to retrieve semantic memory context:", err);
        }
      }
    }

    const modelSupportsVision = (modelName) => {
      if (!modelName) return false;
      const name = modelName.toLowerCase();
      return (
        name.includes('gemini') ||
        name.includes('gemma') ||
        name.includes('vision') ||
        name.includes('gpt-4') ||
        name.includes('claude') ||
        name.includes('llava') ||
        name.includes('pixtral') ||
        name.includes('qwen') ||
        name.includes('minicpm') ||
        name.includes('moondream')
      );
    };

    // 👁️ AUTOMATIC MULTIMODAL VISION & DOCUMENT AUTO-ROUTER
    // If the conversation contains images or uploaded PDFs and the active model is text-only,
    // automatically engage Gemini 2.5 Flash Vision so document OCR and vision happen seamlessly!
    let effectiveModel = selectedModel;
    let autoVisionEngaged = false;
    const hasPdfDocs = uploadedDocs && uploadedDocs.some(d => d.ext === 'pdf' && d.base64Data);
    if ((hasImagesInRawHistory || hasPdfDocs) && !modelSupportsVision(selectedModel)) {
      effectiveModel = 'gemini-2.5-flash';
      autoVisionEngaged = true;
      setThemeToast(hasPdfDocs ? '📄 PDF Document detected: Auto-routed to Gemini 2.5 Multi-Modal Vision!' : '👁️ Image detected: Auto-routed to Gemini 2.5 Flash Vision!');
      setTimeout(() => setThemeToast(''), 3000);
    } else if (!autoVisionEngaged && !hasImagesInRawHistory && !hasPdfDocs && history.length > 0) {
      // ⚡ QUERY COMPLEXITY AUTO-ROUTER:
      // If free tier or local offline is selected with short greeting, route to lightweight model
      const lastUserMsg = history[history.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user' && lastUserMsg.content) {
        const text = lastUserMsg.content.trim().toLowerCase();
        const words = text.split(/\s+/);
        const isVeryShort = words.length <= 12;
        const isCodeQuery = text.includes('code') || text.includes('function') || text.includes('implement') || text.includes('write a') || text.includes('build a') || text.includes('program') || text.includes('bug') || text.includes('error') || text.includes('component');
        const isMathQuery = text.includes('calculate') || text.includes('derivative') || text.includes('integral') || text.includes('formula') || text.includes('equation') || text.includes('math');
        const isDeepLens = text.startsWith('/') || thinkingMode === 'deep' || thinkingMode === 'expert' || thinkingMode === 'genius';
        
        if (isVeryShort && !isCodeQuery && !isMathQuery && !isDeepLens && (selectedModel === 'free' || selectedModel === 'openrouter/free')) {
          effectiveModel = 'google/gemini-2.5-flash';
        }
      }
    }

    let isGemini = autoVisionEngaged || GEMINI_MODELS.includes(effectiveModel) || effectiveModel.startsWith('gemini-') || effectiveModel.startsWith('gemma-');
    let isGroq = !autoVisionEngaged && (GROQ_MODELS.includes(effectiveModel) || effectiveModel.startsWith('qwen/') || effectiveModel.startsWith('meta-llama/'));
    let isCerebras = !autoVisionEngaged && (CEREBRAS_MODELS.includes(effectiveModel) || effectiveModel.startsWith('cerebras/'));
    let isCohere = !autoVisionEngaged && (COHERE_MODELS.includes(effectiveModel) || effectiveModel.startsWith('command-') || effectiveModel.startsWith('c4ai-'));
    let isMistral = !autoVisionEngaged && (MISTRAL_MODELS.includes(effectiveModel) || effectiveModel.startsWith('mistral') || effectiveModel.startsWith('codestral'));
    let isSambaNova = !autoVisionEngaged && (SAMBANOVA_MODELS.includes(effectiveModel) || effectiveModel.startsWith('DeepSeek-') || effectiveModel.startsWith('Meta-Llama-'));
    let isHuggingFace = !autoVisionEngaged && HUGGINGFACE_MODELS.includes(effectiveModel);
    let isNvidia = !autoVisionEngaged && (NVIDIA_MODELS.includes(effectiveModel) || META_MODELS.includes(effectiveModel) || MICROSOFT_MODELS.includes(effectiveModel) || effectiveModel.startsWith('nvidia/') || effectiveModel.startsWith('meta/') || effectiveModel.startsWith('microsoft/') || effectiveModel.startsWith('llama-3'));
    let isZenMux = !autoVisionEngaged && (ZENMUX_MODELS.includes(effectiveModel) || effectiveModel.startsWith('x-ai/'));
    let isAnthropic = !autoVisionEngaged && (ANTHROPIC_MODELS.includes(effectiveModel) || effectiveModel.startsWith('claude-'));
    let isOpenAI = !autoVisionEngaged && (OPENAI_MODELS.includes(effectiveModel) || effectiveModel.startsWith('gpt-') || effectiveModel.startsWith('o1') || effectiveModel.startsWith('o3'));
    let isOpenRouter = !autoVisionEngaged && (OPENROUTER_MODELS.includes(effectiveModel) || (effectiveModel.includes('/') && !isHuggingFace && !isZenMux && !isNvidia && !isGroq && !isCerebras));

    // Only treat model as local if explicitly installed on local Ollama
    const LOCAL_MODEL_IDS = ['berozgaar', 'llama3.2:3b', 'phi4-mini', 'moondream', 'minicpm-v'];
    const isKnownLocal = LOCAL_MODEL_IDS.includes(effectiveModel) || models.some(m => m && m.name && (m.name === effectiveModel || (typeof m.name === 'string' && m.name.split(':')[0] === effectiveModel)));
    const isLocal = isKnownLocal && !isGemini && !isGroq && !isCerebras && !isCohere && !isMistral && !isSambaNova && !isHuggingFace && !isNvidia && !isZenMux && !isAnthropic && !isOpenAI && !isOpenRouter;

    let isOpenAICompatible = isGroq || isOpenRouter || isCohere || isMistral || isSambaNova || isHuggingFace || isNvidia || isZenMux || isOpenAI || isCerebras;

    const activeProviderName = isGemini ? 'gemini'
      : isGroq ? 'groq'
      : isOpenRouter ? 'openrouter'
      : isCohere ? 'cohere'
      : isMistral ? 'mistral'
      : isSambaNova ? 'sambanova'
      : isHuggingFace ? 'huggingface'
      : isNvidia ? 'nvidia'
      : isZenMux ? 'zenmux'
      : isAnthropic ? 'anthropic'
      : isOpenAI ? 'openai'
      : isCerebras ? 'cerebras'
      : 'gemini';

    if ((isLocal && !isConnected) || selectedModel === 'free' || selectedModel === 'openrouter/free') {
      isOpenAICompatible = true;
      isGroq = true;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);

    let url = getOllamaUrl('/api/chat');
    let headers = { 'Content-Type': 'application/json' };
    let bodyObj = {};

    const payloadMessages = history.map(m => {
      const msgObj = { role: m.role, content: m.content || "" };
      const allImgs = m.images && m.images.length > 0 ? m.images : (m.image ? [m.image] : []);
      if (allImgs.length > 0 && modelSupportsVision(effectiveModel)) {
        msgObj.images = allImgs.map(img => (typeof img === 'string' && img.includes(',') ? img.split(',')[1] : img)).filter(Boolean);
      }
      return msgObj;
    });

    const geminiMessages = history.map(m => {
      const parts = [];
      const allImgs = m.images && m.images.length > 0 ? m.images : (m.image ? [m.image] : []);
      
      // 1. Attach inline_data image parts first
      if (m.role !== 'assistant' && allImgs.length > 0) {
        allImgs.forEach(imgData => {
          if (typeof imgData === 'string') {
            const match = imgData.match(/^data:([^;]+);base64,(.+)$/);
            const mimeType = match ? match[1] : 'image/png';
            const base64Data = match ? match[2] : (imgData.includes(',') ? imgData.split(',')[1] : imgData);
            if (base64Data) {
              parts.push({
                inline_data: { mime_type: mimeType, data: base64Data }
              });
            }
          }
        });
      }

      // 1b. Attach uploaded PDF documents for native Gemini visual OCR & diagram comprehension
      if (m.role !== 'assistant' && uploadedDocs && uploadedDocs.length > 0) {
        uploadedDocs.forEach(doc => {
          if (doc.base64Data && doc.ext === 'pdf') {
            parts.push({
              inline_data: { mime_type: 'application/pdf', data: doc.base64Data }
            });
          }
        });
      }

      // 2. Attach text content part
      if (m.content && m.content.trim()) {
        parts.push({ text: m.content });
      } else if (m.role !== 'assistant' && allImgs.length > 0) {
        parts.push({ text: "Please carefully analyze this image/screenshot in full detail. Read all visible text, identify the application, menu, or window shown (such as system settings, storage, code, or terminal), describe what is displayed, and explain any details, numbers, or issues visible." });
      }

      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });

    if (isGemini) {
      const isGemma = effectiveModel.startsWith('gemma-');

      // Map display model name to active Google Gemini REST API endpoint
      let activeEndpointModel = 'gemini-2.5-flash';
      if (effectiveModel && typeof effectiveModel === 'string') {
        const clean = effectiveModel.trim();
        if (clean === 'gemini-3.7-flash') {
          activeEndpointModel = 'gemini-3.7-flash';
        } else if (clean === 'gemini-2.5-flash') {
          activeEndpointModel = 'gemini-2.5-flash';
        } else {
          // gemini-3.8-flash, gemini-3.8-pro, or any other display variant maps directly to gemini-2.5-flash for guaranteed 200 OK & zero 503 errors
          activeEndpointModel = 'gemini-2.5-flash';
        }
      }

      url = `https://generativelanguage.googleapis.com/v1beta/models/${activeEndpointModel}:streamGenerateContent?key=${geminiKey || SYSTEM_KEYS.gemini}`;

      if (isGemma) {
        bodyObj = {
          contents: [
            { role: 'user',  parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
            ...geminiMessages
          ]
        };
      } else {
        const geminiGenConfig = {
          temperature: effectiveTemperature,
          maxOutputTokens: 8192
        };
        if (isFastMode) {
          geminiGenConfig.thinkingConfig = { thinkingBudget: 0 };
        }
        bodyObj = {
          contents: geminiMessages,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: geminiGenConfig
        };
      }
    } else if (isOpenAICompatible) {
      let key = '';
      if (isGroq) {
        url = '/api/groq/openai/v1/chat/completions';
        key = groqKey || SYSTEM_KEYS.groq;
      } else if (isOpenRouter) {
        url = '/api/openrouter/api/v1/chat/completions';
        key = openRouterKey || SYSTEM_KEYS.openRouter;
      } else if (isCohere) {
        url = 'https://api.cohere.com/v2/chat';
        key = cohereKey || SYSTEM_KEYS.cohere;
      } else if (isMistral) {
        url = 'https://api.mistral.ai/v1/chat/completions';
        key = mistralKey || SYSTEM_KEYS.mistral;
      } else if (isSambaNova) {
        url = '/api/sambanova/v1/chat/completions';
        key = sambaNovaKey || SYSTEM_KEYS.sambaNova;
      } else if (isHuggingFace) {
        url = '/api/huggingface/v1/chat/completions';
        key = huggingFaceKey || SYSTEM_KEYS.huggingFace;
      } else if (isNvidia) {
        url = '/api/nvidia/chat/completions';
        key = nvidiaKey || SYSTEM_KEYS.nvidia;
      } else if (isZenMux) {
        url = '/api/zenmux/api/v1/chat/completions';
        key = zenmuxKey || SYSTEM_KEYS.zenmux;
      } else if (isOpenAI) {
        url = '/api/openai/chat/completions';
        key = openaiKey || SYSTEM_KEYS.openai;
      }

      headers['Authorization'] = `Bearer ${key}`;
      
      const openAIMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => {
          const allImgs = m.images && m.images.length > 0 ? m.images : (m.image ? [m.image] : []);
          if (allImgs.length > 0) {
            if (modelSupportsVision(selectedModel)) {
              const contentArray = [];
              if (m.content && m.content.trim()) {
                contentArray.push({ type: 'text', text: m.content });
              } else {
                contentArray.push({ type: 'text', text: "Analyze these attached images/screenshots. Diagnose what is shown, explain any details or issues, and provide complete steps or answers." });
              }
              allImgs.forEach(img => {
                contentArray.push({ type: 'image_url', image_url: { url: img } });
              });
              return { role: m.role, content: contentArray };
            } else {
              let textContent = m.content && m.content.trim() ? m.content : "Analyze the screenshot/code discussed in this conversation.";
              textContent += `\n[Image attached: User uploaded ${allImgs.length} screenshot(s)]`;
              return { role: m.role, content: textContent };
            }
          }
          return { role: m.role, content: m.content || "" };
        })
      ];

      let finalModel = selectedModel.startsWith('openrouter::') ? selectedModel.replace('openrouter::', '') : selectedModel;
      if (finalModel === 'mistral') finalModel = 'mistral-large-latest';
      if (finalModel === 'llama-3.1-8b-instruct') finalModel = isNvidia ? 'meta/llama-3.1-8b-instruct' : 'llama-3.1-8b-instant';
      if (finalModel === 'llama-3.1-70b-instruct') finalModel = isNvidia ? 'meta/llama-3.1-70b-instruct' : 'llama-3.3-70b-versatile';
      if (finalModel === 'llama-3.3-70b-instruct') finalModel = isSambaNova ? 'Meta-Llama-3.3-70B-Instruct' : 'llama-3.3-70b-versatile';
      
      // Override model for free or offline local models to OpenRouter Gemini 2.5 Flash
      if (finalModel === 'free' || finalModel === 'openrouter/free' || (isLocal && !isConnected)) {
        isOpenRouter = true;
        url = 'https://openrouter.ai/api/v1/chat/completions';
        key = openRouterKey || SYSTEM_KEYS.openRouter;
        headers['Authorization'] = `Bearer ${key}`;
        headers['HTTP-Referer'] = 'https://bhavyas-ai-assistant.vercel.app';
        headers['X-Title'] = 'Bhavyas AI Assistant';
        finalModel = 'google/gemini-2.5-flash';
      }

      bodyObj = {
        model: finalModel,
        messages: openAIMessages,
        max_tokens: isFastMode ? 4096 : 8192,
        temperature: effectiveTemperature,
        stream: true
      };
    } else if (isAnthropic) {
      url = '/api/anthropic/v1/messages';
      headers['x-api-key'] = anthropicKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];

      const anthropicMessages = history.map(m => {
        const allImgs = m.images && m.images.length > 0 ? m.images : (m.image ? [m.image] : []);
        if (allImgs.length > 0 && modelSupportsVision(selectedModel)) {
          const contentArray = [];
          if (m.content && m.content.trim()) contentArray.push({ type: 'text', text: m.content });
          else contentArray.push({ type: 'text', text: 'Analyze these images.' });
          allImgs.forEach(img => {
            const base64Data = img.split(',')[1] || img;
            contentArray.push({
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Data }
            });
          });
          return { role: m.role, content: contentArray };
        }
        let textContent = m.content || "";
        if (allImgs.length > 0) textContent += `\n[Image attached: User uploaded ${allImgs.length} screenshot(s)]`;
        return { role: m.role, content: textContent };
      });

      bodyObj = {
        model: selectedModel,
        system: systemPrompt,
        messages: anthropicMessages,
        max_tokens: 8192,
        temperature: effectiveTemperature,
        stream: true
      };
    } else {
      bodyObj = {
        model: selectedModel || 'llama3.2:3b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...payloadMessages
        ],
        options: { temperature: effectiveTemperature },
        stream: true
      };
    }

    try {
      let res;
      let primaryFailed = false;
      let primaryErrorMsg = '';
      let activeStreamType = isGemini ? 'gemini' : isCohere ? 'cohere' : isAnthropic ? 'anthropic' : isOpenAICompatible ? 'openai_compatible' : 'local';

      const isMobileAppEnv = typeof window !== 'undefined' && (
        Boolean(window.Capacitor?.isNativePlatform?.()) ||
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'file:' ||
        (window.location.hostname === 'localhost' && !window.location.port)
      );
      const targetFetchUrl = (url.startsWith('/') && isMobileAppEnv)
        ? `https://bhavyas-ai-assistant.vercel.app${url}`
        : url;

      const primaryController = new AbortController();
      const primaryTimeout = setTimeout(() => primaryController.abort(), 180000); // 180s full-generation timeout

      try {
        res = await fetch(targetFetchUrl, {
          method: 'POST',
          headers,
          signal: primaryController.signal,
          body: JSON.stringify(bodyObj)
        });
        clearTimeout(primaryTimeout);
        if (!res.ok || res.status === 504) {
          const errText = await res.text().catch(() => '');
          let shortMsg = `Status ${res.status}`;
          try {
            const errObj = JSON.parse(errText);
            shortMsg = errObj.message || errObj.error?.message || errObj.error || shortMsg;
          } catch {
            if (errText && errText.length < 100) shortMsg = errText;
          }
          throw new Error(shortMsg);
        }
      } catch (primaryErr) {
        clearTimeout(primaryTimeout);
        primaryFailed = true;
        primaryErrorMsg = primaryErr.name === 'AbortError' ? 'Primary connection timed out (>180s)' : primaryErr.message;
        console.warn(`Primary provider (${selectedModel}) failed or timed out: ${primaryErrorMsg}. Initiating Universal Fallback Chain...`);
      }

      // Universal Automatic Fallback Chain
      if (primaryFailed || !res || !res.ok) {
        let fallbackSuccess = false;

        // 🎯 TIER-SPECIFIC RUNNER-UP FAILOVER:
        // 1. Fast Mode: Primary groq/compound-mini fails -> Runner-up gemini-2.5-flash
        if (!fallbackSuccess && (selectedModel === 'groq/compound-mini' || isFastMode)) {
          const activeGeminiKey = geminiKey || SYSTEM_KEYS.gemini;
          if (activeGeminiKey) {
            try {
              console.log("⚡ Fast Mode Failover: Redirecting to gemini-2.5-flash...");
              const fbUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${activeGeminiKey}`;
              const fbRes = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: geminiMessages,
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: {
                    temperature: effectiveTemperature,
                    maxOutputTokens: 8192,
                    thinkingConfig: { thinkingBudget: 0 }
                  }
                })
              });
              if (fbRes.ok) {
                res = fbRes;
                fallbackSuccess = true;
                activeStreamType = 'gemini';
              }
            } catch (e) {
              console.warn("Fast mode runner-up fallback error:", e);
            }
          }
        }

        // 2. Balanced Mode: Primary gemini-3.7-flash fails -> Runner-up gpt-4o
        if (!fallbackSuccess && (selectedModel === 'gemini-3.7-flash' || (!isFastMode && thinkingMode !== 'deep' && isGemini))) {
          const activeOpenAIKey = openaiKey || SYSTEM_KEYS.openai;
          if (activeOpenAIKey) {
            try {
              console.log("⚖️ Balanced Mode Failover: Redirecting from gemini-3.7-flash to gpt-4o...");
              const fbRes = await fetch('/api/openai/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeOpenAIKey}`
                },
                body: JSON.stringify({
                  model: 'gpt-4o',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                  ],
                  max_tokens: 8192,
                  stream: true
                })
              });
              if (fbRes.ok) {
                res = fbRes;
                fallbackSuccess = true;
                activeStreamType = 'openai_compatible';
              }
            } catch (e) {
              console.warn("Balanced mode runner-up fallback error:", e);
            }
          }
        }

        // 3. Deep Thinking Mode: Primary deepseek-r1 fails -> Runner-up claude-opus-5
        if (!fallbackSuccess && (selectedModel === 'deepseek/deepseek-r1' || selectedModel.includes('r1'))) {
          const activeAnthropicKey = anthropicKey || SYSTEM_KEYS.anthropic;
          if (activeAnthropicKey) {
            try {
              console.log("🧠 Deep Thinking Failover: Redirecting from deepseek-r1 to claude-opus-5...");
              const fbRes = await fetch('/api/anthropic/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': activeAnthropicKey,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: 'claude-opus-5',
                  system: systemPrompt,
                  messages: history.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
                    role: m.role,
                    content: typeof m.content === 'string' ? m.content : String(m.content || '')
                  })),
                  max_tokens: 8192,
                  stream: true
                })
              });
              if (fbRes.ok) {
                res = fbRes;
                fallbackSuccess = true;
                activeStreamType = 'anthropic';
              }
            } catch (e) {
              console.warn("Deep Thinking runner-up fallback error:", e);
            }
          }
        }

        // Fallback Tier 0: Google Gemini Direct (gemini-2.5-flash / gemini-3.7-flash) - 100% Active & Ultra Reliable
        const activeGeminiKey = geminiKey || SYSTEM_KEYS.gemini;
        if (!fallbackSuccess && activeGeminiKey && (!isGemini || activeEndpointModel !== 'gemini-2.5-flash')) {
          try {
            const fallbackGeminiModel = (isGemini && activeEndpointModel === 'gemini-2.5-flash') ? 'gemini-3.7-flash' : 'gemini-2.5-flash';
            const fbGeminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackGeminiModel}:streamGenerateContent?key=${activeGeminiKey}`;
            const fbGeminiMessages = history.map(m => {
              const parts = [];
              const allImgs = m.images && m.images.length > 0 ? m.images : (m.image ? [m.image] : []);
              if (m.role !== 'assistant' && allImgs.length > 0) {
                allImgs.forEach(imgData => {
                  if (typeof imgData === 'string') {
                    const match = imgData.match(/^data:([^;]+);base64,(.+)$/);
                    const mimeType = match ? match[1] : 'image/png';
                    const base64Data = match ? match[2] : (imgData.includes(',') ? imgData.split(',')[1] : imgData);
                    if (base64Data) parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
                  }
                });
              }
              if (m.content && m.content.trim()) {
                parts.push({ text: m.content });
              }
              return { role: m.role === 'assistant' ? 'model' : 'user', parts };
            });

            const fbRes = await fetch(fbGeminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: fbGeminiMessages,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 8192,
                  ...(isFastMode ? { thinkingConfig: { thinkingBudget: 0 } } : {})
                }
              })
            });
            if (fbRes.ok) {
              res = fbRes;
              fallbackSuccess = true;
              activeStreamType = 'gemini';
            }
          } catch (e) {
            console.warn("Gemini fallback notice:", e);
          }
        }

        // Fallback Tier 1: OpenRouter Direct (google/gemini-2.5-flash) - 100% Active & Highly Reliable
        const activeOrKey = openRouterKey || SYSTEM_KEYS.openRouter || "";
        if (!fallbackSuccess && activeOrKey) {
          try {
            const fbRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeOrKey}`,
                'HTTP-Referer': 'https://bhavyas-ai-assistant.vercel.app',
                'X-Title': 'Bhavyas AI Assistant'
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                ],
                max_tokens: 8192,
                stream: true
              })
            });
            if (fbRes.ok) {
              res = fbRes;
              fallbackSuccess = true;
              activeStreamType = 'openai_compatible';
            }
          } catch (e) {
            console.warn("OpenRouter fallback notice:", e);
          }
        }

        // Fallback Tier 2: Cohere Direct (command-r-plus-08-2024) - 100% Active & Ultra Fast
        const activeCohereKey = cohereKey || SYSTEM_KEYS.cohere || "";
        if (!fallbackSuccess && activeCohereKey) {
          try {
            const fbRes = await fetch('https://api.cohere.com/v2/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeCohereKey}`
              },
              body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                ],
                max_tokens: 8192,
                stream: true
              })
            });
            if (fbRes.ok) {
              res = fbRes;
              fallbackSuccess = true;
              activeStreamType = 'cohere';
            }
          } catch (e) {
            console.warn("Cohere fallback notice:", e);
          }
        }

        // Fallback Tier 3: Mistral AI Direct (codestral-latest)
        const activeMistralKey = mistralKey || SYSTEM_KEYS.mistral || "";
        if (!fallbackSuccess && activeMistralKey) {
          try {
            const fbRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeMistralKey}`
              },
              body: JSON.stringify({
                model: 'codestral-latest',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                ],
                max_tokens: 8192,
                stream: true
              })
            });
            if (fbRes.ok) {
              res = fbRes;
              fallbackSuccess = true;
              activeStreamType = 'openai_compatible';
            }
          } catch (e) {
            console.warn("Mistral fallback notice:", e);
          }
        }

        // Fallback Tier 4: Groq Direct (qwen/qwen3.6-27b)
        const activeGroqKey = groqKey || SYSTEM_KEYS.groq || "";
        if (!fallbackSuccess && activeGroqKey) {
          try {
            const fbRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeGroqKey}`
              },
              body: JSON.stringify({
                model: 'qwen/qwen3.6-27b',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                ],
                max_tokens: 8192,
                stream: true
              })
            });
            if (fbRes.ok) {
              res = fbRes;
              fallbackSuccess = true;
              activeStreamType = 'openai_compatible';
            }
          } catch (e) {
            console.warn("Groq fallback notice:", e);
          }
        }

        if (!fallbackSuccess) {
          throw new Error(primaryErrorMsg || "All primary and fallback provider connections failed.");
        }
      }

      clearTimeout(timeout);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      let lastStreamUiUpdate = 0;
      const streamTickUi = (accumulated) => {
        const now = Date.now();
        if (now - lastStreamUiUpdate > 40) { // ~25 FPS live streaming updates
          lastStreamUiUpdate = now;
          const { cleanText, thinking } = extractClarifyAndThinking(accumulated);
          setMessages(prev => prev.map(m => m.id === botId ? {
            ...m,
            content: cleanText,
            thinking: thinking || undefined
          } : m));
        }
      };

      if (activeStreamType === 'gemini') {
        let buffer = '';
        while (true) {
          if (!isGeneratingRef.current) {
            reader.cancel();
            break;
          }
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
          let match;
          let lastIndex = 0;
          let chunkAdded = false;
          while ((match = regex.exec(buffer)) !== null) {
            try {
              const textContent = JSON.parse(`"${match[1]}"`);
              acc += textContent;
              chunkAdded = true;
            } catch {}
            lastIndex = regex.lastIndex;
          }
          buffer = buffer.slice(lastIndex);
          if (chunkAdded) streamTickUi(acc);
        }
      } else if (activeStreamType === 'cohere') {
        let buffer = '';
        while (true) {
          if (!isGeneratingRef.current) { reader.cancel(); break; }
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          let chunkAdded = false;
          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith('data: ')) continue;
            const dataStr = cleanLine.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'content-delta') {
                const text = parsed.delta?.message?.content?.text || '';
                if (text) {
                  acc += text;
                  chunkAdded = true;
                }
              }
            } catch {}
          }
          if (chunkAdded) streamTickUi(acc);
        }
      } else if (activeStreamType === 'openai_compatible') {
        let buffer = '';
        while (true) {
          if (!isGeneratingRef.current) {
            reader.cancel();
            break;
          }
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          let chunkAdded = false;

          for (const line of lines) {
            let cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine.startsWith('data: ')) {
              cleanLine = cleanLine.replace(/^data:\s*/, '');
            }
            if (cleanLine === '[DONE]') break;
            try {
              const parsed = JSON.parse(cleanLine);
              const content = 
                parsed.choices?.[0]?.delta?.content || 
                parsed.choices?.[0]?.message?.content || 
                parsed.choices?.[0]?.text || 
                parsed.choices?.[0]?.delta?.reasoning_content || 
                parsed.choices?.[0]?.delta?.reasoning ||
                parsed.response ||
                parsed.text ||
                '';
              if (content) {
                acc += content;
                chunkAdded = true;
              }
            } catch {}
          }
          if (chunkAdded) streamTickUi(acc);
        }
      } else if (activeStreamType === 'anthropic') {
        // Anthropic SSE: events like "content_block_delta" with delta.text
        let buffer = '';
        while (true) {
          if (!isGeneratingRef.current) { reader.cancel(); break; }
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          let chunkAdded = false;
          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith('data: ')) continue;
            const dataStr = cleanLine.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]' || dataStr === 'message_stop') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const text = parsed.delta?.text || parsed.delta?.thinking || '';
              if (text) {
                acc += text;
                chunkAdded = true;
              }
            } catch {}
          }
          if (chunkAdded) streamTickUi(acc);
        }
      } else {
        let buffer = '';
        while (true) {
          if (!isGeneratingRef.current) {
            reader.cancel();
            break;
          }
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          let chunkAdded = false;

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const p = JSON.parse(line);
              if (p.message?.content) {
                acc += p.message.content;
                chunkAdded = true;
              }
              if (p.done) break;
            } catch {}
          }
          if (chunkAdded) streamTickUi(acc);
        }
      }

      // If primary model returned 0 characters, run Universal Fallback to guarantee a complete response
      if (!acc.trim() && isGeneratingRef.current) {
        console.warn('Primary stream returned 0 characters. Executing automatic cloud fallback...');
        const activeGeminiKey = geminiKey || SYSTEM_KEYS.gemini;
        if (activeGeminiKey) {
          try {
            const fbRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeGeminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: geminiMessages,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
              })
            });
            if (fbRes.ok) {
              const fbJson = await fbRes.json();
              const fbText = fbJson.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
              if (fbText.trim()) acc = fbText.trim();
            }
          } catch (e) {
            console.warn('Gemini recovery error:', e);
          }
        }

        // If still empty, try OpenRouter (google/gemini-2.5-flash)
        if (!acc.trim()) {
          const activeOrKey = openRouterKey || SYSTEM_KEYS.openRouter;
          if (activeOrKey) {
            try {
              const fbRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeOrKey}`,
                  'HTTP-Referer': 'https://bhavyas-ai-assistant.vercel.app',
                  'X-Title': 'Bhavyas AI Assistant'
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                  ],
                  max_tokens: 8192
                })
              });
              if (fbRes.ok) {
                const fbJson = await fbRes.json();
                const fbText = fbJson.choices?.[0]?.message?.content || '';
                if (fbText.trim()) acc = fbText.trim();
              }
            } catch (e) {
              console.warn('OpenRouter recovery error:', e);
            }
          }
        }

        // If still empty, try Cohere (command-r-plus-08-2024)
        if (!acc.trim()) {
          const activeCohereKey = cohereKey || SYSTEM_KEYS.cohere;
          if (activeCohereKey) {
            try {
              const fbRes = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeCohereKey}`
                },
                body: JSON.stringify({
                  model: 'command-r-plus-08-2024',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
                  ],
                  max_tokens: 4096
                })
              });
              if (fbRes.ok) {
                const fbJson = await fbRes.json();
                const fbText = fbJson.message?.content?.[0]?.text || '';
                if (fbText.trim()) acc = fbText.trim();
              }
            } catch (e) {
              console.warn('Cohere recovery error:', e);
            }
          }
        }
      }

      // If still empty, supply a helpful fallback message so bubble is NEVER empty
      if (!acc.trim() && isGeneratingRef.current) {
        acc = "I apologize, but I did not receive a response from the service. Please tap the Regenerate button below to retry.";
      }

      // Single-Shot Complete Response Commit (No Per-Chunk UI Re-renders or Scroll Lag)
      if (acc.trim() && isGeneratingRef.current) {
        const { cleanText, thinking, parsedQuestion } = extractClarifyAndThinking(acc);
        if (parsedQuestion) {
          setActiveQuestion(parsedQuestion);
        }
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
        const totalChars = cleanText.length + (thinking ? thinking.length : 0);
        const tokenEst = Math.round(totalChars / 4);
        const modelTag = selectedModel || 'AI Model';
        const newTelemetry = { elapsed: elapsedSec, tokens: tokenEst, model: modelTag };

        setMessages(prev => prev.map(m => {
          if (m.id === botId) {
            const currentVersions = m.versions || [];
            const activeVIdx = m.versionIndex !== undefined ? m.versionIndex : Math.max(0, currentVersions.length - 1);
            const updatedVersions = [...currentVersions];
            updatedVersions[activeVIdx] = {
              content: cleanText,
              thinking: thinking || undefined,
              telemetry: newTelemetry
            };

            return {
              ...m,
              content: cleanText,
              thinking: thinking || undefined,
              telemetry: newTelemetry,
              versions: updatedVersions,
              versionIndex: activeVIdx
            };
          }
          return m;
        }));

        // ⚡ Real-Time Ecosystem Telemetry Sync
        syncTokensToEcosystemHub('assistant', tokenEst, activeProviderName);

      }

    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err.name === 'AbortError';
      if (isAbort && !isGeneratingRef.current) {
        // User manually stopped the response
        setMessages(prev => prev.map(m =>
          m.id === botId ? { ...m, content: m.content || '[Response stopped]' } : m
        ));
      } else {
      const providerName = isGemini ? 'Gemini'
        : isGroq ? 'Groq'
        : isOpenRouter ? 'OpenRouter'
        : isCohere ? 'Cohere'
        : isMistral ? 'Mistral'
        : isSambaNova ? 'SambaNova'
        : isHuggingFace ? 'HuggingFace'
        : isNvidia ? 'NVIDIA'
        : isZenMux ? 'ZenMux'
        : isAnthropic ? 'Anthropic'
        : isOpenAI ? 'OpenAI'
        : null;

      const fallback = isAbort
        ? 'Request timed out. The model took too long to respond.'
        : providerName
          ? `${providerName} API Error: ${err.message}`
          : `Could not reach Ollama. Make sure it is running:\n\nSet-Item Env:OLLAMA_ORIGINS "*"; ollama serve\n\n(Error: ${err.message})`;
      setMessages(prev => prev.map(m =>
        m.id === botId ? {
          ...m,
          content: fallback,
          telemetry: { elapsed: '0.00', tokens: 0, model: selectedModel || 'AI Model' }
        } : m
      ));
      }
    } finally {
      clearTimeout(timeout);
      setIsGenerating(false);
      isGeneratingRef.current = false;
      if (ragSources) {
        setMessages(prev => prev.map(m =>
          m.id === botId ? { ...m, ragSources: ragSources } : m
        ));
      }
      // Instantly push final state to cloud storage so page reloads have the complete conversation
      if (!isGuestMode && username && username !== 'Guest Operator' && chatsRef.current) {
        saveUserChats(username, chatsRef.current, resolvedActiveChatId).catch(() => {});
      }
    }
  };

  const simulateStreamingReply = async (id, text) => {
    isGeneratingRef.current = true;
    const tokens = text.split(' ');
    let current = '';
    for (let i = 0; i < tokens.length; i++) {
      if (!isGeneratingRef.current) break;
      await new Promise(r => setTimeout(r, 40 + Math.random() * 30));
      if (!isGeneratingRef.current) break;
      current += (i === 0 ? '' : ' ') + tokens[i];
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: current } : m));
    }
    setIsGenerating(false);
    isGeneratingRef.current = false;
  };



  /* ── Suggested prompts (shown when only welcome message exists) */
  const suggestions = [
    'Explain quantum computing simply',
    'Write a haiku about autumn',
    'Debug this Python snippet for me',
    'Compare React vs Vue vs Angular'
  ];

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div
      className={`chat-root ${lightsOut ? 'lights-out' : ''} ${isLightMode ? 'light-mode' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        overflow: 'hidden',
        background: isLightMode ? '#f4f4f5' : '#000000',
        position: 'relative',
      }}
    >
      {/* Background — Pure high-performance zero-lag black & white background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: isLightMode ? '#ffffff' : '#000000',
      }} />

      {/* ════════════════════
          HEADER
      ════════════════════ */}
      <header className="chat-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: IS_MOBILE ? 'auto' : '56px',
        minHeight: IS_MOBILE ? 'calc(54px + max(env(safe-area-inset-top, 0px), 38px))' : '56px',
        flexShrink: 0,
        paddingTop: IS_MOBILE ? 'max(env(safe-area-inset-top, 0px), 38px)' : '0px',
        paddingBottom: IS_MOBILE ? '6px' : '0px',
        paddingLeft: IS_MOBILE ? '8px' : '12px',
        paddingRight: IS_MOBILE ? '8px' : '12px',
        background: isLightMode ? '#ffffff' : '#000000',
        borderBottom: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
        boxShadow: 'none',
        position: 'relative',
        zIndex: 9999,
        boxSizing: 'border-box',
        width: '100%',
        gap: '6px',
      }}>
        {/* ── LEFT: Menu + Brand ── */}
        <div className="chat-header-left" style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0, flexShrink:0 }}>
          <button
            onClick={() => setIsSidebarOpen(v => !v)}
            title="Chats"
            className="hdr-menu-btn"
            style={{
              width:'34px', height:'34px', borderRadius:'9px', flexShrink:0,
              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
              color:'#ffffff', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center',
            }}
          >
            <Menu size={18} />
          </button>

          {/* Brand icon always visible */}
          <BrandLogo size={32} />

          {/* Brand text — hidden on mobile via CSS */}
          <div className="hdr-brand-name" style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:'#ffffff', whiteSpace:'nowrap' }}>
              Bhavya's AI Assistant
            </div>
          </div>

          
        </div>

        {/* ── RIGHT: Actions ── */}
        <div className="chat-header-right" style={{ display:'flex', alignItems:'center', gap:'5px', flexShrink:0 }}>



          {/* New Chat — icon+text on desktop, icon-only on mobile */}
          



          {/* Model selector — admin only */}
          {isAdmin && <div ref={modelDropRef} className="hdr-model-wrap" style={{ position:'relative', flexShrink: 0 }}>
            <button
              onClick={() => setModelDropOpen(v => !v)}
              style={{
                display:'flex', alignItems:'center', gap:'4px',
                padding:'6px 8px', borderRadius:'9px',
                background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
                color:'#ffffff', fontSize:'11px', fontWeight:600, cursor:'pointer',
                maxWidth: window.innerWidth <= 640 ? '100px' : '180px',
              }}
            >
              <Zap size={11} style={{ color:'#ffffff', flexShrink:0 }} />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {selectedModel && typeof selectedModel === 'string' ? selectedModel.split('/').pop().split(':')[0] : 'Model'}
              </span>
              <ChevronDown size={11} style={{ color:'#a1a1aa', flexShrink:0, transform: modelDropOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
            </button>

            {modelDropOpen && (() => {
              const isMobile = window.innerWidth <= 640;
              const bestFlashLite = getBestModelForTier('flash-lite', allModels);
              const bestFlash = getBestModelForTier('flash', allModels);
              const bestPro = getBestModelForTier('pro', allModels);

              const isFlashLiteActive = selectedModel === bestFlashLite;
              const isFlashActive = selectedModel === bestFlash;
              const isProActive = selectedModel === bestPro;

              const filteredModels = allModels.filter(m => 
                m && typeof m === 'string' && m.toLowerCase().includes((modelSearch || '').toLowerCase())
              );

              const grouped = groupModelsByProvider(
                filteredModels, 
                GEMINI_MODELS, 
                GROQ_MODELS, 
                OPENROUTER_MODELS,
                COHERE_MODELS,
                MISTRAL_MODELS,
                SAMBANOVA_MODELS,
                HUGGINGFACE_MODELS,
                NVIDIA_MODELS,
                ZENMUX_MODELS,
                ANTHROPIC_MODELS,
                OPENAI_MODELS,
                CEREBRAS_MODELS,
                META_MODELS,
                MICROSOFT_MODELS
              );

              const dropdownElement = (
                <div 
                  data-model-dropdown="true"
                  className={isMobile ? "model-dropdown-mobile-scroll" : ""}
                  style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    top: isMobile ? 'calc(max(env(safe-area-inset-top, 0px), 38px) + 54px)' : 'calc(100% + 6px)',
                    left: isMobile ? '8px' : 'auto',
                    right: isMobile ? '8px' : 0,
                    width: isMobile ? 'calc(100vw - 16px)' : '460px',
                    background: isLightMode ? '#ffffff' : 'rgba(14,15,28,0.99)',
                    border: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(124,58,237,0.35)',
                    borderRadius: '14px',
                    padding: '14px',
                    zIndex: 99999,
                    boxShadow: isLightMode ? '0 16px 48px rgba(0,0,0,0.1)' : '0 16px 48px rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: isMobile ? 'calc(82vh - 60px)' : '75vh',
                    overflowY: 'auto',
                  }}
                >
                  {/* --- SECTION A: 3 PRIMARY COLUMNS (GEMINI STYLE) --- */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : 'repeat(3, 1fr)',
                    gap: '10px'
                  }}>
                    {/* Column 1: Fast */}
                    <button
                      onClick={() => {
                        if (bestFlashLite) {
                          setSelectedModel(bestFlashLite);
                          setModelDropOpen(false);
                        }
                      }}
                      style={{
                        background: isFlashLiteActive 
                          ? 'rgba(255,255,255,0.12)' 
                          : isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: isFlashLiteActive 
                          ? '2px solid #ffffff' 
                          : isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '12px 10px',
                        textAlign: 'left',
                        cursor: bestFlashLite ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '13px', color: isLightMode ? '#000000' : '#fff' }}>
                        <span style={{ fontSize: '15px' }}>⚡</span>
                        <span>Fast</span>
                      </div>
                      <div style={{ fontSize: '10px', color: isLightMode ? '#52525b' : '#a1a1aa', lineHeight: 1.3 }}>
                        Instant answers. Best for quick everyday questions.
                      </div>
                      {bestFlashLite && typeof bestFlashLite === 'string' && (
                        <div style={{ fontSize: '9px', color: isLightMode ? '#000000' : '#ffffff', marginTop: '4px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                          ↳ {bestFlashLite.split('/').pop().split(':')[0]}
                        </div>
                      )}
                    </button>

                    {/* Column 2: Balanced */}
                    <button
                      onClick={() => {
                        if (bestFlash) {
                          setSelectedModel(bestFlash);
                          setModelDropOpen(false);
                        }
                      }}
                      style={{
                        background: isFlashActive 
                          ? 'rgba(255,255,255,0.12)' 
                          : isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: isFlashActive 
                          ? '2px solid #ffffff' 
                          : isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '12px 10px',
                        textAlign: 'left',
                        cursor: bestFlash ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '13px', color: isLightMode ? '#000000' : '#fff' }}>
                        <span style={{ fontSize: '15px' }}>⚖️</span>
                        <span>Balanced</span>
                      </div>
                      <div style={{ fontSize: '10px', color: isLightMode ? '#52525b' : '#a1a1aa', lineHeight: 1.3 }}>
                        All-around help. Perfect balance of speed and depth.
                      </div>
                      {bestFlash && typeof bestFlash === 'string' && (
                        <div style={{ fontSize: '9px', color: isLightMode ? '#000000' : '#ffffff', marginTop: '4px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                          ↳ {bestFlash.split('/').pop().split(':')[0]}
                        </div>
                      )}
                    </button>

                    {/* Column 3: Deep Thinking */}
                    <button
                      onClick={() => {
                        if (bestPro) {
                          setSelectedModel(bestPro);
                          setModelDropOpen(false);
                        }
                      }}
                      style={{
                        background: isProActive 
                          ? 'rgba(255,255,255,0.12)' 
                          : isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: isProActive 
                          ? '2px solid #ffffff' 
                          : isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '12px 10px',
                        textAlign: 'left',
                        cursor: bestPro ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '13px', color: isLightMode ? '#000000' : '#fff' }}>
                        <span style={{ fontSize: '15px' }}>🧠</span>
                        <span>Deep Thinking</span>
                      </div>
                      <div style={{ fontSize: '10px', color: isLightMode ? '#52525b' : '#a1a1aa', lineHeight: 1.3 }}>
                        Complex reasoning, math proofs, and long code.
                      </div>
                      {bestPro && typeof bestPro === 'string' && (
                        <div style={{ fontSize: '9px', color: isLightMode ? '#000000' : '#ffffff', marginTop: '4px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                          ↳ {bestPro.split('/').pop().split(':')[0]}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)', margin: '12px 0 10px' }} />

                  {/* --- SECTION B: SEARCH + FULL PROVIDER-GROUPED MODEL LIST --- */}
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="🔍 Search models..."
                    value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: isLightMode ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.1)',
                      background: isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                      color: isLightMode ? '#000000' : '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '8px',
                    }}
                  />

                  {/* Provider groups */}
                  {Object.entries(grouped).map(([providerKey, providerData]) => {
                    if (!providerData.items || providerData.items.length === 0) return null;
                    return (
                      <div key={providerKey} style={{ marginBottom: '10px' }}>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: isLightMode ? '#52525b' : '#a1a1aa',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                          paddingLeft: '2px',
                        }}>
                          {providerData.title}
                        </div>
                        {providerData.items.map(model => {
                          const isActive = selectedModel === model;
                          const shortName = model.split('/').pop().split(':')[0];
                          return (
                            <button
                              key={model}
                              onClick={() => { setSelectedModel(model); setModelDropOpen(false); setModelSearch(''); }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 10px',
                                borderRadius: '7px',
                                border: isActive
                                  ? '1px solid rgba(255,255,255,0.4)'
                                  : '1px solid transparent',
                                background: isActive
                                  ? 'rgba(255,255,255,0.12)'
                                  : 'transparent',
                                color: isActive
                                  ? (isLightMode ? '#000000' : '#ffffff')
                                  : (isLightMode ? '#27272a' : '#d4d4d8'),
                                fontSize: '12px',
                                fontWeight: isActive ? 700 : 400,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.12s ease',
                                marginBottom: '2px',
                              }}
                              onMouseEnter={e => {
                                if (!isActive) {
                                  e.currentTarget.style.background = isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              {isActive && <span style={{ color: '#ffffff', fontSize: '10px' }}>✓</span>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  </div>
              );
              return isMobile ? createPortal(dropdownElement, document.body) : dropdownElement;
            })()}
          </div>}

          {/* Quick 1-Tap Practical Mode Toggle (Code vs Chat) */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '2px', gap: '2px', flexShrink: 0 }}>
            <button
              onClick={() => {
                setActiveSpecialist('code-reviewer');
                safeStorageSet('bhavya_ai_specialist_assistant', 'code-reviewer');
              }}
              title="Coding Mode: Bug fixes & green code diffs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '16px',
                background: activeSpecialist === 'code-reviewer' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                border: activeSpecialist === 'code-reviewer' ? '1px solid #22c55e' : '1px solid transparent',
                color: activeSpecialist === 'code-reviewer' ? '#4ade80' : '#a1a1aa',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🔬</span>
              <span>Code</span>
            </button>
            <button
              onClick={() => {
                setActiveSpecialist('general');
                safeStorageSet('bhavya_ai_specialist_assistant', 'general');
              }}
              title="Study & Chat Mode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '16px',
                background: activeSpecialist !== 'code-reviewer' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: activeSpecialist !== 'code-reviewer' ? '1px solid #38bdf8' : '1px solid transparent',
                color: activeSpecialist !== 'code-reviewer' ? '#38bdf8' : '#a1a1aa',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🎓</span>
              <span>Chat</span>
            </button>
            <button
              onClick={() => setShowSpecialistModal(true)}
              title="More Specialists Roster..."
              style={{
                padding: '4px 6px',
                borderRadius: '16px',
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ⚙️
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
            className="hdr-icon-btn"
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#a1a1aa', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Settings size={16} />
          </button>

          {/* Optional Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout / Switch Operator"
              className="hdr-icon-btn hdr-logout-btn hdr-desktop-only"
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#a1a1aa', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>



      {/* Main scrollable area */}
      <main ref={scrollContainerRef} className="ci-main" style={{ flex:1, overflowY:'auto', overflowX:'hidden', width:'100%', maxWidth:'100%', padding:'28px 16px 16px', display:'flex', flexDirection:'column', position:'relative', zIndex:1, boxSizing:'border-box' }}>
        <div className="ci-thread" style={{ width:'100%', maxWidth:'800px', minWidth:0, boxSizing:'border-box' }}>

          {/* Empty State / Welcome Hero (Pure Unboxed ChatGPT Parity) */}
          {messages.length === 0 && (
            <div className="ci-empty-hero" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
              padding: '40px 16px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 600,
                color: isLightMode ? '#000000' : '#ffffff',
                marginBottom: '10px',
                letterSpacing: '-0.025em',
                textAlign: 'center'
              }}>
                What can I help with today?
              </h2>
              <p style={{
                fontSize: '14px',
                color: isLightMode ? '#71717a' : '#a1a1aa',
                maxWidth: '520px',
                margin: 0,
                lineHeight: 1.5,
                textAlign: 'center'
              }}>
                {currentSpecialist.name} · Complete AI study, code & exam workstation for engineering students.
              </p>

              {/* College Study & Code Quick Launchers */}
              <div style={{
                marginTop: '28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                maxWidth: '880px',
                width: '100%',
                padding: '0 8px'
              }}>
                <button
                  onClick={() => setShowCollegeNotesModal(true)}
                  style={{
                    background: isLightMode ? '#ffffff' : '#141416',
                    border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isLightMode ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isLightMode ? '#e4e4e7' : '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📚</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isLightMode ? '#000' : '#fff' }}>College Notes Hub</span>
                  </div>
                  <span style={{ fontSize: '11px', color: isLightMode ? '#71717a' : '#a1a1aa', lineHeight: 1.4 }}>
                    40+ curated engineering notes, PDF summaries & lab manuals.
                  </span>
                </button>

                <button
                  onClick={() => handleSend('Provide a comprehensive 15-minute exam revision sheet for Data Structures and Algorithms with key formulas, tree traversal orders, and time complexities.')}
                  style={{
                    background: isLightMode ? '#ffffff' : '#141416',
                    border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isLightMode ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#eab308'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isLightMode ? '#e4e4e7' : '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚡</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isLightMode ? '#000' : '#fff' }}>15-Min Exam Cram</span>
                  </div>
                  <span style={{ fontSize: '11px', color: isLightMode ? '#71717a' : '#a1a1aa', lineHeight: 1.4 }}>
                    High-yield revision cheat sheets for upcoming semester exams.
                  </span>
                </button>

                <button
                  onClick={() => handleSend('Generate the top 10 most frequently asked semester exam & viva questions in Operating Systems with concise, step-by-step solutions.')}
                  style={{
                    background: isLightMode ? '#ffffff' : '#141416',
                    border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isLightMode ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isLightMode ? '#e4e4e7' : '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🎯</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isLightMode ? '#000' : '#fff' }}>Top 10 PYQs & Viva</span>
                  </div>
                  <span style={{ fontSize: '11px', color: isLightMode ? '#71717a' : '#a1a1aa', lineHeight: 1.4 }}>
                    Most repeated university exam questions solved cleanly.
                  </span>
                </button>

                <button
                  onClick={() => {
                    setInputText('Here is my lab assignment code to review and fix:\n```cpp\n// Paste your lab code here\n```');
                  }}
                  style={{
                    background: isLightMode ? '#ffffff' : '#141416',
                    border: isLightMode ? '1px solid #e4e4e7' : '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isLightMode ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isLightMode ? '#e4e4e7' : '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>💻</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isLightMode ? '#000' : '#fff' }}>Lab Code Debugger</span>
                  </div>
                  <span style={{ fontSize: '11px', color: isLightMode ? '#71717a' : '#a1a1aa', lineHeight: 1.4 }}>
                    Paste broken assignment code → get green working code.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              index={i}
              total={messages.length}
              isGenerating={isGenerating}
              copiedId={copiedId}
              editingId={editingId}
              editText={editText}
              userAvatar={effectiveUserAvatar}
              onCopy={handleCopy}
              onExportPDF={handleExportPDF}
              onExportPPTX={handleExportPPTX}
              onExportDOCX={handleExportDOCX}
              onInspectDocSource={handleInspectDocSource}
              onRegenerate={handleRegenerate}
              onStartEdit={startEditing}
              onSaveEdit={saveEditedMessage}
              onCancelEdit={cancelEditing}
              onEditTextChange={setEditText}
              onCodeBlockClick={handleCodeBlockClick}
              onSwitchVersion={handleSwitchVersion}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ════════════════════
          INPUT BAR
      ════════════════════ */}
      <footer className="ci-footer">
        {/* Mobile Quick Feature Dock — 1-Tap Thumb Access on Mobile */}
        <div className="mobile-quick-dock">
          {/* 1. Chats / History */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="mobile-dock-btn"
            title="Chat History"
          >
            <MessageSquare size={13} style={{ color: '#d4d4d8' }} />
            <span>Chats</span>
          </button>

          {/* 2. New Chat */}
          <button
            type="button"
            onClick={handleNewChat}
            className="mobile-dock-btn"
            title="Start New Chat"
          >
            <Plus size={13} style={{ color: '#d4d4d8' }} />
            <span>New</span>
          </button>

          {/* 3. Specialist Switcher */}
          <button
            type="button"
            onClick={() => setShowSpecialistModal(true)}
            className="mobile-dock-btn"
            title={`Active: ${currentSpecialist.name}`}
            style={{
              borderColor: '#27272a',
              background: '#18181b',
              color: '#ffffff',
            }}
          >
            <span style={{ fontSize: '12px' }}>{currentSpecialist.icon}</span>
            <span className="mobile-dock-text">
              {currentSpecialist.shortName}
            </span>
          </button>

          {/* 4. Model Selector — admin only */}
          {isAdmin && (
          <button
            type="button"
            onClick={() => setModelDropOpen(v => !v)}
            className="mobile-dock-btn"
            title="Choose Model"
          >
            <Zap size={13} style={{ color: '#d4d4d8' }} />
            <span className="mobile-dock-text">
              {selectedModel && typeof selectedModel === 'string' ? selectedModel.split('/').pop().split(':')[0] : 'Model'}
            </span>
          </button>
          )}

          {/* 5. Settings */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="mobile-dock-btn"
            title="Settings & API Keys"
          >
            <Settings size={13} style={{ color: '#d4d4d8' }} />
            <span>Settings</span>
          </button>
        </div>

        <div className="ci-input-shell" onPaste={handlePaste}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="input-side-btn"
            title="Attach file"
          >
            <Plus size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.zip,.pdf,.txt,.js,.jsx,.ts,.tsx,.py,.cpp,.c,.hpp,.h,.java,.json,.md,.html,.css,.csv"
            multiple
            style={{ display: 'none' }}
          />



          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
            {(attachedImages.length > 0 || attachedFiles.length > 0) && (
              <div className="image-preview-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 0', alignItems: 'center' }}>
                {attachedImages.map((img, i) => (
                  <div key={`img-${i}`} style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={img} alt={`Preview ${i + 1}`} className="image-preview-thumb" />
                    <button
                      onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="image-preview-close"
                      title="Remove image"
                      style={{ position: 'absolute', top: '-4px', right: '-4px' }}
                    >✕</button>
                  </div>
                ))}
                {attachedFiles.map((file, i) => (
                  <div key={`file-${i}`} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', color: '#f4f4f5' }}>
                    <span>📄 {file.name}</span>
                    <button
                      onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }}
                      title="Remove file"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message your assistant…"
              className="ci-textarea"
            />
          </div>

          
          {/* Web Speech API Voice Input Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`send-pill ${isListening ? 'send-pill--listening' : ''}`}
            style={{
              background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
              color: isListening ? '#ffffff' : '#94a3b8',
              border: isListening ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
              marginRight: '6px'
            }}
            title={isListening ? "Listening... click to stop" : "Voice input (Speech to text)"}
          >
            <Mic size={16} className={isListening ? "animate-pulse" : ""} />
          </button>

          {/* Autonomous AI Agent Handoff Button */}
          {inputText.trim() && (
            <button
              type="button"
              onClick={() => {
                window.open('https://bhavyas-ai-agent.vercel.app?mission=' + encodeURIComponent(inputText.trim()), '_blank');
              }}
              className="send-pill"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                marginRight: '6px',
                fontSize: '11px',
                padding: '0 8px',
                gap: '4px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="Send to Bhavya's AI Agent for autonomous research & multi-step planning"
            >
              <span>Agent ↗</span>
            </button>
          )}

          {isGenerating ? (
            <button
              onClick={handleStop}
              className="send-pill send-pill--active"
              style={{ background: '#ffffff', border: '1px solid #ffffff', color: '#000000' }}
              title="Stop response"
            >
              <div style={{ width: '9px', height: '9px', background: 'currentColor', borderRadius: '1.5px' }} />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={(!inputText.trim() && !attachedImages.length) || isGenerating}
              className={`send-pill ${(inputText.trim() || attachedImages.length) && !isGenerating ? 'send-pill--active' : ''}`}
              title="Send"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </footer>

      {/* ════════════════════
          SIDEBAR
      ════════════════════ */}
      <PerformanceSidebar
        isOpen={isSidebarOpen}
        onClose={() => closeSidebar(0)}
        chats={chats}
        activeChatId={resolvedActiveChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isLightMode={isLightMode}
        isAdmin={isAdmin}
        onOpenInspector={() => setShowAdminInspectorModal(true)}
      />

      {/* ════════════════════
          SETTINGS MODAL
      ════════════════════ */}
      {showSettingsModal && (
        <div className="modal-veil" onClick={() => setShowSettingsModal(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()} style={{ border: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid #27272a', boxShadow: '0 16px 48px rgba(0,0,0,0.85)', background: isLightMode ? '#ffffff' : '#000000', maxWidth: '780px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div className="info-modal__header">
              <h2 className="info-modal__title">⚙️ API Settings</h2>
              <button className="info-modal__close" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="info-modal__body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Configure your API keys to unlock cloud models. Keys are saved locally in your browser's storage and never sent to any third party. A <span style={{ color: '#ffffff', fontWeight: 700 }}>● dot</span> means the key is active.
              </p>

              {/* 2-column grid of provider cards */}
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Gemini', icon: '♊', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'AIzaSy...', value: geminiKey, set: setGeminiKey, store: 'api_gemini', desc: 'Powers Gemini 2.5 Flash/Pro & Gemma models' },
                  { label: 'Groq', icon: '⚡', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'gsk_...', value: groqKey, set: setGroqKey, store: 'api_groq', desc: 'Blazing-fast Llama 4, Qwen3 & more' },
                  { label: 'NVIDIA NIM', icon: '🟩', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'nvapi-...', value: nvidiaKey, set: setNvidiaKey, store: 'api_nvidia', desc: 'Nemotron, DeepSeek, DiffusionGemma & more' },
                  { label: 'ZenMux', icon: '✖️', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'sk-ai-v1-...', value: zenmuxKey, set: setZenmuxKey, store: 'api_zenmux', desc: 'Grok 4.5 and X.AI models' },
                  { label: 'OpenRouter', icon: '🌐', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'sk-or-v1-...', value: openRouterKey, set: setOpenRouterKey, store: 'api_openrouter', desc: 'Claude, GPT-4o, DeepSeek R1 & 200+ models' },
                  { label: 'Cohere', icon: '🌀', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'Insert key...', value: cohereKey, set: setCohereKey, store: 'api_cohere', desc: 'Command A+, Command R+, Aya Expanse' },
                  { label: 'Anthropic', icon: '🔮', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'sk-ant-api03-...', value: anthropicKey, set: setAnthropicKey, store: 'api_anthropic', desc: 'Claude Opus, Sonnet & Haiku — direct API' },
                  { label: 'OpenAI', icon: '🟢', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'sk-proj-...', value: openaiKey, set: setOpenaiKey, store: 'api_openai', desc: 'Direct GPT-4o, o1, o3-mini & more' },
                  { label: 'Mistral AI', icon: '🛡️', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'Insert key...', value: mistralKey, set: setMistralKey, store: 'api_mistral', desc: 'Mistral Large, Codestral, Pixtral' },
                  { label: 'SambaNova', icon: '🧠', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'Insert key...', value: sambaNovaKey, set: setSambaNovaKey, store: 'api_sambanova', desc: 'Llama 3.1 405B & 70B at ultra speed' },
                  { label: 'Cerebras AI', icon: '🧠', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'csk-...', value: cerebrasKey, set: setCerebrasKey, store: 'api_cerebras', desc: 'Ultra-fast Llama 3.3 70B & 3.1 8B wafer scale engine' },
                  { label: 'Hugging Face', icon: '🤗', color: isLightMode ? '#000000' : '#ffffff', bg: isLightMode ? '#f4f4f5' : '#121214', border: isLightMode ? '#e4e4e7' : '#27272a', placeholder: 'hf_...', value: huggingFaceKey, set: setHuggingFaceKey, store: 'api_huggingface', desc: 'Open-source models via Inference API' },
                ].map((p) => (
                  <div key={p.store} style={{
                    background: p.bg,
                    border: `1px solid ${p.border}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {/* Provider header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ fontSize: '15px' }}>{p.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: p.color }}>{p.label}</span>
                      </div>
                      {/* Live status dot */}
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: p.value ? '#ffffff' : 'rgba(255,255,255,0.15)',
                        boxShadow: p.value ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
                        flexShrink: 0
                      }} title={p.value ? 'Key active' : 'No key set'} />
                    </div>
                    {/* Description */}
                    <p style={{ fontSize: '10.5px', color: '#71717a', margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
                    {/* Input */}
                    <input
                      type="password"
                      value={p.value}
                      onChange={e => {
                        p.set(e.target.value);
                        
                      }}
                      placeholder={p.placeholder}
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: `1px solid ${p.value ? p.color + '55' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: '8px',
                        padding: '7px 10px',
                        color: '#fff',
                        fontSize: '12px',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                ))}
              </div>

              
              {/* Theme Settings Selector */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎨 Application Theme
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {THEMES.map(th => {
                    const isActive = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => onThemeChange(th.id)}
                        style={{
                          flex: '1 1 120px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isActive ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.04)',
                          border: isActive ? '1px solid #fff' : '1px solid rgba(255,255,255,0.08)',
                          color: isActive ? '#fff' : '#a1a1aa',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: isActive ? '0 0 12px var(--primary-glow)' : 'none',
                        }}
                      >
                        {th.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📁 Multi-Document Upload & Knowledge Base */}
              <div style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📁 MULTI-DOCUMENT KNOWLEDGE BASE ({uploadedDocs.length})</span>
                    {!isGuestMode && username && username !== 'Guest Operator' && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        color: '#ffffff',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {docsSyncStatus === 'syncing' ? '🔄 Syncing...' : (docsSyncStatus === 'synced' ? '☁️ Cloud Synced' : '⚠️ Offline')}
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleRefreshCloudDocuments}
                      disabled={isDocRefreshing}
                      title="Sync and fetch latest documents from cloud without reloading the webpage"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        color: '#ffffff',
                        fontSize: '11px',
                        cursor: isDocRefreshing ? 'wait' : 'pointer',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <RefreshCw size={12} className={isDocRefreshing ? 'animate-spin' : ''} />
                      <span>{isDocRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                    {uploadedDocs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllDocuments}
                        style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Clear All ({uploadedDocs.length})
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  Upload documents or full projects as ZIP archives. The AI Assistant automatically unpacks, reads, and queries across all files.
                </p>

                {/* Supported Format Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    📦 .ZIP Archives
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#e4e4e7', fontWeight: 500 }}>
                    📄 PDF & Word (.docx)
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#e4e4e7', fontWeight: 500 }}>
                    📊 Excel & CSV
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#e4e4e7', fontWeight: 500 }}>
                    💻 VS Code & Text (.js, .py, .html...)
                  </span>
                </div>

                {/* Drag & Drop File Upload Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDocDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDocDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDocDragOver(false);
                    handleMultiDocUpload(e);
                  }}
                  style={{
                    border: isDocDragOver ? '2px dashed #ffffff' : '1.5px dashed rgba(255, 255, 255, 0.25)',
                    background: isDocDragOver ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    marginBottom: '12px'
                  }}
                >
                  <input
                    ref={multiDocInputRef}
                    type="file"
                    multiple
                    accept=".zip,application/zip,application/x-zip-compressed,.pdf,.doc,.docx,.xls,.xlsx,.csv,.tsv,.ppt,.pptx,.js,.jsx,.ts,.tsx,.py,.cpp,.c,.h,.cs,.java,.html,.css,.json,.xml,.sql,.sh,.md,.txt,.log,.yaml,.yml"
                    onChange={handleMultiDocUpload}
                    style={{ display: 'none' }}
                  />
                  <input
                    ref={zipDocInputRef}
                    type="file"
                    multiple
                    accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
                    onChange={handleMultiDocUpload}
                    style={{ display: 'none' }}
                  />

                  <div style={{ fontSize: '26px', marginBottom: '6px' }}>
                    {isUploadingDocs ? '⏳' : '📥'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    {isUploadingDocs ? uploadProgressText : 'Drag & Drop Documents or ZIP Archives Here'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '12px' }}>
                    Upload individual files or complete projects in .ZIP format — all source code and documents are automatically parsed.
                  </div>

                  {/* Explicit Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => multiDocInputRef.current && multiDocInputRef.current.click()}
                      style={{
                        padding: '7px 15px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📁 Browse Documents
                    </button>

                    <button
                      type="button"
                      onClick={() => zipDocInputRef.current && zipDocInputRef.current.click()}
                      style={{
                        padding: '7px 15px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📦 Upload ZIP File
                    </button>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocs.length === 0 ? (
                  <div style={{ padding: '14px', textAlign: 'center', color: '#71717a', fontSize: '11px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    No documents uploaded yet. Upload files above to empower the AI with your knowledge!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                    {uploadedDocs.map(doc => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontSize: '11.5px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginRight: '10px' }}>
                          <span style={{ fontSize: '16px', flexShrink: 0 }}>{doc.icon}</span>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#ffffff', fontWeight: 600 }}>{doc.name}</span>
                            <span style={{ color: '#71717a', marginLeft: '6px', fontSize: '10px' }}>({doc.type} • {doc.sizeFormatted})</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }}
                            title={`Direct download ${doc.name}`}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ⬇️ Download
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewingDoc(doc); }}
                            title="Preview extracted content"
                            style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff', padding: '2px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '10.5px' }}
                          >
                            👁️ View
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                            title="Delete document"
                            style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '13px', padding: '2px 6px' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🧠 AI Long-Term Memory & User Profile */}
              <div style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧠 AI LONG-TERM MEMORY & SAVED TRAITS</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllUserMemory();
                      setThemeToast('🧠 AI Memory cleared successfully!');
                      setTimeout(() => setThemeToast(''), 3000);
                    }}
                    style={{
                      background: 'rgba(255, 68, 68, 0.12)',
                      border: '1px solid rgba(255, 68, 68, 0.3)',
                      color: '#ff6b6b',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    🗑️ Clear All Memory
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '8px', lineHeight: 1.4 }}>
                  Facts, preferences, and details the assistant has saved across your conversations. You can clear this anytime to start fresh.
                </div>
                {getStoredUserMemories().length === 0 ? (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717a', fontSize: '11px', fontStyle: 'italic' }}>
                    ✓ No saved traits or background memories stored. Clean slate!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {getStoredUserMemories().map((m, idx) => (
                      <div key={idx} style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e4e4e7',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div> {/* Close info-modal__body */}
            <button onClick={handleSaveSettings} className="info-modal__btn" style={{ background: 'var(--primary-gradient)', marginTop: '16px' }}>
              Save &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* ── Document Content Viewer Modal (Rendered on top of Settings Modal) ── */}
      {previewingDoc && (
        <div
          className="modal-veil doc-preview-veil"
          onClick={() => setPreviewingDoc(null)}
          style={{ zIndex: 2000005 }}
        >
          <div
            className="info-modal"
            onClick={e => e.stopPropagation()}
            style={{
              border: '1px solid rgba(6, 182, 212, 0.55)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.8), 0 0 32px rgba(6, 182, 212, 0.45)',
              maxWidth: '820px',
              width: '92%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 2000010
            }}
          >
            <div className="info-modal__header" style={{ marginBottom: '14px' }}>
              <h2 className="info-modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                <span style={{ fontSize: '20px' }}>{previewingDoc.icon || '📄'}</span>
                <span style={{ color: '#fff' }}>{previewingDoc.name}</span>
                <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 400 }}>
                  ({previewingDoc.type || 'Document'} • {previewingDoc.sizeFormatted || ''})
                </span>
              </h2>
              <button className="info-modal__close" onClick={() => setPreviewingDoc(null)}>✕</button>
            </div>
            <div className="info-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#ffffff', fontFamily: 'monospace' }}>
                  Extracted text: {(previewingDoc.content || '').length.toLocaleString()} characters
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDownloadDocument(previewingDoc)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ⬇️ Download {previewingDoc.ext === 'zip' ? 'ZIP Archive' : 'File'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewingDoc.content || '');
                      setThemeToast('📋 Copied text to clipboard!');
                      setTimeout(() => setThemeToast(''), 2500);
                    }}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    📋 Copy Text
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={previewingDoc.content || 'No text extracted.'}
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: '380px',
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              onClick={() => setPreviewingDoc(null)}
              className="info-modal__btn"
              style={{ background: '#ffffff', color: '#000000', marginTop: '14px', border: 'none' }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

      {/* 🚀 7 Flagship Advanced Feature Modals */}
      {isCanvasOpen && (
        <ArtifactCanvas
          content={canvasContent}
          language={canvasLang}
          isLightMode={isLightMode}
          onClose={() => setIsCanvasOpen(false)}
          onEditWithAI={handleCanvasAiEdit}
        />
      )}



      {/* 📂 Drag & Drop Fullscreen Upload Overlay (Desktop only) */}
      {isDraggingFile && window.innerWidth > 768 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '3px dashed #ffffff', margin: '16px', borderRadius: '24px',
          boxShadow: '0 0 50px rgba(255, 255, 255, 0.2)',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: '48px', marginBottom: '16px', animation: 'bounce 1s infinite'
          }}>📁</div>
          <h2 style={{ color: '#ffffff', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
            Drop Files to Upload
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0 }}>
            Supports code (.js, .py, .cpp, .html), PDFs, images, archives (.zip), and documents
          </p>
        </div>
      )}

      {/* ── Theme name toast ───────────────────────────────── */}
      {themeToast && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--primary-gradient)',
          color: '#fff', fontSize: 13, fontWeight: 700,
          padding: '8px 20px', borderRadius: 50,
          boxShadow: '0 4px 20px var(--primary-glow-strong)',
          zIndex: 99999, whiteSpace: 'nowrap',
          animation: 'toastSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          letterSpacing: '0.02em',
        }}>
          {themeToast}
        </div>
      )}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        /* ── High-Performance Unboxed Chat Stream (ChatGPT Parity) ── */
        .ci-main {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .ci-thread {
          width: 100% !important;
          max-width: 800px !important;
          min-width: 0 !important;
          margin-left: auto !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
        }
        .msg-row {
          display: flex !important;
          align-items: flex-start !important;
          gap: 16px !important;
          margin-bottom: 24px !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          will-change: auto !important;
        }
        .msg-row--user {
          flex-direction: row-reverse !important;
          justify-content: flex-start !important;
        }

        .avatar {
          flex: 0 0 auto !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .avatar--bot {
          background: #18181b !important;
          border: 1px solid #27272a !important;
          box-shadow: none !important;
          color: #ffffff !important;
        }
        .avatar--user {
          background: #27272a !important;
          border: 1px solid #3f3f46 !important;
          box-shadow: none !important;
          color: #ffffff !important;
        }

        .msg-col {
          display: flex !important;
          flex-direction: column !important;
          max-width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 0% !important;
          box-sizing: border-box !important;
        }
        .msg-row--user .msg-col {
          align-items: flex-end !important;
          max-width: 82% !important;
          min-width: 0 !important;
        }
        .msg-row--bot .msg-col {
          align-items: flex-start !important;
          max-width: 100% !important;
          width: 100% !important;
          min-width: 0 !important;
        }

        .msg-role-label {
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          color: #a1a1aa !important;
          margin-bottom: 6px !important;
          padding: 0 !important;
          display: block !important;
        }
        .msg-row--user .msg-role-label {
          color: #a1a1aa !important;
        }

        /* The Bubble: PURE UNBOXED STREAM (ZERO BOXES, NO OUTLINES, NO GLOWS) */
        .bubble {
          position: relative !important;
          padding: 0 !important;
          font-size: 15.5px !important;
          line-height: 1.68 !important;
          border-radius: 0 !important;
          border: none !important;
          background: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          overflow: visible !important;
          contain: none !important;
          animation: none !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }

        .ci-footer {
          background: transparent !important;
          border-top: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .input-side-btn {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid #27272a !important;
          color: #ffffff !important;
          transition: all 0.2s ease !important;
        }
        .input-side-btn:hover { 
          background: rgba(255,255,255,0.1) !important; 
          color: #ffffff !important; 
          box-shadow: none !important;
        }

        .send-pill {
          border: 1px solid #27272a !important;
          background: rgba(255,255,255,0.04) !important;
          color: #a1a1aa !important;
          opacity: 0.5 !important;
          transition: all 0.2s ease !important;
        }

        .send-pill--active {
          background: #ffffff !important;
          color: #000000 !important;
          opacity: 1 !important;
          cursor: pointer !important;
          box-shadow: none !important;
          border-color: #ffffff !important;
        }
        .send-pill--active:hover {
          transform: scale(1.04) !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        /* Light mode overrides */
        .light-mode .send-pill--active {
          background: #000000 !important;
          color: #ffffff !important;
          border-color: #000000 !important;
        }
        .light-mode .send-pill {
          background: rgba(0, 0, 0, 0.04) !important;
          color: #71717a !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
        }
        .light-mode .input-side-btn {
          background: rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          color: #000000 !important;
        }

        /* ── Markdown Table Styling (Clean, High-Contrast, Monochrome) ── */
        .md-table-wrapper {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin: 16px 0 !important;
          border-radius: 8px !important;
          border: 1px solid #27272a !important;
          background: rgba(255, 255, 255, 0.02) !important;
          box-sizing: border-box !important;
        }
        .md-table {
          width: 100% !important;
          max-width: 100% !important;
          border-collapse: collapse !important;
          font-size: 13px !important;
          text-align: left !important;
          table-layout: auto !important;
        }
        .md-table th {
          background: #18181b !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          padding: 10px 14px !important;
          border-bottom: 2px solid #27272a !important;
          white-space: nowrap !important;
        }
        .md-table td {
          padding: 9px 14px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          color: #e4e4e7 !important;
          line-height: 1.5 !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }
        .md-table tr:last-child td {
          border-bottom: none !important;
        }
        .md-table tr:hover td {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .light-mode .md-table-wrapper {
          border: 1px solid #e4e4e7 !important;
          background: #fafafa !important;
        }
        .light-mode .md-table th {
          background: #f4f4f5 !important;
          color: #000000 !important;
          border-bottom: 2px solid #e4e4e7 !important;
        }
        .light-mode .md-table td {
          border-bottom: 1px solid #e4e4e7 !important;
          color: #18181b !important;
        }

        /* Disable base CSS height overlay completely */
        .bubble::before,
        .bubble::after {
          display: none !important;
        }

        /* AI Assistant Response — Pure unboxed stream like ChatGPT */
        .bubble--bot {
          border-radius: 0 !important;
          border: none !important;
          background: transparent !important;
          background-image: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          animation: none !important;
          color: #f4f4f5 !important;
          font-size: 15.5px !important;
          line-height: 1.68 !important;
          width: 100% !important;
          padding: 0 !important;
        }

        /* User Question — Clean text like ChatGPT */
        .bubble--user {
          border-radius: 0 !important;
          border: none !important;
          background: transparent !important;
          background-image: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          animation: none !important;
          color: #ffffff !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          padding: 0 !important;
        }

        .light-mode .bubble--user {
          background: transparent !important;
          background-image: none !important;
          color: #000000 !important;
          box-shadow: none !important;
        }

        .light-mode .bubble--user .bubble-text,
        .light-mode .bubble--user .bubble-text p,
        .light-mode .bubble--user .bubble-text span,
        .light-mode .bubble--user .bubble-text div {
          color: #000000 !important;
        }

        .light-mode .bubble--bot {
          color: #000000 !important;
        }

        .bubble-text {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }

        .md-inline-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
          font-size: 0.88em !important;
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: pre-wrap !important;
        }

        /* High-Contrast Clean Monochrome Typography */
        .bubble-text h1, .bubble-text h2, .bubble-text h3, .bubble-text h4 {
          color: #ffffff !important;
          font-weight: 700 !important;
          margin-top: 1em !important;
          margin-bottom: 0.4em !important;
          line-height: 1.35 !important;
          text-shadow: none !important;
        }

        .light-mode .bubble-text h1,
        .light-mode .bubble-text h2,
        .light-mode .bubble-text h3,
        .light-mode .bubble-text h4 {
          color: #000000 !important;
        }

        .bubble-text strong {
          color: #ffffff !important;
          font-weight: 700 !important;
        }
        .light-mode .bubble-text strong {
          color: #000000 !important;
        }

        .bubble-text a {
          color: #ffffff !important;
          text-decoration: underline !important;
        }
        .light-mode .bubble-text a {
          color: #000000 !important;
        }

        .bubble-text p {
          margin-bottom: 0.85em !important;
          color: inherit !important;
        }

        .bubble-text p:last-child {
          margin-bottom: 0 !important;
        }

        .bubble-text ul, .bubble-text ol {
          margin-bottom: 0.85em !important;
          padding-left: 1.3em !important;
        }

        .bubble-text li {
          margin-bottom: 0.35em !important;
          line-height: 1.65 !important;
        }

        /* Action Tray Row */
        .action-tray {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          margin-top: 8px !important;
          padding: 0 !important;
          font-size: 11px !important;
          color: #a1a1aa !important;
          opacity: 0.75 !important;
          transition: opacity 0.2s ease !important;
          position: relative !important;
          z-index: 10 !important;
          pointer-events: auto !important;
        }
        .msg-row--user .action-tray {
          color: #a1a1aa !important;
        }
        .msg-row:hover .action-tray {
          opacity: 1 !important;
        }
        .tray-btn {
          cursor: pointer !important;
          position: relative !important;
        }

        /* Typing indicator */
        .thinking-dots {
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          padding: 10px 0 !important;
        }
        .thinking-dots span {
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          box-shadow: none !important;
          animation: bounce-dots 1.2s ease-in-out infinite !important;
        }
        .thinking-dots span:nth-child(2) { animation-delay: 0.15s !important; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.3s !important; }
        
        @keyframes bounce-dots {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        /* Voice Typing Mic pulse effect */
        .mic-pulsing-glow {
          position: absolute !important;
          inset: 0 !important;
          border-radius: 50% !important;
          border: 2px solid #ffffff !important;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5) !important;
          animation: mic-pulse 1.5s infinite ease-out !important;
          pointer-events: none !important;
        }

        @keyframes mic-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .input-mic-btn--listening {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: #ffffff !important;
          color: #ffffff !important;
          animation: mic-button-pulse 1.5s infinite ease-in-out !important;
        }

        @keyframes mic-button-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>

      {/* 📌 Interactive Document Citations - Jump to Source Drawer Modal */}
      {inspectedDocExcerpt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#000000',
            border: '1px solid #27272a',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #27272a',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📌</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>
                    {inspectedDocExcerpt.fileName}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                    {inspectedDocExcerpt.type} • {inspectedDocExcerpt.size || 'Verified Context'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedDocExcerpt(null)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid #27272a',
                borderRadius: '10px',
                padding: '14px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#d4d4d8',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {inspectedDocExcerpt.excerpt}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid #27272a',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inspectedDocExcerpt.excerpt);
                    setThemeToast('📋 Excerpt copied to clipboard!');
                    setTimeout(() => setThemeToast(''), 3000);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Copy Excerpt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://bhavyas-documind.vercel.app', '_blank');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Open Bhavya's AI DocuMind for full multi-document vector exploration"
                >
                  📄 Open in DocuMind
                </button>
              </div>
              <button
                type="button"
                onClick={() => setInspectedDocExcerpt(null)}
                style={{
                  background: '#ffffff',
                  border: 'none',
                  color: '#000000',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specialist Assistant Switcher Modal */}
      <SpecialistSwitchModal
        isOpen={showSpecialistModal}
        onClose={() => setShowSpecialistModal(false)}
        activeSpecialist={activeSpecialist}
        onSelectSpecialist={(newSpecId) => {
          setActiveSpecialist(newSpecId);
          safeStorageSet('bhavya_ai_specialist_assistant', newSpecId);
        }}
      />

      {/* College Notes & Exam Hub Modal */}
      <CollegeNotesHubModal
        isOpen={showCollegeNotesModal}
        onClose={() => setShowCollegeNotesModal(false)}
        onSendPrompt={(promptText) => handleSend(promptText)}
        isLightMode={isLightMode}
      />

      {/* Classmate Feedback & Share Modal */}
      <StudentFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        isLightMode={isLightMode}
      />

      {/* Super Admin User Chats Inspector Modal */}
      {isAdmin && (
        <AdminInspectorModal
          isOpen={showAdminInspectorModal}
          onClose={() => setShowAdminInspectorModal(false)}
          isLightMode={isLightMode}
        />
      )}
    </div>
  );
}
