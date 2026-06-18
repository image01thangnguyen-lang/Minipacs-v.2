import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/orthanc-api': {
          target: 'http://localhost:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-api/, ''),
          headers: {
            'Authorization': 'Basic YWRtaW46YWRtaW5fcGFzc3dvcmQ='
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              if (res && res.writeHead && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Orthanc server not running (Sandbox Mode)' }));
              }
            });
          }
        }
      }
    },
  };
});
