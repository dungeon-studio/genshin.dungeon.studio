// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const artifactRoot = '/tmp/genshin-deployed';

export default defineConfig({
  testDir: './specs',

  globalSetup: './specs/require-deployment.ts',

  // `@deployed` marks the specs that can reach a served deployment at all:
  // anonymous and read-only, needing none of the Firebase emulators the rest of
  // the suite signs in through. Bounded by what a deployment can offer, not
  // narrowed to keep the run cheap.
  grep: /@deployed/,

  // Every spec is read-only against a deployment nothing else mutates.
  fullyParallel: true,

  forbidOnly: Boolean(process.env.CI),

  // A public origin behind a CDN: a failure has to survive a retry to count.
  retries: process.env.CI ? 2 : 0,

  // No JUnit: this run reports on a deployment, not on the suite's own health,
  // so there is nothing for Codecov's test analytics to trend.
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  outputDir: path.join(artifactRoot, 'test-results'),

  use: {
    baseURL: process.env.DEPLOYED_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // No `webServer`: a local server started here would answer in place of the
  // deployment under test.
});
