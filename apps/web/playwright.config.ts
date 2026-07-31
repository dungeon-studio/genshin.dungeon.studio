// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(import.meta.dirname, '../..');

// Artifacts land outside the workspace so no gitignore entry has to keep pace
// with them; see .github/copilot-instructions.md.
const artifactRoot = '/tmp/genshin-e2e';

// The ports match apps/api/src/main.ts and vite.config.ts. The host has to be
// `localhost` and not 127.0.0.1: Firebase's popup sign-in hands the credential
// back to whatever origin opened it, and the emulator's own handler is served
// from localhost, so an app on 127.0.0.1 never receives it. Keeping localhost
// also lands on the API's default CORS origin and the app's default API URL.
const WEB_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8080';

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(artifactRoot, 'test-results'),

  // The suite drives one Firebase emulator suite and one API process. Signed-in
  // specs create a fresh emulator user each time, so their Firestore documents
  // never overlap, but every spec shares the one browser origin backing
  // localStorage — so they run one at a time.
  fullyParallel: false,
  workers: 1,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,

  // JUnit goes into the workspace rather than under artifactRoot, matching where
  // vitest writes its own: it is the report Codecov ingests for test analytics,
  // not a debugging artifact, and `test-results/` is already gitignored. Written
  // on every run, because a failing run is the one test analytics cares about.
  reporter: process.env.CI
    ? [
        ['github'],
        ['junit', { outputFile: path.join(import.meta.dirname, 'test-results/e2e-junit.xml') }],
        ['html', { outputFolder: path.join(artifactRoot, 'report'), open: 'never' }],
      ]
    : [
        ['list'],
        ['junit', { outputFile: path.join(import.meta.dirname, 'test-results/e2e-junit.xml') }],
      ],

  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // The emulators are not started here: `firebase emulators:exec` wraps the
  // whole Playwright run (see the test:e2e script). Its Firestore emulator is a
  // detached Java child that outlives a webServer teardown and then holds port
  // 8181 against the next run; emulators:exec owns that lifecycle properly.
  //
  // Both servers below tolerate a still-booting emulator because firebase-admin
  // and the Firebase JS SDK connect lazily.
  // Both run on their defaults: the API already allows the web origin through
  // CORS and the web app already points at the API port, so neither needs
  // configuring here.
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
      cwd: import.meta.dirname,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
