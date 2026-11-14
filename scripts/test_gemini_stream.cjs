const keys = require('../keys.json');

async function testStream() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${keys.geminiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Explain arrays in 2 sentences.' }] }]
    })
  });
  console.log('Stream status:', res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let acc = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(buffer)) !== null) {
      try {
        const textContent = JSON.parse(`"${match[1]}"`);
        acc += textContent;
      } catch (e) {
        console.log('JSON.parse error on chunk:', e);
      }
      lastIndex = regex.lastIndex;
    }
    buffer = buffer.slice(lastIndex);
  }
  console.log('Accumulated text length:', acc.length);
  console.log('Accumulated text sample:', acc);
}
testStream();
