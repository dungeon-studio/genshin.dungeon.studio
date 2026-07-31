// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import path from 'node:path';

import type { ReporterDescription } from '@playwright/test';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(import.meta.dirname, '../..');

// Artifacts land outside the workspace so no gitignore entry has to keep pace
// with them; see .github/copilot-instructions.md.
const artifactRoot = '/tmp/genshin-e2e';

// Ports match apps/api/src/main.ts and vite.config.ts. The host has to be
// `localhost`, not 127.0.0.1: Firebase's popup sign-in returns the credential
// to the origin that opened it, and the emulator serves its handler from
// localhost. These are also the API's default CORS origin and the app's default
// API base URL, so neither server needs configuring below.
const WEB_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8080';

const junitReporter: ReporterDescription = [
  'junit',
  { outputFile: path.join(import.meta.dirname, 'test-results/e2e-junit.xml') },
];

export default defineConfig({
  testDir: './specs',
  outputDir: path.join(artifactRoot, 'test-results'),

  // Signed-in specs take a fresh emulator account each, so their Firestore
  // documents never overlap — but every spec shares the one browser origin
  // backing localStorage.
  fullyParallel: false,
  workers: 1,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,

  // JUnit sits in the workspace beside vitest's, not under artifactRoot: it is
  // the report Codecov ingests, not a debugging artifact. A failing run is the
  // one test analytics needs, so every run writes it.
  reporter: process.env.CI
    ? [
        ['github'],
        junitReporter,
        ['html', { outputFolder: path.join(artifactRoot, 'report'), open: 'never' }],
      ]
    : [['list'], junitReporter],

  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // The emulators belong to `firebase emulators:exec`, which wraps the whole run
  // from the test:e2e script. Starting them here would leave the Firestore
  // emulator's detached Java child holding port 8181 past teardown, against the
  // next run. Both servers below start before it and connect lazily.
  webServer: [
    {
      command: 'pnpm --filter @genshin/api dev',
      cwd: repoRoot,
      url: API_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec vite',
      cwd: path.join(repoRoot, 'apps/web'),
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
