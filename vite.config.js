import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      includeAssets: [
        'favicon.ico','favicon.svg','favicon-16x16.png','favicon-32x32.png',
        'apple-touch-icon.png','logo192.png','logo512.png',
        'icon-maskable-512x512.png','offline.html',
      ],

      manifest: {
        name:             'KIIT Fitness Center',
        short_name:       'KIITGym',
        description:      'Manage your KIIT University gym membership, book slots, track attendance and streaks.',
        theme_color:      '#FF6B00',
        background_color: '#111111',
        display:          'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation:      'portrait-primary',
        start_url:        '/?source=pwa',
        scope:            '/',
        lang:             'en',
        categories:       ['health', 'fitness', 'education'],
        icons: [
          { src: '/icon-72x72.png',            sizes: '72x72',   type: 'image/png' },
          { src: '/icon-96x96.png',            sizes: '96x96',   type: 'image/png' },
          { src: '/icon-128x128.png',          sizes: '128x128', type: 'image/png' },
          { src: '/icon-144x144.png',          sizes: '144x144', type: 'image/png' },
          { src: '/icon-152x152.png',          sizes: '152x152', type: 'image/png' },
          { src: '/icon-192x192.png',          sizes: '192x192', type: 'image/png' },
          { src: '/icon-384x384.png',          sizes: '384x384', type: 'image/png' },
          { src: '/icon-512x512.png',          sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png',      sizes: '180x180', type: 'image/png' },
        ],
        shortcuts: [
          { name: 'Book a Slot', short_name: 'Book',    url: '/book',  icons: [{ src: '/icon-96x96.png', sizes: '96x96' }] },
          { name: 'My QR Code',  short_name: 'QR Code', url: '/',      icons: [{ src: '/icon-96x96.png', sizes: '96x96' }] },
          { name: 'View Gyms',   short_name: 'Gyms',    url: '/gyms',  icons: [{ src: '/icon-96x96.png', sizes: '96x96' }] },
        ],
      },

      workbox: {
        cacheId: 'kiit-gym-v1',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // API — NetworkFirst with 10s timeout
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Auth — never cache
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/identitytoolkit\/.*/i,
            handler: 'NetworkOnly',
          },
          // Firestore — NetworkFirst
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 30, maxAgeSeconds: 2 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-css', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-woff', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } },
          },
          // Images
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: { cacheName: 'images-cache', expiration: { maxEntries: 60, maxAgeSeconds: 2592000 } },
          },
          // JS/CSS
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static-resources', expiration: { maxEntries: 60, maxAgeSeconds: 604800 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
