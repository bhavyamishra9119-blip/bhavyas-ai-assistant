const fs = require('fs');

// 1. SpecialistSwitchModal.jsx
if (fs.existsSync('src/components/SpecialistSwitchModal.jsx')) {
  let f = fs.readFileSync('src/components/SpecialistSwitchModal.jsx', 'utf8');
  f = f.replace(/#09090b/g, '#000000');
  f = f.replace(/#f8fafc/g, '#ffffff');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  f = f.replace(/#e2e8f0/g, '#ffffff');
  f = f.replace(/#64748b/g, '#71717a');
  f = f.replace(/#818cf8/g, '#ffffff');
  fs.writeFileSync('src/components/SpecialistSwitchModal.jsx', f, 'utf8');
  console.log('SpecialistSwitchModal.jsx cleaned');
}

// 2. KnowledgeVault.jsx
if (fs.existsSync('src/components/KnowledgeVault.jsx')) {
  let f = fs.readFileSync('src/components/KnowledgeVault.jsx', 'utf8');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  f = f.replace(/#a78bfa/g, '#ffffff');
  f = f.replace(/#38bdf8/g, '#ffffff');
  f = f.replace(/#f87171/g, '#ffffff');
  f = f.replace(/rgba\(239,68,68,0\.15\)/g, 'rgba(255,255,255,0.1)');
  fs.writeFileSync('src/components/KnowledgeVault.jsx', f, 'utf8');
  console.log('KnowledgeVault.jsx cleaned');
}

// 3. PerformanceSidebar.jsx
if (fs.existsSync('src/components/PerformanceSidebar.jsx')) {
  let f = fs.readFileSync('src/components/PerformanceSidebar.jsx', 'utf8');
  f = f.replace(/#09090b/g, '#000000');
  f = f.replace(/#0f172a/g, '#000000');
  f = f.replace(/#1e293b/g, '#27272a');
  f = f.replace(/#f87171/g, '#ffffff');
  fs.writeFileSync('src/components/PerformanceSidebar.jsx', f, 'utf8');
  console.log('PerformanceSidebar.jsx cleaned');
}

// 4. main.jsx
if (fs.existsSync('src/main.jsx')) {
  let f = fs.readFileSync('src/main.jsx', 'utf8');
  f = f.replace(/#090d16/g, '#000000');
  f = f.replace(/#f1f5f9/g, '#ffffff');
  f = f.replace(/#38bdf8/g, '#ffffff');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  f = f.replace(/#f87171/g, '#ffffff');
  f = f.replace(/#fca5a5/g, '#d4d4d8');
  f = f.replace(/linear-gradient\(135deg,\s*#38bdf8 0%,\s*#a78bfa 100%\)/g, '#ffffff');
  f = f.replace(/#a78bfa/g, '#ffffff');
  f = f.replace(/#0f172a/g, '#000000');
  fs.writeFileSync('src/main.jsx', f, 'utf8');
  console.log('main.jsx cleaned');
}

// 5. documentParser.js
if (fs.existsSync('src/utils/documentParser.js')) {
  let f = fs.readFileSync('src/utils/documentParser.js', 'utf8');
  f = f.replace(/#ef4444/g, '#ffffff');
  f = f.replace(/#3b82f6/g, '#ffffff');
  f = f.replace(/#10b981/g, '#ffffff');
  f = f.replace(/#f97316/g, '#ffffff');
  f = f.replace(/#eab308/g, '#ffffff');
  f = f.replace(/#06b6d4/g, '#ffffff');
  f = f.replace(/#a78bfa/g, '#ffffff');
  fs.writeFileSync('src/utils/documentParser.js', f, 'utf8');
  console.log('documentParser.js cleaned');
}

// 6. CyberCoreLogin.jsx
if (fs.existsSync('src/components/CyberCoreLogin.jsx')) {
  let f = fs.readFileSync('src/components/CyberCoreLogin.jsx', 'utf8');
  f = f.replace(/purple:\s*\{[^}]*\}/, "purple:  { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' }");
  f = f.replace(/emerald:\s*\{[^}]*\}/, "emerald: { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' }");
  f = f.replace(/cyber:\s*\{[^}]*\}/, "cyber:   { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' }");
  f = f.replace(/rose:\s*\{[^}]*\}/, "rose:    { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' }");
  f = f.replace(/bg-\[#03050d\]/g, 'bg-[#000000]');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  fs.writeFileSync('src/components/CyberCoreLogin.jsx', f, 'utf8');
  console.log('CyberCoreLogin.jsx cleaned');
}

// 7. LampLogin.jsx
if (fs.existsSync('src/components/LampLogin.jsx')) {
  let f = fs.readFileSync('src/components/LampLogin.jsx', 'utf8');
  f = f.replace(/#060710/g, '#000000');
  f = f.replace(/#f1f5f9/g, '#ffffff');
  f = f.replace(/#38bdf8/g, '#ffffff');
  f = f.replace(/#fbbf24/g, '#ffffff');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  f = f.replace(/linear-gradient\(135deg,\s*#7c3aed,\s*#4f46e5\)/g, 'linear-gradient(135deg, #ffffff, #d4d4d8)');
  f = f.replace(/linear-gradient\(135deg,\s*#7c3aed 0%,\s*#06b6d4 100%\)/g, 'linear-gradient(135deg, #ffffff 0%, #71717a 100%)');
  f = f.replace(/#4f46e5/g, '#d4d4d8');
  f = f.replace(/#7c3aed/g, '#ffffff');
  f = f.replace(/#06b6d4/g, '#ffffff');
  f = f.replace(/#fca5a5/g, '#d4d4d8');
  f = f.replace(/#6ee7b7/g, '#ffffff');
  f = f.replace(/#64748b/g, '#71717a');
  f = f.replace(/#a78bfa/g, '#ffffff');
  f = f.replace(/#e2e8f0/g, '#ffffff');
  f = f.replace(/#10b981/g, '#ffffff');
  fs.writeFileSync('src/components/LampLogin.jsx', f, 'utf8');
  console.log('LampLogin.jsx cleaned');
}

// 8. ArtifactCanvas.jsx
if (fs.existsSync('src/components/ArtifactCanvas.jsx')) {
  let f = fs.readFileSync('src/components/ArtifactCanvas.jsx', 'utf8');
  f = f.replace(/#0e0f1d/g, '#000000');
  f = f.replace(/#0f172a/g, '#000000');
  f = f.replace(/#f8fafc/g, '#ffffff');
  f = f.replace(/#a78bfa/g, '#ffffff');
  f = f.replace(/#f87171/g, '#ffffff');
  f = f.replace(/#60a5fa/g, '#ffffff');
  f = f.replace(/linear-gradient\(180deg,\s*#38bdf8 0%,\s*#a78bfa 50%,\s*#ec4899 100%\)/g, 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 50%, #71717a 100%)');
  f = f.replace(/#38bdf8/g, '#ffffff');
  f = f.replace(/#ec4899/g, '#71717a');
  f = f.replace(/#0284c7/g, '#18181b');
  f = f.replace(/#f1f5f9/g, '#f4f4f5');
  f = f.replace(/#7c3aed/g, '#ffffff');
  f = f.replace(/#475569/g, '#71717a');
  f = f.replace(/#64748b/g, '#71717a');
  f = f.replace(/#9ca3af/g, '#a1a1aa');
  f = f.replace(/#059669/g, '#ffffff');
  f = f.replace(/#34d399/g, '#ffffff');
  f = f.replace(/#e2e8f0/g, '#ffffff');
  f = f.replace(/#cbd5e1/g, '#d4d4d8');
  f = f.replace(/#1e293b/g, '#27272a');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  f = f.replace(/#090d16/g, '#000000');
  f = f.replace(/#a855f7/g, '#ffffff');
  f = f.replace(/linear-gradient\(135deg,\s*#7c3aed,\s*#a855f7\)/g, '#ffffff');
  f = f.replace(/rgba\(56,\s*189,\s*248,\s*0\.6\)/g, 'rgba(255, 255, 255, 0.2)');
  f = f.replace(/rgba\(56,\s*189,\s*248,\s*0\.7\)/g, 'rgba(255, 255, 255, 0.3)');
  f = f.replace(/rgba\(167,\s*139,\s*250,\s*0\.18\)/g, 'rgba(255, 255, 255, 0.08)');
  f = f.replace(/rgba\(124,\s*58,\s*237,\s*0\.6\)/g, 'rgba(255, 255, 255, 0.3)');
  fs.writeFileSync('src/components/ArtifactCanvas.jsx', f, 'utf8');
  console.log('ArtifactCanvas.jsx cleaned');
}

// 9. AdminInspectorModal.jsx
if (fs.existsSync('src/components/AdminInspectorModal.jsx')) {
  let f = fs.readFileSync('src/components/AdminInspectorModal.jsx', 'utf8');
  f = f.replace(/#0e0f1d/g, '#000000');
  f = f.replace(/#0f172a/g, '#000000');
  f = f.replace(/#f8fafc/g, '#ffffff');
  f = f.replace(/linear-gradient\(135deg,\s*#7c3aed,\s*#4f46e5\)/g, 'linear-gradient(135deg, #27272a, #18181b)');
  f = f.replace(/linear-gradient\(135deg,\s*#4f46e5,\s*#7c3aed\)/g, '#ffffff');
  f = f.replace(/#7c3aed/g, '#ffffff');
  f = f.replace(/#4f46e5/g, '#d4d4d8');
  f = f.replace(/#c4b5fd/g, '#ffffff');
  f = f.replace(/#64748b/g, '#71717a');
  f = f.replace(/#94a3b8/g, '#a1a1aa');
  f = f.replace(/#334155/g, '#27272a');
  f = f.replace(/#cbd5e1/g, '#d4d4d8');
  f = f.replace(/#a78bfa/g, '#ffffff');
  f = f.replace(/#fbbf24/g, '#ffffff');
  f = f.replace(/#f87171/g, '#ffffff');
  f = f.replace(/#4ade80/g, '#ffffff');
  f = f.replace(/#f1f5f9/g, '#ffffff');
  f = f.replace(/#475569/g, '#71717a');
  fs.writeFileSync('src/components/AdminInspectorModal.jsx', f, 'utf8');
  console.log('AdminInspectorModal.jsx cleaned');
}

console.log('All remaining components cleaned!');
