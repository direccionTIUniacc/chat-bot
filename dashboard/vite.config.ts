import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying:', req.method, req.url, '-> localhost:3006' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false
  }
})
