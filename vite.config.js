import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import fs from 'fs'

const runCmd = (cmd) => new Promise((resolve) => {
  exec(cmd, (err, stdout) => {
    resolve(stdout ? stdout.trim() : '');
  });
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sysinfo-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/sysinfo') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            try {
              const sysPromise = runCmd(`powershell -NoProfile -Command "[PSCustomObject]@{ cpu = (Get-CimInstance Win32_Processor).LoadPercentage; ram = (Get-CimInstance Win32_OperatingSystem) | Select-Object TotalVisibleMemorySize, FreePhysicalMemory } | ConvertTo-Json -Depth 2"`);
              const gpuPromise = runCmd(`nvidia-smi --query-gpu=utilization.gpu,memory.used,temperature.gpu,name,memory.total --format=csv,noheader,nounits`);

              const [sysRaw, gpuRaw] = await Promise.all([sysPromise, gpuPromise]);

              let cpu = 15;
              let usedRam = 8.5;
              let totalRam = 16.0;

              if (sysRaw) {
                try {
                  const sysObj = JSON.parse(sysRaw);
                  cpu = sysObj.cpu !== null ? sysObj.cpu : 15;
                  if (sysObj.ram) {
                    const tot = sysObj.ram.TotalVisibleMemorySize || 16777216;
                    const free = sysObj.ram.FreePhysicalMemory || 8388608;
                    totalRam = parseFloat((tot / 1024 / 1024).toFixed(1));
                    usedRam = parseFloat(((tot - free) / 1024 / 1024).toFixed(1));
                  }
                } catch (e) {
                  console.error('Failed to parse system stats JSON:', e);
                }
              }

              let gpuName = 'GeForce RTX 3050 Ti Laptop GPU';
              let gpuUtil = 0;
              let vramUsed = 150;
              let gpuTemp = 45;
              let totalVram = 4096;

              if (gpuRaw) {
                const parts = gpuRaw.split(',');
                if (parts.length >= 4) {
                  gpuUtil = parseInt(parts[0].trim()) || 0;
                  vramUsed = parseInt(parts[1].trim()) || 150;
                  gpuTemp = parseInt(parts[2].trim()) || 45;
                  gpuName = parts[3].trim().replace(/^NVIDIA /, '');
                  if (parts[4]) {
                    totalVram = parseInt(parts[4].trim()) || 4096;
                  }
                }
              }

              res.end(JSON.stringify({
                cpu,
                ram: usedRam,
                totalRam,
                gpu: gpuUtil,
                gpuName,
                vram: vramUsed,
                totalVram,
                temp: gpuTemp
              }));
            } catch (err) {
              console.error('Error fetching hardware stats:', err);
              res.end(JSON.stringify({
                cpu: 10,
                ram: 8.0,
                totalRam: 16.0,
                gpu: 0,
                gpuName: 'GeForce RTX 3050 Ti Laptop GPU',
                vram: 120,
                temp: 40
              }));
            }
          } else if (req.url === '/api/keys') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            if (req.method === 'OPTIONS') {
              res.end();
              return;
            }
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              try {
                const raw = await fs.promises.readFile('keys.json', 'utf8');
                res.end(raw);
              } catch (e) {
                res.end(JSON.stringify({ 
                  geminiKey: '', groqKey: '', openRouterKey: '',
                  cohereKey: '', huggingFaceKey: '', mistralKey: '', sambaNovaKey: '', nvidiaKey: '', zenMuxKey: ''
                }));
              }
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const keys = {
                    geminiKey: data.geminiKey || '',
                    groqKey: data.groqKey || '',
                    openRouterKey: data.openRouterKey || '',
                    cohereKey: data.cohereKey || '',
                    huggingFaceKey: data.huggingFaceKey || '',
                    mistralKey: data.mistralKey || '',
                    sambaNovaKey: data.sambaNovaKey || '',
                    nvidiaKey: data.nvidiaKey || '',
                    zenMuxKey: data.zenMuxKey || ''
                  };
                  await fs.promises.writeFile('keys.json', JSON.stringify(keys, null, 2));
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.writeHead(400);
                  res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5200,
    strictPort: true,  // never silently fall back to another port — fail clearly instead
    host: true,
    allowedHosts: ['.ngrok-free.dev', 'wreath-hence-defective.ngrok-free.dev'],
    proxy: {
      '/api/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        }
      },
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Nvidia proxy error', err);
          });
        }
      },
      '/api/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/groq/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Groq proxy error', err);
          });
        }
      },
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('OpenRouter proxy error', err);
          });
        }
      },
      '/api/cohere': {
        target: 'https://api.cohere.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cohere/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Cohere proxy error', err);
          });
        }
      },
      '/api/mistral': {
        target: 'https://api.mistral.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mistral/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Mistral proxy error', err);
          });
        }
      },
      '/api/sambanova': {
        target: 'https://api.sambanova.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sambanova/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('SambaNova proxy error', err);
          });
        }
      },
      '/api/huggingface': {
        target: 'https://router.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/huggingface/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('HuggingFace proxy error', err);
          });
        }
      },
      '/api/zenmux': {
        target: 'https://zenmux.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zenmux/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('ZenMux proxy error', err);
          });
        }
      },
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Anthropic proxy error', err);
          });
        }
      },
      '/api/openai': {
        target: 'https://api.openai.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('OpenAI proxy error', err);
          });
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) return 'vendor-pdf';
          if (id.includes('xlsx') || id.includes('mammoth') || id.includes('jszip')) return 'vendor-office';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
        }
      }
    }
  }
})

