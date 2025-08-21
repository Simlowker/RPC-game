/**
 * CDN and Browser Caching Configuration
 * Production-ready caching strategies for optimal performance
 */

export const cacheConfig = {
  // Static asset caching headers
  staticAssets: {
    // Images, fonts, videos (1 year)
    immutable: {
      pattern: /\.(jpg|jpeg|png|gif|svg|ico|woff2?|ttf|eot|mp4|webm|webp)$/,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
      }
    },
    
    // JavaScript and CSS with hash (1 year)
    hashed: {
      pattern: /\.(js|css)$/,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
      }
    },
    
    // HTML files (1 hour with revalidation)
    html: {
      pattern: /\.html$/,
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Expires': new Date(Date.now() + 60 * 60 * 1000).toUTCString()
      }
    }
  },

  // API response caching
  api: {
    // Blockchain data (30 seconds)
    blockchain: {
      pattern: /\/api\/(account|balance|transaction)/,
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'Vary': 'Accept-Encoding'
      }
    },
    
    // Static game data (1 hour)
    gameData: {
      pattern: /\/api\/(config|rules|leaderboard)/,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
        'Vary': 'Accept-Encoding'
      }
    }
  },

  // Service Worker caching strategies
  serviceWorker: {
    // Cache first for static assets
    static: {
      strategy: 'CacheFirst',
      cacheName: 'static-assets-v1',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
      }
    },
    
    // Network first for API calls
    api: {
      strategy: 'NetworkFirst',
      cacheName: 'api-cache-v1',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      },
      networkTimeoutSeconds: 3
    },
    
    // Stale while revalidate for pages
    pages: {
      strategy: 'StaleWhileRevalidate',
      cacheName: 'pages-cache-v1',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60 // 1 day
      }
    }
  }
};

// Vercel configuration
export const vercelConfig = {
  headers: [
    {
      source: '/(.*\\.(js|css|jpg|jpeg|png|gif|svg|ico|woff2?|ttf|eot|mp4|webm|webp))',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    },
    {
      source: '/(.*\\.html)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate'
        }
      ]
    }
  ]
};

// Cloudflare configuration
export const cloudflareConfig = {
  pageRules: [
    {
      pattern: '*.js',
      cacheLevel: 'cache_everything',
      edgeCacheTtl: 31536000,
      browserCacheTtl: 31536000
    },
    {
      pattern: '*.css',
      cacheLevel: 'cache_everything',
      edgeCacheTtl: 31536000,
      browserCacheTtl: 31536000
    },
    {
      pattern: '*.html',
      cacheLevel: 'cache_everything',
      edgeCacheTtl: 3600,
      browserCacheTtl: 3600
    }
  ],
  
  // Optimization settings
  optimization: {
    minify: {
      js: true,
      css: true,
      html: true
    },
    brotli: true,
    gzip: true,
    imageOptimization: true,
    rocketLoader: false // Can interfere with React
  }
};

// Express.js middleware configuration
export const expressMiddleware = (req, res, next) => {
  const path = req.path;
  
  // Static assets
  if (cacheConfig.staticAssets.immutable.pattern.test(path)) {
    Object.entries(cacheConfig.staticAssets.immutable.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  // HTML files
  else if (cacheConfig.staticAssets.html.pattern.test(path)) {
    Object.entries(cacheConfig.staticAssets.html.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

export default cacheConfig;