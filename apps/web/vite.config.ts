// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { codecovVitePlugin } from '@codecov/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { brandIndexHtml } from './src/lib/environment-branding.ts';
import {
  ENVIRONMENT_NAMES,
  isEnvironmentName,
  resolveEnvironment,
} from './src/lib/environments.ts';

const requiredEnvVars: readonly string[] = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_API_BASE_URL',
  'VITE_APP_ORIGIN',
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

// Writes the report beside the bundle instead of uploading it, which is how
// scripts/verify-bundle-stats.ts inspects what the plugin collected.
const bundleStatsDryRun: boolean = process.env.CODECOV_BUNDLE_DRY_RUN === 'true';

const devServerPort = 5173;

/** Vite types its resolved env as `any` per key; an unset var reads as `''` here. */
function readEnv(env: Record<string, unknown>, key: string): string | undefined {
  const value = env[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

let branding: { appEnv: string | undefined; origin: string } = {
  appEnv: undefined,
  origin: `http://localhost:${devServerPort}`,
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Uploads from inside `vite build`, so the token has to reach this process:
    // turbo's strict env mode drops it unless `build.passThroughEnv` in
    // turbo.json lists it. Keying on the token confines uploads to CI.
    // scripts/verify-bundle-stats.ts guards the collection this relies on.
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
        // Unset is the documented default, but a typo would otherwise resolve
        // to dev and quietly badge a production build as alpha.
        const appEnv = readEnv(config.env, 'VITE_APP_ENV');
        if (appEnv !== undefined && !isEnvironmentName(appEnv)) {
          throw new Error(
            `VITE_APP_ENV must be one of ${ENVIRONMENT_NAMES.join(', ')}; got '${appEnv}'`,
          );
        }

        if (config.command !== 'build') return;

        const missing = requiredEnvVars.filter((key) => !config.env[key]);
        if (missing.length > 0) {
          throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
        }
      },
    },
    {
      // Runs on the dev server too, so a local tab carries the same markers a
      // deployed one does. `post` so the HTML it rewrites is the final document.
      name: 'environment-branding',
      configResolved(config) {
        branding = {
          appEnv: readEnv(config.env, 'VITE_APP_ENV'),
          origin: readEnv(config.env, 'VITE_APP_ORIGIN') ?? `http://localhost:${devServerPort}`,
        };
      },
      transformIndexHtml: {
        order: 'post',
        handler(html: string) {
          return brandIndexHtml(html, resolveEnvironment(branding.appEnv), branding.origin);
        },
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
    port: devServerPort,
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
