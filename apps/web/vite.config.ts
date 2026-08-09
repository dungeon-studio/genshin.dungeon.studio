// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { codecovVitePlugin } from '@codecov/vite-plugin';
import react from '@vitejs/plugin-react';
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

function packageVersion(): string {
  const { version } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
  ) as { version: string };
  return version;
}

function shortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

const appVersion: string = packageVersion();
const buildSha: string = shortSha();

// A dry run collects the same stats but writes them beside the bundle instead of
// uploading, which is how scripts/verify-bundle-stats.ts inspects them.
const bundleStatsDryRun: boolean = process.env.CODECOV_BUNDLE_DRY_RUN === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle size tracking. The upload happens inside `vite build` rather than as
    // a later CI step, so the token has to reach this process — turbo's strict
    // env mode drops it unless `build.passThroughEnv` in turbo.json lists it.
    // Keying on the token confines uploads to CI; local builds do nothing.
    //
    // The declared peer range stops at Vite 6 and this app builds on Vite 8,
    // whose Rolldown bundler reports the Rollup-compatible hooks the plugin
    // reads. It works, but nothing upstream guarantees it keeps working, and a
    // plugin that silently collected nothing would look exactly like a bundle
    // that never changed — hence the verify:bundle-stats gate in CI.
    codecovVitePlugin({
      enableBundleAnalysis: bundleStatsDryRun || process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'web',
      uploadToken: process.env.CODECOV_TOKEN,
      dryRun: bundleStatsDryRun,
      telemetry: false,
    }),
    {
      name: 'validate-env',
      // .github/workflows/deploy.yml injects these for deployed builds. Failing
      // here keeps the dev fallbacks in lib/firebase.ts and lib/api.ts out of
      // any shipped bundle.
      configResolved(config) {
        if (config.command !== 'build') return;

        const missing = requiredEnvVars.filter((key) => !config.env[key]);
        if (missing.length > 0) {
          throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
        }
      },
    },
    {
      name: 'generate-version',
      closeBundle() {
        const timestamp = new Date().toISOString();
        const metadata = { version: appVersion, sha: buildSha, timestamp };
        const distPath = path.resolve(__dirname, 'dist');
        fs.writeFileSync(path.join(distPath, 'version.json'), JSON.stringify(metadata, null, 2));
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
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
