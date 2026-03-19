// Ducket AI Galactica — Vite Configuration
// Tailwind v4 via @tailwindcss/vite plugin (no tailwind.config.js needed)
// Express API proxy: /api/* -> http://localhost:3001 (avoids CORS in dev)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
