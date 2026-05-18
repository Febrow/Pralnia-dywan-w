import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Wariant PHP / shared hosting:
// - frontend buduje się do statycznych plików w apps/web/dist
// - po zbudowaniu wgrywasz całą zawartość dist/ do public_html (lub wskazanego katalogu) na hostingu
// - PHP (z php/) obsługuje API pod /api/* (router via .htaccess)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Pralnia Dywanów',
        short_name: 'Pralnia',
        description: 'System zarządzania pralnią dywanów',
        theme_color: '#06377B',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        lang: 'pl',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/php/],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8090',
      '/uploads': 'http://127.0.0.1:8090',
    },
  },
});
