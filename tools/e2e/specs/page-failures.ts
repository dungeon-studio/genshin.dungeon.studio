// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ConsoleMessage } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

/**
 * `test`, extended to fail when the page logged an uncaught error or a
 * `console.error`.
 *
 * Without it, a "the heading is there" assertion passes on a page whose data
 * layer threw. The check is automatic rather than something each test opts into:
 * a collect-now-assert-later helper leaves every test to remember the assertion,
 * and the spec that clicks through the navigation had already forgotten it.
 *
 * Listeners attach before the test body runs, so nothing a navigation emits is
 * missed, and the assertion runs in teardown against whatever accumulated.
 */
export const test = base.extend<{ pageFailures: string[] }>({
  pageFailures: [
    async ({ page }, use) => {
      const failures: string[] = [];

      page.on('pageerror', (error) => failures.push(`uncaught: ${error.message}`));
      page.on('console', (message: ConsoleMessage) => {
        if (message.type() === 'error') failures.push(`console.error: ${message.text()}`);
      });

      await use(failures);

      expect(failures).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
