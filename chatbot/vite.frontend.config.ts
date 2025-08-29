import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/frontend',
  build: {
    outDir: '../../public/js',
    emptyOutDir: false,
    lib: {
      entry: 'chat-demo.ts',
      name: 'UNIACCChatDemo',
      fileName: 'chat-demo',
      formats: ['iife']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  server: {
    proxy: {
      '/test-chat': 'http://localhost:3001',
      '/check-timeout': 'http://localhost:3001',
      '/force-timeout': 'http://localhost:3001'
    }
  }
})
