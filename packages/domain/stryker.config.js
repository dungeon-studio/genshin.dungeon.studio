// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export default {
  // Stryker discovers plugins beside its own install, where pnpm's isolated
  // layout hides the runner.
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  mutate: ['src/**/*.ts', '!src/**/*.test.ts', '!src/testing.ts'],
  // Stryker sizes its default pool to the host's cores, and each worker runs
  // its own Vitest instance.
  concurrency: 2,
  reporters: ['clear-text', 'progress', 'html', 'json'],
};
