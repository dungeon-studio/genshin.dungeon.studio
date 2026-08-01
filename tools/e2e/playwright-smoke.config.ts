// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const artifactRoot = '/tmp/genshin-smoke';

export default defineConfig({
  testDir: './specs',

  // Required, not defaulted; see the setup for why it is enforced there.
  globalSetup: './specs/require-smoke-target.ts',

  // The specs that hold against a real deployment: anonymous, read-only, and
  // free of the Firebase Auth emulator the rest of the suite signs in through.
  grep: /@smoke/,

  // Read-only against a deployment nothing else in the run mutates, so no spec
  // can observe another's state.
  fullyParallel: true,

  forbidOnly: Boolean(process.env.CI),

  // A public origin behind a CDN. A failure has to survive a retry before it is
  // worth withholding a version from the next environment over.
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  // No JUnit: this run reports on one deployment, not on the test suite's own
  // health, so there is nothing for Codecov's test analytics to trend.
  outputDir: path.join(artifactRoot, 'test-results'),

  use: {
    baseURL: process.env.SMOKE_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // No `webServer`, deliberately: the point is to exercise what was published,
  // and a local server started here would answer in its place.
});
