// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { createLogger } from './logger.js';

/**
 * Log one record through the real configuration and hand back what a sink
 * would receive.
 */
function emit(bindings: Record<string, unknown>, message = 'test'): Record<string, unknown> {
  const lines: string[] = [];
  const logger = createLogger({ level: 'info' }, { write: (line) => lines.push(line) });

  logger.error(bindings, message);

  expect(lines).toHaveLength(1);
  return JSON.parse(lines[0] ?? '') as Record<string, unknown>;
}

describe('createLogger', () => {
  it('labels the level with a severity Cloud Logging understands', () => {
    expect(emit({})).toMatchObject({ severity: 'ERROR', message: 'test' });
  });

  it('writes one line per record', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'info' }, { write: (line) => lines.push(line) });

    logger.info('first');
    logger.info('second');

    expect(lines.join('').trimEnd().split('\n')).toHaveLength(2);
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
