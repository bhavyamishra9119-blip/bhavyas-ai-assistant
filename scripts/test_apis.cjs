const keys = require('../keys.json');

async function testOthers() {
  // Test Mistral
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.mistralKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });
    console.log('Mistral status:', res.status);
    const text = await res.text();
    console.log('Mistral sample:', text.slice(0, 100));
  } catch (e) {
    console.log('Mistral error:', e.message);
  }

  // Test Cohere
  try {
    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.cohereKey}`
      },
      body: JSON.stringify({
        model: 'command-r-plus-08-2024',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });
    console.log('Cohere status:', res.status);
    const text = await res.text();
    console.log('Cohere sample:', text.slice(0, 100));
  } catch (e) {
    console.log('Cohere error:', e.message);
  }
}
testOthers();
