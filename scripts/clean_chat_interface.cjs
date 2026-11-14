const fs = require('fs');

let code = fs.readFileSync('src/components/ChatInterface.jsx', 'utf8');

code = code.replace(/#94a3b8/g, '#a1a1aa');
code = code.replace(/#cbd5e1/g, '#d4d4d8');
code = code.replace(/#64748b/g, '#71717a');
code = code.replace(/#e2e8f0/g, '#ffffff');
code = code.replace(/#eef0f8/g, '#f4f4f5');
code = code.replace(/#9ca3af/g, '#a1a1aa');
code = code.replace(/#1a1a2e/g, '#000000');
code = code.replace(/#374151/g, '#27272a');
code = code.replace(/#d1d5db/g, '#d4d4d8');
code = code.replace(/#c4c4d4/g, '#a1a1aa');
code = code.replace(/#f1f5f9/g, '#ffffff');
code = code.replace(/#09090b/g, '#000000');

fs.writeFileSync('src/components/ChatInterface.jsx', code, 'utf8');
console.log('ChatInterface.jsx successfully cleaned!');
