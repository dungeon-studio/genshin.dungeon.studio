// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { createLogger } from './logger.js';

/**
 * The single record the real configuration emits for `bindings`, as a sink
 * would receive it. The suite runs at `silent`, so the level is raised here.
 */
function emit(bindings: Record<string, unknown>): Record<string, unknown> {
  const lines: string[] = [];
  const logger = createLogger({ level: 'info', destination: { write: (l) => lines.push(l) } });

  logger.error(bindings, 'test');

  return JSON.parse(lines.join('')) as Record<string, unknown>;
}

describe('createLogger', () => {
  it('labels the level with a severity Cloud Logging understands', () => {
    expect(emit({})).toMatchObject({ severity: 'ERROR', message: 'test' });
  });

  it.each([
    ['a bearer header', { authorization: 'Bearer secret-token' }],
    ['a nested bearer header', { req: { headers: { authorization: 'Bearer secret-token' } } }],
    ['a raw token', { token: 'secret-token' }],
    ['a token beneath an arbitrary key', { err: { token: 'secret-token' } }],
    ['a decoded identity token', { user: { uid: 'secret-token', email: 'a@example.com' } }],
    ['a bare user identifier', { uid: 'secret-token' }],
    ['an email address', { email: 'secret-token' }],
  ])('keeps %s out of the emitted line', (_label, bindings) => {
    expect(JSON.stringify(emit(bindings))).not.toContain('secret-token');
  });
});
