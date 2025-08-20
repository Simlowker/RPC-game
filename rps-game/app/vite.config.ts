import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    minify: 'esbuild',
    sourcemap: false
  },
  optimizeDeps: {
    include: ['@solana/web3.js', '@coral-xyz/anchor']
  }
})
