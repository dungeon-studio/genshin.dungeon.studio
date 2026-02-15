// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Bind to 0.0.0.0 instead of localhost to allow access from host machine when running in DevContainer.
    // The DevContainer's network is isolated; binding to all interfaces exposes the server to the host.
    // Without this, http://localhost:5173 would timeout from the host browser.
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
