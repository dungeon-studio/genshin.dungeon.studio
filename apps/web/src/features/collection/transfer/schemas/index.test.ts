// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { CURRENT_VERSION, parseTransferEnvelope } from './index';

const VALID = {
  version: CURRENT_VERSION,
  exportedAt: '2026-08-01T12:00:00.000Z',
  characters: [{ characterId: 'amber', constellationLevel: 0 }],
  weapons: [],
  teams: [],
};

describe('parseTransferEnvelope', () => {
  it('accepts a file this build wrote', () => {
    const result = parseTransferEnvelope(VALID);

    expect(result.ok).toBe(true);
  });

  it('rejects a version this build does not know', () => {
    const result = parseTransferEnvelope({ ...VALID, version: 99 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('version 99');
  });

  it('reports an unknown version rather than the field errors under it', () => {
    // A newer envelope will fail the v1 shape too; the version is the actionable
    // half of that, so it has to win.
    const result = parseTransferEnvelope({ version: 2, somethingNew: true });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('version 2');
  });

  it('rejects a file carrying no version', () => {
    const { version: _omitted, ...withoutVersion } = VALID;

    const result = parseTransferEnvelope(withoutVersion);

    expect(result.ok).toBe(false);
  });

  it('rejects a well-versioned file with the wrong shape', () => {
    const result = parseTransferEnvelope({ ...VALID, characters: 'not-an-array' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('malformed');
  });

  it.each([
    ['null', null],
    ['a bare string', 'not-json-object'],
    ['an array', []],
  ])('rejects %s', (_label, value) => {
    expect(parseTransferEnvelope(value).ok).toBe(false);
  });
});
