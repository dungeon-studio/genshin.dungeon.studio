// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Refuse to run without a deployment to point at.
 *
 * A default would let a workflow that forgot to set DEPLOYED_BASE_URL run
 * against localhost, find nothing listening, and report the miswiring as a
 * broken deployment.
 *
 * Enforced here rather than in the config: a config that throws while loading
 * cannot be read by static tooling.
 */
export default function requireDeployment(): void {
  if (!process.env.DEPLOYED_BASE_URL) {
    throw new Error('DEPLOYED_BASE_URL must be set to the origin of the deployment under test.');
  }
}
