const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/#c8c8d4/g, '#d4d4d8');
css = css.replace(/linear-gradient\(160deg,\s*#ffe066,\s*#f59e0b,\s*#b45309\)/g, 'linear-gradient(160deg, #ffffff, #d4d4d8, #71717a)');
css = css.replace(/#ffcc44/g, '#ffffff');
css = css.replace(/#14b8a6/g, '#ffffff');
css = css.replace(/#5eead4/g, '#d4d4d8');
css = css.replace(/#4ade80/g, '#ffffff');
css = css.replace(/#a78bfa/g, '#71717a');
css = css.replace(/#818cf8/g, '#a1a1aa');
css = css.replace(/#94a3b8/g, '#a1a1aa');
css = css.replace(/#e2e8f0/g, '#d4d4d8');
css = css.replace(/#9ca3af/g, '#a1a1aa');
css = css.replace(/#0e0f1e/g, '#000000');
css = css.replace(/#09090b/g, '#000000');

fs.writeFileSync('src/index.css', css, 'utf8');
console.log('src/index.css 2nd pass complete!');
