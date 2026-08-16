import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Kadenz — täglicher Almanach',
        short_name: 'Kadenz',
        description: 'Abends eintragen, rückwirkend nachtragen, am Monatsende auswerten.',
        lang: 'de',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#0E1015',
        theme_color: '#0E1015',
        categories: ['lifestyle', 'productivity', 'health'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Android: langer Druck aufs Icon -> Direktsprung in die Ansicht
        shortcuts: [
          {
            name: 'Tag eintragen',
            short_name: 'Tag',
            url: '/?tab=day',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Monatsübersicht',
            short_name: 'Monat',
            url: '/?tab=month',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Monatsbilanz',
            short_name: 'Bilanz',
            url: '/?tab=stats',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
