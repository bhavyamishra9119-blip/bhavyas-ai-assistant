
// ══════════════════════════════════════════════════════════════════
// 🚫 EDGE RATE LIMITER & DENIAL-OF-WALLET SHIELD
// ══════════════════════════════════════════════════════════════════
const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const IP_MAX_REQUESTS_PER_WINDOW = 80;     // 80 req / min max
const ipHits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, resetAt: now + IP_RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + IP_RATE_LIMIT_WINDOW_MS;
  } else {
    entry.count++;
  }

  ipHits.set(ip, entry);
  return entry.count <= IP_MAX_REQUESTS_PER_WINDOW;
}

const keys = {
  geminiKey: process.env.GEMINI_API_KEY || "",
  groqKey: process.env.GROQ_API_KEY || "",
  openRouterKey: process.env.OPENROUTER_API_KEY || "",
  cohereKey: process.env.COHERE_API_KEY || "",
  huggingFaceKey: process.env.HUGGINGFACE_API_KEY || "",
  mistralKey: process.env.MISTRAL_API_KEY || "",
  sambaNovaKey: process.env.SAMBANOVA_API_KEY || "",
  zenMuxKey: process.env.ZENMUX_API_KEY || "",
  nvidiaKey: process.env.NVIDIA_API_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  openaiKey: process.env.OPENAI_API_KEY || "",
  cerebrasKey: process.env.CEREBRAS_API_KEY || ""
};

export const config = {
  runtime: 'edge'
};

const PROVIDER_TARGETS = {
  groq: { host: 'https://api.groq.com', prefix: '' },
  openrouter: { host: 'https://openrouter.ai', prefix: '' },
  cohere: { host: 'https://api.cohere.com', prefix: '' },
  mistral: { host: 'https://api.mistral.ai', prefix: '' },
  sambanova: { host: 'https://api.sambanova.ai', prefix: '' },
  huggingface: { host: 'https://router.huggingface.co', prefix: '' },
  zenmux: { host: 'https://zenmux.ai', prefix: '' },
  nvidia: { host: 'https://integrate.api.nvidia.com', prefix: '/v1' },
  anthropic: { host: 'https://api.anthropic.com', prefix: '' },
  openai: { host: 'https://api.openai.com', prefix: '/v1' },
  cerebras: { host: 'https://api.cerebras.ai', prefix: '' },
  gemini: { host: 'https://generativelanguage.googleapis.com', prefix: '' },
  tavily: { host: 'https://api.tavily.com', prefix: '' }
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version'
      }
    });
  }

  const url = new URL(req.url);

  // Extract provider & endpoint from searchParams (explicit Vercel rewrite) OR fallback to pathname parsing
  let provider = url.searchParams.get('provider')?.toLowerCase();
  let endpoint = url.searchParams.get('endpoint');

  if (!provider) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'api' && parts.length >= 2) {
      provider = parts[1].toLowerCase();
      endpoint = parts.slice(2).join('/');
    }
  }

  // 1. IP-Based Sliding Window Rate Limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ 
      error: 'Too Many Requests', 
      message: 'Rate limit exceeded (80 req/min). Denial-of-Wallet Shield active.' 
    }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    });
  }

  // 2. Origin Hardening for /api/keys
  if (provider === 'keys') {
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const isAllowedOrigin = !origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app');
    if (!isAllowedOrigin) {
      return new Response(JSON.stringify({ error: 'Unauthorized Access to Keys Endpoint' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Quick ping check
  if (provider === 'ping') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Preflight check
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (provider === 'keys') {
    const keysResponse = {
      geminiKey: process.env.GEMINI_API_KEY || keys.geminiKey,
      groqKey: process.env.GROQ_API_KEY || keys.groqKey,
      openRouterKey: process.env.OPENROUTER_API_KEY || keys.openRouterKey,
      cohereKey: process.env.COHERE_API_KEY || keys.cohereKey,
      huggingFaceKey: process.env.HUGGINGFACE_API_KEY || keys.huggingFaceKey,
      mistralKey: process.env.MISTRAL_API_KEY || keys.mistralKey,
      sambaNovaKey: process.env.SAMBANOVA_API_KEY || keys.sambaNovaKey,
      zenMuxKey: process.env.ZENMUX_API_KEY || keys.zenMuxKey,
      nvidiaKey: process.env.NVIDIA_API_KEY || keys.nvidiaKey,
      anthropicKey: process.env.ANTHROPIC_API_KEY || keys.anthropicKey,
      openaiKey: process.env.OPENAI_API_KEY || keys.openaiKey,
      cerebrasKey: process.env.CEREBRAS_API_KEY || keys.cerebrasKey
    };
    return new Response(JSON.stringify(keysResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (provider === 'search') {
    const q = url.searchParams.get('q') || '';
    if (!q) {
      return new Response(JSON.stringify({ AbstractText: '', RelatedTopics: [], results: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 1. Tavily AI Search (if key provided in query/headers or env)
    const tavilyKey = req.headers.get('x-tavily-key') || url.searchParams.get('tavilyKey') || process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: q,
            search_depth: 'basic',
            include_answer: true,
            max_results: 5
          })
        });
        if (tavilyRes.ok) {
          const tData = await tavilyRes.json();
          return new Response(JSON.stringify({
            provider: 'tavily',
            answer: tData.answer || '',
            results: (tData.results || []).map(r => ({
              title: r.title,
              url: r.url,
              snippet: r.content
            })),
            AbstractText: tData.answer || (tData.results && tData.results[0] ? tData.results[0].content : ''),
            RelatedTopics: []
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch (tErr) {
        console.warn('Tavily search proxy attempt failed, falling back to DuckDuckGo:', tErr);
      }
    }

    // 2. DuckDuckGo Instant Answer Fallback
    try {
      const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
      if (ddgRes.ok) {
        const data = await ddgRes.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (err) {
      console.warn("DDG search proxy error:", err);
    }
    return new Response(JSON.stringify({ AbstractText: '', RelatedTopics: [], results: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const targetConfig = PROVIDER_TARGETS[provider];
  if (!targetConfig) {
    return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const cleanEndpoint = (endpoint || '').replace(/^\/+/, '');
  const targetUrl = targetConfig.host + targetConfig.prefix + '/' + cleanEndpoint;

  const cleanHeaders = new Headers();
  const providerKeys = {
    groq: process.env.GROQ_API_KEY || keys.groqKey,
    openrouter: process.env.OPENROUTER_API_KEY || keys.openRouterKey,
    cohere: process.env.COHERE_API_KEY || keys.cohereKey,
    mistral: process.env.MISTRAL_API_KEY || keys.mistralKey,
    sambanova: process.env.SAMBANOVA_API_KEY || keys.sambaNovaKey,
    huggingface: process.env.HUGGINGFACE_API_KEY || keys.huggingFaceKey,
    zenmux: process.env.ZENMUX_API_KEY || keys.zenMuxKey,
    nvidia: process.env.NVIDIA_API_KEY || keys.nvidiaKey,
    anthropic: process.env.ANTHROPIC_API_KEY || keys.anthropicKey,
    openai: process.env.OPENAI_API_KEY || keys.openaiKey,
    gemini: process.env.GEMINI_API_KEY || keys.geminiKey,
    cerebras: process.env.CEREBRAS_API_KEY || keys.cerebrasKey,
    tavily: process.env.TAVILY_API_KEY || 'tvly-dev-key'
  };

  const clientAuth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.headers.get('x-api-key');
  const activeKey = (clientAuth && clientAuth.length > 15 && clientAuth !== 'test_key') ? clientAuth : providerKeys[provider];

  if (activeKey) {
    if (provider === 'anthropic') {
      cleanHeaders.set('x-api-key', activeKey);
    } else if (provider === 'gemini') {
      // Gemini passes key in query param or header
      cleanHeaders.set('x-goog-api-key', activeKey);
    } else {
      cleanHeaders.set('authorization', `Bearer ${activeKey}`);
    }
  }

  const contentType = req.headers.get('content-type');
  if (contentType) {
    cleanHeaders.set('content-type', contentType);
  }

  cleanHeaders.set('accept', 'application/json, text/event-stream');
  cleanHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  if (provider === 'anthropic') {
    cleanHeaders.set('anthropic-version', '2023-06-01');
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: cleanHeaders,
      signal: req.signal
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = req.body;
      fetchOptions.duplex = 'half';
    }

    const upstreamRes = await fetch(targetUrl, fetchOptions);

    const resHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection', 'keep-alive', 'set-cookie'].includes(k)) {
        resHeaders.set(key, val);
      }
    });

    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Instant SSE chunk pass-through: disable CDN/proxy streaming buffers to minimize TTFT
    resHeaders.set('Cache-Control', 'no-cache, no-transform');
    resHeaders.set('X-Accel-Buffering', 'no');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders
    });
  } catch (err) {
    console.error(`Edge proxy error for ${targetUrl}:`, err);
    return new Response(JSON.stringify({ error: 'Proxy Request Failed', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
