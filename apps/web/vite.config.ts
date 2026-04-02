// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const requiredEnvVars: readonly string[] = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_API_BASE_URL',
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'validate-env',
      configResolved(config) {
        if (config.command !== 'build' || process.env.VITE_VERIFY_ENV !== 'true') return;

        const missing = requiredEnvVars.filter((key) => !config.env[key]);
        if (missing.length > 0) {
          throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
        }
      },
    },
    {
      name: 'generate-version',
      closeBundle() {
        const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
        const timestamp = new Date().toISOString();
        const pkgPath = path.resolve(__dirname, 'package.json');
        const version = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version;
        const metadata = { version, sha, timestamp };
        const distPath = path.resolve(__dirname, 'dist');
        fs.writeFileSync(path.join(distPath, 'version.json'), JSON.stringify(metadata, null, 2));
      },
    },
  ],
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
