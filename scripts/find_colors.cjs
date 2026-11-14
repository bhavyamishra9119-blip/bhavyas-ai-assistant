const fs = require('fs');
const path = require('path');

function hexToHsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length === 8) {
    hex = hex.substring(0, 6);
  }
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const target = process.argv[2];

if (target) {
  const content = fs.readFileSync(target, 'utf8');
  const lines = content.split('\n');
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;

  lines.forEach((line, idx) => {
    let match;
    while ((match = hexRegex.exec(line)) !== null) {
      const hsl = hexToHsl(match[0]);
      if (hsl && hsl.s > 8) { // Has visible color saturation!
        console.log(`L${idx + 1}: ${match[0]} (S:${hsl.s}%, H:${hsl.h}°) -> ${line.trim().substring(0, 100)}`);
      }
    }
  });
} else {
  // Scan all src files
  function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(full));
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
        results.push(full);
      }
    });
    return results;
  }

  const files = getFiles('./src');
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  const summary = {};

  files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const rel = path.relative('.', f);
    let match;
    while ((match = hexRegex.exec(content)) !== null) {
      const hsl = hexToHsl(match[0]);
      if (hsl && hsl.s > 8) {
        summary[rel] = (summary[rel] || 0) + 1;
      }
    }
  });

  console.log('Files with colored hexes (saturation > 8%):');
  console.log(JSON.stringify(summary, null, 2));
}
