// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export default {
  // Stryker's default plugin glob resolves beside its own install, which pnpm
  // isolates from the runner, so the plugin is named explicitly.
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  mutate: ['src/**/*.ts', '!src/**/*.test.ts', '!src/testing.ts'],
  // Each worker runs its own Vitest instance, so the default of one worker per
  // core multiplies memory by the host's core count.
  concurrency: 2,
  reporters: ['clear-text', 'progress', 'html', 'json'],
};
