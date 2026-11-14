const fs = require('fs');

const content = fs.readFileSync('./src/components/ChatInterface.jsx', 'utf8');
const lines = content.split('\n');

console.log('=== HEADER LINES ===');
lines.forEach((line, idx) => {
  if (line.includes('<header') || line.includes('header-right') || line.includes('header-actions') || line.includes('top-right')) {
    console.log(`${idx+1}: ${line.trim().slice(0, 100)}`);
  }
});

console.log('=== FLOATING / FIXED ELEMENTS ===');
lines.forEach((line, idx) => {
  if (/position:\s*['"]fixed['"]|position:\s*['"]absolute['"]/.test(line)) {
    if (/right:\s*['"]?[0-9]|bottom:\s*['"]?[0-9]/.test(line)) {
      console.log(`${idx+1}: ${line.trim().slice(0, 100)}`);
    }
  }
});
