/**
 * Code Execution Sandbox Utility
 * Runs JavaScript and Python natively in the browser via WebAssembly (Pyodide)
 * with optional fallback to local bridge.
 */

let pyodideInstance = null;
let pyodideLoadingPromise = null;

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    if (typeof window === 'undefined') throw new Error('Browser environment required for Pyodide.');
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Pyodide WebAssembly runtime from CDN.'));
        document.head.appendChild(script);
      });
    }
    const py = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
    });
    pyodideInstance = py;
    return py;
  })();

  return pyodideLoadingPromise;
}

export async function executeCode(code, language = 'javascript', bridgeUrl = '', bridgeToken = '') {
  const lang = (language || '').toLowerCase().trim();

  // 1. JavaScript Execution (In-Browser Function Sandbox)
  if (lang === 'javascript' || lang === 'js') {
    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(formatArg).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(formatArg).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.map(formatArg).join(' ')),
      info: (...args) => logs.push('[INFO] ' + args.map(formatArg).join(' ')),
      table: (data) => logs.push(JSON.stringify(data, null, 2)),
    };

    try {
      const runner = new Function('console', `
        'use strict';
        try {
          ${code}
        } catch (err) {
          console.error(err.message || String(err));
        }
      `);
      runner(customConsole);

      return {
        success: true,
        output: logs.length > 0 ? logs.join('\n') : '(Code executed successfully with no console output)',
        logs
      };
    } catch (err) {
      return {
        success: false,
        output: `Execution Error: ${err.message}`,
        logs: [err.message]
      };
    }
  }

  // 2. Python Execution (Client-Side WebAssembly Pyodide Sandbox)
  if (lang === 'python' || lang === 'py') {
    // If local bridge is explicitly active and requested, use local machine
    if (bridgeUrl && bridgeToken) {
      try {
        const res = await fetch(`${bridgeUrl.replace(/\/$/, '')}/api/bridge/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bridge-token': bridgeToken
          },
          body: JSON.stringify({
            command: `python -c "${code.replace(/"/g, '\\"')}"`
          })
        });
        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            output: data.output || data.error || 'Execution completed.',
            logs: [data.output]
          };
        }
      } catch (err) {
        console.warn('Bridge python exec failed, falling back to Pyodide WebAssembly:', err);
      }
    }

    try {
      const logs = [];
      const pyodide = await getPyodide();

      pyodide.setStdout({ batched: (msg) => logs.push(msg) });
      pyodide.setStderr({ batched: (msg) => logs.push('[ERROR] ' + msg) });

      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined && result !== null && String(result) !== 'None') {
        logs.push(formatArg(result));
      }

      return {
        success: true,
        output: logs.length > 0 ? logs.join('\n') : '(Python code executed successfully with no console output)',
        logs
      };
    } catch (err) {
      return {
        success: false,
        output: `Python Runtime Error:\n${err.message || String(err)}`,
        logs: [err.message || String(err)]
      };
    }
  }

  // 3. System Commands Execution via Local Agent Bridge
  if (bridgeUrl && bridgeToken) {
    try {
      const res = await fetch(`${bridgeUrl.replace(/\/$/, '')}/api/bridge/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bridge-token': bridgeToken
        },
        body: JSON.stringify({ command: code })
      });
      const data = await res.json();
      return {
        success: res.ok,
        output: data.output || data.error || 'Execution completed.',
        logs: [data.output]
      };
    } catch (err) {
      return {
        success: false,
        output: `Local Bridge Exec Error: ${err.message}`,
        logs: [err.message]
      };
    }
  }

  return {
    success: false,
    output: `Execution for '${language}' requires active Local Agent Bridge connection (start.bat). JavaScript and Python run natively in browser.`,
    logs: []
  };
}

function formatArg(arg) {
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}
