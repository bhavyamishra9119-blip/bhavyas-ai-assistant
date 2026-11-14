import fs from 'fs';

async function testVercelProxy(provider, path, body) {
  const url = `https://bhavyas-ai-assistant.vercel.app/api/${provider}${path}`;
  console.log(`\n=== Testing ${provider} (${url}) ===`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_key'
      },
      body: JSON.stringify(body)
    });
    console.log(`HTTP Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response snippet: ${text.substring(0, 200)}`);
  } catch (err) {
    console.error(`Fetch error:`, err);
  }
}

async function run() {
  await testVercelProxy('groq', '/openai/v1/chat/completions', {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'hi' }]
  });
  await testVercelProxy('mistral', '/v1/chat/completions', {
    model: 'open-mistral-7b',
    messages: [{ role: 'user', content: 'hi' }]
  });
  await testVercelProxy('nvidia', '/chat/completions', {
    model: 'meta/llama-3.1-8b-instruct',
    messages: [{ role: 'user', content: 'hi' }]
  });
  await testVercelProxy('cohere', '/v2/chat', {
    model: 'command-r-plus-08-2024',
    messages: [{ role: 'user', content: 'hi' }]
  });
}

run();
