import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize React imports
      jsxImportSource: '@emotion/react',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Solana RPS Game',
        short_name: 'RPS Game',
        description: 'Play Rock Paper Scissors on Solana blockchain',
        theme_color: '#8b5cf6',
        background_color: '#1e1b4b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mainnet-beta\.solana\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'solana-rpc-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}_${Math.floor(Date.now() / (1000 * 60 * 5))}` // 5 min cache key
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: ['es2020', 'chrome80', 'firefox78', 'safari13'],
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('@solana') || id.includes('@coral-xyz')) {
              return 'solana-vendor'
            }
            if (id.includes('react-hot-toast')) {
              return 'ui-vendor'
            }
            return 'vendor'
          }
          
          // Feature-based chunks
          if (id.includes('/components/')) {
            return 'components'
          }
          if (id.includes('/utils/')) {
            return 'utils'
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
          return `assets/chunks/[name]-[hash:8].js`
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash:8][extname]`
          }
          if (/css/i.test(ext)) {
            return `assets/styles/[name]-[hash:8][extname]`
          }
          return `assets/[name]-[hash:8][extname]`
        }
      },
      // Tree shaking optimization
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
      }
    },
    // Advanced compression
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    // CSS optimizations
    cssCodeSplit: true,
    cssMinify: true,
    // Preload optimization
    modulePreload: {
      polyfill: true
    }
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@coral-xyz/anchor',
      'react',
      'react-dom',
      'react-hot-toast'
    ],
    // Force optimization for better performance
    force: false
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false
    }
  },
  // Enable experimental features for better performance
  experimental: {
    renderBuiltUrl: (filename) => {
      return { runtime: `window.__publicPath__ + ${JSON.stringify(filename)}` }
    }
  }
})
