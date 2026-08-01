// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Refuse to run the smoke suite without a deployment to point it at.
 *
 * A default would let a workflow that forgot to set SMOKE_BASE_URL smoke-test
 * localhost, find nothing listening, and report the miswiring as a broken
 * deployment.
 *
 * The check belongs to starting a run rather than to loading the config: a
 * config that throws on import cannot be read by anything static, and knip
 * (which resolves it through the test:smoke script) has to load it to follow
 * what it imports.
 */
export default function requireSmokeTarget(): void {
  if (!process.env.SMOKE_BASE_URL) {
    throw new Error('SMOKE_BASE_URL must be set to the origin of the deployment to smoke-test.');
  }
}
