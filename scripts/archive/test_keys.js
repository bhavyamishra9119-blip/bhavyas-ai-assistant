import fs from 'fs';

const keys = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));

async function testKey(name, url, headers, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log(`[${name}] Status: ${res.status} | Response: ${text.substring(0, 150)}`);
  } catch (err) {
    console.log(`[${name}] Error: ${err.message}`);
  }
}

async function main() {
  console.log("--- Testing API Keys ---");
  await testKey('Groq', 'https://api.groq.com/openai/v1/chat/completions', 
    { 'Authorization': `Bearer ${keys.groqKey}` },
    { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('OpenRouter', 'https://openrouter.ai/api/v1/chat/completions',
    { 'Authorization': `Bearer ${keys.openRouterKey}` },
    { model: 'google/gemma-2-9b-it:free', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('Cohere', 'https://api.cohere.com/v2/chat',
    { 'Authorization': `Bearer ${keys.cohereKey}` },
    { model: 'command-r-plus-08-2024', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('Mistral', 'https://api.mistral.ai/v1/chat/completions',
    { 'Authorization': `Bearer ${keys.mistralKey}` },
    { model: 'mistral-large-latest', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('SambaNova', 'https://api.sambanova.ai/v1/chat/completions',
    { 'Authorization': `Bearer ${keys.sambaNovaKey}` },
    { model: 'Meta-Llama-3.3-70B-Instruct', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('NVIDIA', 'https://integrate.api.nvidia.com/v1/chat/completions',
    { 'Authorization': `Bearer ${keys.nvidiaKey}` },
    { model: 'meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('ZenMux', 'https://zenmux.ai/api/v1/chat/completions',
    { 'Authorization': `Bearer ${keys.zenMuxKey}` },
    { model: 'x-ai/grok-4.5-free', messages: [{ role: 'user', content: 'hi' }] }
  );
  await testKey('Gemini', `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys.geminiKey}`,
    {},
    { contents: [{ parts: [{ text: 'hi' }] }] }
  );
}

main();
