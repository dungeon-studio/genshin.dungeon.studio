// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';
import { describe, expect, it } from 'vitest';

import { nextTeam } from './merge.js';

const SLOT: TeamSlot = 1;
const CREATED_AT = '2026-01-01T00:00:00.000Z' as ISOTimestamp;
const NOW = '2026-01-02T00:00:00.000Z' as ISOTimestamp;

const stored = {
  slot: SLOT,
  name: 'Vaporise',
  members: [null, null, null, null],
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
} satisfies CollectionTeam;

describe('nextTeam', () => {
  it('names a slot nothing ever saved after its number', () => {
    const team = nextTeam(SLOT, {}, null, NOW);

    expect(team.name).toBe(`Team ${SLOT}`);
    expect(team.members).toEqual([null, null, null, null]);
  });

  it('dates a slot nothing ever saved to the save', () => {
    expect(nextTeam(SLOT, {}, null, NOW).createdAt).toBe(NOW);
  });

  it('keeps the createdAt of a team already stored', () => {
    expect(nextTeam(SLOT, { name: 'Renamed' }, stored, NOW).createdAt).toBe(CREATED_AT);
  });

  it('keeps the description a later save leaves out', () => {
    const existing = { ...stored, description: 'Melt the shield first' } satisfies CollectionTeam;

    expect(nextTeam(SLOT, { name: 'Renamed' }, existing, NOW).description).toBe(
      'Melt the shield first',
    );
  });

  it('replaces the description a later save supplies', () => {
    const existing = { ...stored, description: 'Melt the shield first' } satisfies CollectionTeam;

    expect(nextTeam(SLOT, { description: 'Freeze instead' }, existing, NOW).description).toBe(
      'Freeze instead',
    );
  });

  it('keeps an empty description a save supplies rather than the stored one', () => {
    const existing = { ...stored, description: 'Melt the shield first' } satisfies CollectionTeam;

    expect(nextTeam(SLOT, { description: '' }, existing, NOW).description).toBe('');
  });

  it('leaves the description absent when no save ever supplied one', () => {
    expect(nextTeam(SLOT, { name: 'Vaporise' }, null, NOW)).not.toHaveProperty('description');
  });
});
