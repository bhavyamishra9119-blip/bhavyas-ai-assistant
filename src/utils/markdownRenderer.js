/**
 * ══════════════════════════════════════════════════════════════════
 * MODULE: Markdown & Syntax Rendering Engine (markdownRenderer.js)
 * APPLICATION: Bhavya's AI Assistant
 * 
 * PURPOSE:
 * Provides a lightning-fast, zero-dependency Markdown-to-HTML compiler
 * and vibrant multi-language syntax highlighting engine tailored for
 * technical AI conversations.
 * 
 * CAPABILITIES:
 * 1. Multi-tier code syntax highlighting (Highlight.js with custom regex fallback).
 * 2. Math typesetting via KaTeX ($inline$ and $$display$$ blocks).
 * 3. Interactive code widgets: Run sandbox, Canvas visualizer, copy button.
 * 4. GitHub-flavored alerts ([!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]).
 * 5. Dynamic Markdown tables with automatic Chart.js visualizer button injection.
 * 6. Mermaid diagram containers and visual git diff blocks.
 * ══════════════════════════════════════════════════════════════════
 */

/**
 * High-performance, multi-language syntax highlighter.
 * Evaluates raw source code and returns styled HTML spans.
 *
 * @param {string} rawCode - The unformatted source code string.
 * @param {string} language - Target language tag (e.g. 'js', 'py', 'html', 'css', 'json', 'diff').
 * @returns {string} Sanitized HTML with color-coded syntax tokens.
 */
export function highlightSyntax(rawCode, language) {
  if (!rawCode) return '';
  const lang = (language || '').toLowerCase().trim();

  /**
   * Encodes HTML special characters to prevent XSS injection within code blocks.
   * @param {string} str - Raw text input.
   * @returns {string} Escaped HTML string.
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 1. First Priority: Highlight.js Engine if available in browser
  if (typeof window !== 'undefined' && window.hljs) {
    try {
      const validLang = lang === 'html' || lang === 'xml' || lang === 'svg' ? 'xml' :
                        lang === 'js' || lang === 'javascript' ? 'javascript' :
                        lang === 'ts' || lang === 'typescript' ? 'typescript' :
                        lang === 'jsx' || lang === 'tsx' ? 'xml' :
                        lang === 'py' || lang === 'python' ? 'python' :
                        lang === 'css' || lang === 'scss' ? 'css' :
                        lang === 'json' ? 'json' :
                        lang === 'sh' || lang === 'bash' || lang === 'shell' ? 'bash' :
                        lang === 'sql' ? 'sql' :
                        lang === 'cpp' || lang === 'c++' ? 'cpp' :
                        lang === 'c' ? 'c' :
                        lang === 'java' ? 'java' :
                        lang === 'rust' || lang === 'rs' ? 'rust' :
                        lang === 'go' || lang === 'golang' ? 'go' : lang;

      if (validLang && window.hljs.getLanguage(validLang)) {
        return window.hljs.highlight(rawCode, { language: validLang, ignoreIllegals: true }).value;
      }
      return window.hljs.highlightAuto(rawCode).value;
    } catch(e) {
      console.warn('hljs error, fallback to native tokenizer:', e);
    }
  }

  // 2. High-Precision HTML / XML / SVG Fallback Tokenizer
  if (['html', 'xml', 'svg'].includes(lang) || (lang === '' && rawCode.trim().startsWith('<') && rawCode.trim().endsWith('>'))) {
    const escaped = escapeHtml(rawCode);
    return escaped.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE [^&gt;]+&gt;)|(&lt;\/?[a-zA-Z0-9\-:]+)|([a-zA-Z0-9\-:]+)(?=\=)|(="[^"]*"|='[^']*')|(&gt;|\/&gt;)/g, (m, comment, doctype, tag, attr, val, closeTag) => {
      if (comment) return '<span class="syn-comment" style="color: #4ade80 !important; font-style: italic !important;">' + comment + '</span>';
      if (doctype) return '<span class="syn-doctype" style="color: #ffffff; font-weight: 700;">' + doctype + '</span>';
      if (tag) return '<span class="syn-tag" style="color: #e4e4e7; font-weight: 700;">' + tag + '</span>';
      if (attr) return '<span class="syn-attr" style="color: #d4d4d8; font-weight: 600;">' + attr + '</span>';
      if (val) return '<span class="syn-string" style="color: #d4d4d8;">' + val + '</span>';
      if (closeTag) return '<span class="syn-tag" style="color: #e4e4e7; font-weight: 700;">' + closeTag + '</span>';
      return m;
    });
  }

  // 2b. High-Precision CSS / SCSS Fallback Tokenizer
  if (['css', 'scss', 'less'].includes(lang) || (lang === '' && (rawCode.includes(':root') || rawCode.includes('{')) && !rawCode.includes('<html'))) {
    const escaped = escapeHtml(rawCode);
    return escaped.replace(/(\/\*[\s\S]*?\*\/)|(@[a-zA-Z-]+)|([.#]?[a-zA-Z0-9_-]+(?=\s*\{))|(--[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)(?=\s*:)|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|deg|fr)\b)|(:\s*[^;{}]+;)/g, (m, comment, atRule, selector, prop, hex, unit, val) => {
      if (comment) return '<span class="syn-comment" style="color: #4ade80 !important; font-style: italic !important;">' + comment + '</span>';
      if (atRule) return '<span class="syn-keyword" style="color: #ffffff; font-weight: 700;">' + atRule + '</span>';
      if (selector) return '<span class="syn-tag" style="color: #e4e4e7; font-weight: 700;">' + selector + '</span>';
      if (prop) return '<span class="syn-attr" style="color: #d4d4d8; font-weight: 600;">' + prop + '</span>';
      if (hex) return '<span class="syn-string" style="color: #d4d4d8; font-weight: 600;">' + hex + '</span>';
      if (unit) return '<span class="syn-number" style="color: #f4f4f5; font-weight: 600;">' + unit + '</span>';
      return m;
    });
  }

  // 3. High-Precision JSON Fallback Tokenizer
  if (lang === 'json') {
    const jsonRegex = /("(?:[^"\\]|\\.)*")(?:\s*:)?|(\b\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;
    let result = '';
    let lastIndex = 0;
    let match;
    while ((match = jsonRegex.exec(rawCode)) !== null) {
      result += escapeHtml(rawCode.substring(lastIndex, match.index));
      lastIndex = jsonRegex.lastIndex;
      const [full, str, num, bool] = match;
      if (str) {
        if (full.endsWith(':')) {
          result += '<span class="syn-key" style="color: #ffffff; font-weight: 600;">' + escapeHtml(str) + '</span>:';
        } else {
          result += '<span class="syn-string" style="color: #d4d4d8;">' + escapeHtml(str) + '</span>';
        }
      } else if (num) {
        result += '<span class="syn-number" style="color: #f4f4f5; font-weight: 600;">' + escapeHtml(num) + '</span>';
      } else if (bool) {
        result += '<span class="syn-constant" style="color: #ffffff; font-weight: 600;">' + escapeHtml(bool) + '</span>';
      }
    }
    result += escapeHtml(rawCode.substring(lastIndex));
    return result;
  }

  // 4. Multi-Language Lexer Fallback for JS, TS, Python, C++, etc.
  const KEYWORDS = new Set([
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'from',
    'as', 'implements', 'interface', 'package', 'private', 'protected', 'public',
    'static', 'type', 'enum', 'def', 'elif', 'except', 'pass', 'lambda', 'struct',
    'impl', 'fn', 'mut', 'pub', 'trait', 'where', 'select', 'insert', 'update', 'delete',
    'table', 'from', 'where', 'join', 'left', 'right', 'inner', 'group', 'by', 'order',
    'having', 'limit', 'create', 'alter', 'drop', 'primary', 'key', 'echo', 'set', 'get',
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'GROUP', 'ORDER'
  ]);

  const BUILTINS = new Set([
    'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON',
    'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Error', 'TypeError',
    'console', 'window', 'document', 'navigator', 'localStorage', 'sessionStorage',
    'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
    'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext',
    'print', 'len', 'range', 'dict', 'list', 'tuple', 'int', 'str', 'float', 'bool', 'self',
    'process', 'Buffer', 'require', 'module', 'exports'
  ]);

  const CONSTANTS = new Set([
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'nil', 'None', 'True', 'False'
  ]);

  const commentPattern = ['py', 'python', 'sh', 'bash', 'shell', 'yaml', 'yml', 'r'].includes(lang) 
    ? '(#.*$|\\/\\/.*$)' 
    : (lang === 'sql' ? '(--.*$|\\/\\/.*$)' : '(\\/\\/.*$)');

  const tokenRegex = new RegExp('(\\/\\*[\\s\\S]*?\\*\\/)|' + commentPattern + '|(`(?:[^`\\\\]|\\\\.)*`)|("(?:[^"\\\\]|\\\\.)*")|(\'(?:[^\'\\\\]|\\\\.)*\')|(\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?(?:ms|px|rem|em|%|s)?\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)|(=>|===|!==|==|!=|<=|>=|&&|\\|\\||\\+\\+|--|\\+=|-=|\\*=|\\/=|[-+*/%&|^!=<>?:])', 'gm');

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(rawCode)) !== null) {
    const textBefore = rawCode.substring(lastIndex, match.index);
    if (textBefore) {
      result += escapeHtml(textBefore);
    }
    lastIndex = tokenRegex.lastIndex;

    const [fullMatch, multiComment, singleComment, tmplString, doubleString, singleString, num, ident, op] = match;

    if (multiComment || singleComment) {
      result += '<span class="syn-comment" style="color: #4ade80 !important; font-style: italic !important;">' + escapeHtml(fullMatch) + '</span>';
    } else if (tmplString || doubleString || singleString) {
      result += '<span class="syn-string" style="color: #d4d4d8;">' + escapeHtml(fullMatch) + '</span>';
    } else if (num) {
      result += '<span class="syn-number" style="color: #f4f4f5; font-weight: 600;">' + escapeHtml(fullMatch) + '</span>';
    } else if (ident) {
      if (CONSTANTS.has(ident)) {
        result += '<span class="syn-constant" style="color: #ffffff; font-weight: 600;">' + escapeHtml(ident) + '</span>';
      } else if (KEYWORDS.has(ident) || KEYWORDS.has(ident.toLowerCase())) {
        result += '<span class="syn-keyword" style="color: #ffffff; font-weight: 700;">' + escapeHtml(ident) + '</span>';
      } else if (BUILTINS.has(ident) || BUILTINS.has(ident.toUpperCase())) {
        result += '<span class="syn-builtin" style="color: #e4e4e7; font-weight: 600;">' + escapeHtml(ident) + '</span>';
      } else {
        const rest = rawCode.substring(lastIndex);
        const isFnCall = /^\s*\(/.test(rest);
        if (isFnCall) {
          result += '<span class="syn-function" style="color: #ffffff; font-weight: 600;">' + escapeHtml(ident) + '</span>';
        } else {
          result += '<span class="syn-ident" style="color: #f4f4f5;">' + escapeHtml(ident) + '</span>';
        }
      }
    } else if (op) {
      result += '<span class="syn-operator" style="color: #a1a1aa; font-weight: 600;">' + escapeHtml(fullMatch) + '</span>';
    } else {
      result += escapeHtml(fullMatch);
    }
  }

  const remaining = rawCode.substring(lastIndex);
  if (remaining) {
    result += escapeHtml(remaining);
  }

  return result;
}

/**
 * ══════════════════════════════════════════════════════════════════
 * FULL-FEATURED MARKDOWN TO HTML COMPILER
 * Converts raw Markdown output from LLMs into safe, beautiful,
 * interactive HTML containing code cards, math formulae, and tables.
 * 
 * PIPELINE STAGES:
 * 1. Smart Link Resolution (resolves e-commerce search intents).
 * 2. Code Block Isolation (preserves code from inline regex collisions).
 * 3. Math Block Extraction ($$...$$ and \[...\] KaTeX blocks).
 * 4. Line-by-Line AST parsing (headers, lists, tables, blockquotes).
 * 5. Inline Formatting (bold, italics, subscripts, superscripts).
 * 6. Code & Math placeholder re-hydration.
 * ══════════════════════════════════════════════════════════════════
 *
 * @param {string} text - Raw markdown text from the AI stream or database.
 * @returns {string} Fully compiled HTML ready for safe injection or DOM rendering.
 */
export function renderMarkdown(text) {
  if (!text) return '';

  // 1. Smart Product Link Enhancer: Ensure Amazon / Flipkart links point directly to product search pages
  let currentProdName = '';
  const inputLines = text.split('\n');
  const processedInputLines = inputLines.map(line => {
    const headingMatch = line.match(/^(?:###?\s*(?:\d+\.|\*|-)?\s*|\*\*\s*\d+\.|\*\*\s*)([A-Za-z0-9\s\-\+\/\(\)]+?)(?:\*\*|$|:)/);
    if (headingMatch && headingMatch[1] && headingMatch[1].trim().length > 3) {
      const candidate = headingMatch[1].replace(/^(Key Specs|Pros|Cons|Buy Links|Summary|Option|Model)\b/i, '').trim();
      if (candidate.length > 2) currentProdName = candidate;
    }

    return line.replace(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:amazon\.in|flipkart\.com|amazon\.com))(?:\/|\/s|\/search)?\)/gi, (match, label, baseUrl) => {
      const query = encodeURIComponent(currentProdName || label || 'product');
      if (baseUrl.includes('amazon')) {
        return `[${label}](https://www.amazon.in/s?k=${query})`;
      } else if (baseUrl.includes('flipkart')) {
        return `[${label}](https://www.flipkart.com/search?q=${query})`;
      }
      return match;
    });
  });
  text = processedInputLines.join('\n');

  function parseInline(str) {
    if (!str) return '';
    let res = str;

    const inlineMathPlaceholders = [];
    // 1. Extract inline math ($...$ or \(...\)) safely before HTML escaping & markdown formatting
    res = res.replace(/(?:\$([^\$\n\r]+?)\$|\\\(([\s\S]*?)\\\))/g, (match, eq1, eq2) => {
      const eq = (eq1 || eq2 || '').trim();
      const ph = `KATEXINLINEPH${inlineMathPlaceholders.length}Z`;
      let rendered = `$${eq}$`;
      if (typeof window !== 'undefined' && window.katex) {
        try {
          rendered = window.katex.renderToString(eq, { displayMode: false, throwOnError: false });
        } catch (e) {
          rendered = `$${eq}$`;
        }
      }
      inlineMathPlaceholders.push(rendered);
      return ph;
    });

    // 2. Escape raw HTML for normal text safely
    res = res
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 3. Auto-convert scientific/engineering variable subscripts like R_A, R_B, R_C, V_in, I_out, R_12 to <sub>...</sub>
    res = res.replace(/\b([A-Za-z])_([A-Za-z0-9+]+)\b/g, '$1<sub>$2</sub>');
    res = res.replace(/\b([A-Za-z])\^([0-9+]+)\b/g, '$1<sup>$2</sup>');

    // 4. Markdown formatting (images, code, bold, italics, links)
    res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="md-image-wrapper" style="margin: 10px 0; text-align: center;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 4px 16px rgba(0,0,0,0.3);" loading="lazy" /><div style="font-size: 11px; color: #a1a1aa; margin-top: 4px; font-style: italic;">$1</div></div>');
    res = res.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
    res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    res = res.replace(/_([^_]+)_/g, '<em>$1</em>');
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // 5. Restore preserved unescaped KaTeX HTML safely
    inlineMathPlaceholders.forEach((html, idx) => {
      res = res.split(`KATEXINLINEPH${idx}Z`).join(html);
    });

    return res;
  }

  const codeBlocks = [];

  // 1. Pre-process text: normalize blockquoted code fences (e.g. `> ```html` or `   ```html`)
  let processedText = text.replace(/^[ \t]*>[ \t]*(`{3,})/gm, '$1');

  const createCodeBlock = (rawCode, langOpt) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    let lang = (langOpt || '').trim().toLowerCase();
    let cleanCode = rawCode;
    
    // Strip residual blockquote prefixes from code lines if present
    const rawLines = cleanCode.split('\n');
    if (rawLines.length > 0 && rawLines.every(l => l.trim() === '' || l.trim().startsWith('>'))) {
      cleanCode = rawLines.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
    }

    if (cleanCode.startsWith('\n')) {
      cleanCode = cleanCode.substring(1);
    }
    cleanCode = cleanCode.trim();

    // Auto-detect language if missing
    if (!lang) {
      if (/<!DOCTYPE html|<html|<head|<body|<div|<style/i.test(cleanCode)) lang = 'html';
      else if (/^(?:import|export|const|let|var|function)\b/m.test(cleanCode)) lang = 'javascript';
      else if (/#include\b|using namespace\b/m.test(cleanCode)) lang = 'cpp';
      else if (/^def\s+\w+|^import\s+\w+/m.test(cleanCode)) lang = 'python';
      else if (/:root\s*\{|[a-z0-9_-]+\s*\{[^}]*:[^}]*\}/i.test(cleanCode)) lang = 'css';
    }
    
    const escapedCode = cleanCode
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const htmlContent = highlightSyntax(cleanCode, lang);
    
    if (lang === 'mermaid') {
      codeBlocks.push(`
        <div class="mermaid-container" style="background: #121214; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 12px 0; overflow-x: auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 11.5px; color: #ffffff; font-weight: bold; border-bottom: 1px dashed #27272a; padding-bottom: 6px;">
            <span>📊 Interactive Mermaid Diagram</span>
            <button class="code-action-btn btn-copy-code" data-code="${escapedCode}" style="padding: 2px 8px; font-size: 10px;">Copy Diagram Code</button>
          </div>
          <div class="mermaid-render">${cleanCode}</div>
        </div>
      `);
      return `\n${placeholder}\n`;
    }
    if (lang === 'diff') {
      const diffFormatted = cleanCode.split('\n').map(line => {
        if (line.startsWith('+')) {
          return `<div style="background: rgba(255, 255, 255, 0.08); color: #ffffff; padding: 2px 8px; border-left: 3px solid #ffffff;">${line}</div>`;
        } else if (line.startsWith('-')) {
          return `<div style="background: rgba(255, 255, 255, 0.03); color: #71717a; padding: 2px 8px; border-left: 3px solid #52525b; text-decoration: line-through;">${line}</div>`;
        }
        return `<div style="padding: 2px 8px; opacity: 0.85; color: #d4d4d8;">${line}</div>`;
      }).join('');

      codeBlocks.push(`
        <div class="diff-block-container" style="background: #000000; border: 1px solid #27272a; border-radius: 10px; margin: 12px 0; overflow: hidden; font-family: monospace; font-size: 12px; line-height: 1.5;">
          <div style="background: rgba(255,255,255,0.03); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #27272a; font-size: 11.5px; color: #ffffff; font-weight: bold;">
            <span>🔍 Visual Code Diff (Before vs After)</span>
            <button class="code-action-btn btn-copy-code" data-code="${escapedCode}" style="padding: 2px 8px;">Copy Diff</button>
          </div>
          <div style="padding: 10px 0;">${diffFormatted}</div>
        </div>
      `);
      return `\n${placeholder}\n`;
    }

    const isCmd = ['bash', 'sh', 'shell', 'zsh', 'powershell', 'cmd'].includes(lang) || 
                  (lang === '' && (cleanCode.startsWith('npm ') || cleanCode.startsWith('node ') || cleanCode.startsWith('git ') || cleanCode.startsWith('python ') || cleanCode.startsWith('pip ')));

    let overlayHtml = `<div class="code-block-header">
      <span class="code-block-lang">${lang || 'code'}</span>
      <div class="code-block-actions">
        <button class="code-action-btn btn-run-code" data-code="${escapedCode}" data-lang="${lang}" title="Run code in sandbox">▶ Run</button>
        <button class="code-action-btn btn-open-canvas" data-code="${escapedCode}" data-lang="${lang}" title="Open Canvas preview">🖥️ Canvas</button>
        <button class="code-action-btn btn-copy-code" data-code="${escapedCode}" title="Copy code">Copy</button>
        ${isCmd ? `<button class="code-action-btn btn-local-run" data-code="${escapedCode}" title="Run command locally">Run Local</button>` : ''}
      </div>
    </div>`;

    codeBlocks.push(`<div class="md-code-block-container">${overlayHtml}<pre class="md-code-block"><code class="hljs language-${lang || 'plaintext'}" data-highlighted="yes">${htmlContent}</code></pre></div>`);
    return `\n${placeholder}\n`;
  };

  // 2. Extract standard and multi-backtick closed code blocks (supports ``` or ````)
  processedText = processedText.replace(/(`{3,})([a-zA-Z0-9_\-\+]*)\s*\n([\s\S]*?)\n[ \t]*\1/g, (match, fence, langOpt, p1) => {
    return createCodeBlock(p1, langOpt);
  });

  // Handle standard 3-backtick without requiring trailing newline before close
  processedText = processedText.replace(/```([a-zA-Z0-9_\-\+]*)([\s\S]*?)```/g, (match, langOpt, p1) => {
    return createCodeBlock(p1, langOpt);
  });

  // Handle unclosed code blocks (e.g. streaming or truncated)
  processedText = processedText.replace(/```([a-zA-Z0-9_\-\+]*)([\s\S]*?)$/g, (match, langOpt, p1) => {
    return createCodeBlock(p1, langOpt);
  });

  // 3. Safety Net: Auto-detect raw un-fenced HTML documents (<!DOCTYPE html> ... </html> or <html> ... </html>)
  processedText = processedText.replace(/(?:^|\n)(<!DOCTYPE html[\s\S]*?<\/html>)/gi, (match, htmlCode) => {
    return createCodeBlock(htmlCode, 'html');
  });
  processedText = processedText.replace(/(?:^|\n)(<html(?:\s+[^>]*?)?>[\s\S]*?<\/html>)/gi, (match, htmlCode) => {
    return createCodeBlock(htmlCode, 'html');
  });

  // 4. Safety Net: Auto-detect raw un-fenced <style> or <script> blocks
  processedText = processedText.replace(/(?:^|\n)(<style[\s\S]*?<\/style>)/gi, (match, styleCode) => {
    return createCodeBlock(styleCode, 'html');
  });
  processedText = processedText.replace(/(?:^|\n)(<script[\s\S]*?<\/script>)/gi, (match, scriptCode) => {
    return createCodeBlock(scriptCode, 'javascript');
  });

  // 5. Safety Net: Auto-detect raw un-fenced C++ programs (#include <...> up to main / Solution / return 0)
  processedText = processedText.replace(/(?:^|\n)(#include\s*<[^>]+>[\s\S]*?(?:return\s+0;?\s*\}|\}\s*;?\s*$))/g, (match, cppCode) => {
    return createCodeBlock(cppCode, 'cpp');
  });

  // Extract Block Math ($$...$$ and \[...\]) before line processing
  const mathBlocks = [];
  processedText = processedText.replace(/(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g, (match, eq1, eq2) => {
    const eq = (eq1 || eq2 || '').trim();
    const placeholder = `__MATH_BLOCK_PLACEHOLDER_${mathBlocks.length}__`;
    let mathHtml = `<div class="katex-display-block">$$${eq}$$</div>`;
    if (typeof window !== 'undefined' && window.katex) {
      try {
        mathHtml = `<div class="katex-display-block">${window.katex.renderToString(eq, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {}
    }
    mathBlocks.push(mathHtml);
    return `\n${placeholder}\n`;
  });

  const lines = processedText.split('\n');
  const resultBlocks = [];
  let currentList = null;
  let currentTable = null;
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushList = () => {
    if (currentList) {
      const tag = currentList.type;
      const lis = currentList.items.map(item => {
        const styleStr = item.indent > 0 ? ` style="margin-left: ${item.indent * 8}px"` : '';
        if (tag === 'ol') {
          return `<li value="${item.index}"${styleStr}>${parseInline(item.content)}</li>`;
        }
        return `<li${styleStr}>${parseInline(item.content)}</li>`;
      }).join('');
      resultBlocks.push(`<${tag} class="md-${tag}">${lis}</${tag}>`);
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      let html = '<div class="md-table-wrapper"><table class="md-table">';
      if (currentTable.headers.length > 0) {
        html += '<thead><tr>';
        currentTable.headers.forEach((h, i) => {
          const align = currentTable.alignments[i] || 'left';
          html += `<th style="text-align: ${align}">${parseInline(h)}</th>`;
        });
        html += '</tr></thead>';
      }
      if (currentTable.rows.length > 0) {
        html += '<tbody>';
        currentTable.rows.forEach(row => {
          html += '<tr>';
          row.forEach((cell, i) => {
            const align = currentTable.alignments[i] || 'left';
            html += `<td style="text-align: ${align}">${parseInline(cell)}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody>';
      }
      html += '</table></div>';

      // Check if table contains numbers for interactive Chart Visualizer
      const containsNumbers = currentTable.rows.some(r => r.some(c => !isNaN(parseFloat(c.replace(/[^0-9.-]/g, '')))));
      if (containsNumbers) {
        const encHeaders = encodeURIComponent(JSON.stringify(currentTable.headers));
        const encRows = encodeURIComponent(JSON.stringify(currentTable.rows));
        html += `<div class="interactive-chart-box" style="margin-top: 10px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid #27272a;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #ffffff;">📊 Visual Chart:</span>
            <button class="btn-render-chart" data-type="bar" data-headers="${encHeaders}" data-rows="${encRows}" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-weight: 600;">📊 Bar</button>
            <button class="btn-render-chart" data-type="line" data-headers="${encHeaders}" data-rows="${encRows}" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-weight: 600;">📈 Line</button>
            <button class="btn-render-chart" data-type="pie" data-headers="${encHeaders}" data-rows="${encRows}" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-weight: 600;">🍕 Pie</button>
          </div>
          <div class="chart-canvas-container" style="display: none; height: 220px; position: relative;">
            <canvas class="chart-render-canvas"></canvas>
          </div>
        </div>`;
      }

      resultBlocks.push(html);
      currentTable = null;
    }
  };

  const flushBlockquote = () => {
    if (inBlockquote) {
      if (blockquoteLines.length > 0) {
        const fullContent = blockquoteLines.join('\n');
        const alertMatch = fullContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/i);
        if (alertMatch) {
          const type = alertMatch[1].toUpperCase();
          const body = alertMatch[2];
          const icons = {
            NOTE: 'ℹ️',
            TIP: '💡',
            IMPORTANT: '📌',
            WARNING: '⚠️',
            CAUTION: '🚨'
          };
          resultBlocks.push(`<div class="md-alert md-alert--${type.toLowerCase()}"><div class="md-alert-header"><span class="md-alert-icon">${icons[type] || 'ℹ️'}</span><span class="md-alert-title">${type}</span></div><div class="md-alert-body">${renderMarkdown(body)}</div></div>`);
        } else {
          resultBlocks.push(`<blockquote class="md-blockquote">${renderMarkdown(fullContent)}</blockquote>`);
        }
      }
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const flushAll = () => {
    flushList();
    flushTable();
    flushBlockquote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('__CODE_BLOCK_PLACEHOLDER_')) {
      flushAll();
      const match = trimmed.match(/\d+/);
      if (match) {
        const index = parseInt(match[0], 10);
        if (codeBlocks[index]) resultBlocks.push(codeBlocks[index]);
      }
      continue;
    }

    if (trimmed.startsWith('__MATH_BLOCK_PLACEHOLDER_')) {
      flushAll();
      const match = trimmed.match(/\d+/);
      if (match) {
        const index = parseInt(match[0], 10);
        if (mathBlocks[index]) resultBlocks.push(mathBlocks[index]);
      }
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushList();
      flushTable();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^\s*>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
      // Current non-quote line falls through to be processed normally below
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushAll();
      resultBlocks.push('<hr class="md-hr" />');
      continue;
    }

    const headerMatch = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushAll();
      const level = headerMatch[2].length;
      const content = headerMatch[3].trim();
      resultBlocks.push(`<h${level} class="md-h${level}">${parseInline(content)}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

    if (ulMatch) {
      flushTable();
      flushBlockquote();
      const indent = ulMatch[1].length;
      const content = ulMatch[3].trim();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [{ content, indent }] };
      } else {
        currentList.items.push({ content, indent });
      }
      continue;
    }

    if (olMatch) {
      flushTable();
      flushBlockquote();
      const indent = olMatch[1].length;
      const indexValue = parseInt(olMatch[2], 10);
      const content = olMatch[3].trim();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [{ content, indent, index: indexValue }] };
      } else {
        currentList.items.push({ content, indent, index: indexValue });
      }
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushBlockquote();
      
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());

      const isSeparator = cells.every(c => c.match(/^:?-+:?$/));

      if (isSeparator) {
        if (currentTable) {
          currentTable.alignments = cells.map(c => {
            if (c.startsWith(':') && c.endsWith(':')) return 'center';
            if (c.endsWith(':')) return 'right';
            return 'left';
          });
        }
      } else {
        if (!currentTable) {
          currentTable = { headers: cells, rows: [], alignments: [] };
        } else {
          currentTable.rows.push(cells);
        }
      }
      continue;
    }

    if (trimmed === '') {
      flushAll();
      continue;
    }

    flushAll();
    resultBlocks.push(`<p class="md-p">${parseInline(trimmed)}</p>`);
  }

  flushAll();
  return resultBlocks.join('\n');
}
