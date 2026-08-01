// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  CollectionTeam,
  CollectionWeapon,
  CollectionWeaponId,
  TeamSlot,
} from '@genshin/domain';
import { describe, expect, it } from 'vitest';

import { makeCharacter, makeTeam, makeWeapon } from '@/test/fixtures';

import { buildTransferEnvelope, exportFilename, serialiseEnvelope } from './build-envelope';
import type { CollectionSnapshot } from './collection-snapshot';
import { parseTransferEnvelope } from './schemas/index';

const WEAPON_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const EXPORTED_AT = '2026-08-01T12:00:00.000Z';

function snapshot(overrides: Partial<CollectionSnapshot> = {}): CollectionSnapshot {
  return {
    characters: {} as Record<CharacterId, CollectionCharacter>,
    weapons: {} as Record<CollectionWeaponId, CollectionWeapon>,
    teams: {
      1: makeTeam(1),
      2: makeTeam(2),
      3: makeTeam(3),
      4: makeTeam(4),
    } as Record<TeamSlot, CollectionTeam>,
    ...overrides,
  };
}

describe('buildTransferEnvelope', () => {
  it('carries every owned character and weapon', () => {
    const envelope = buildTransferEnvelope(
      snapshot({
        characters: { amber: makeCharacter('amber', 3) } as Record<
          CharacterId,
          CollectionCharacter
        >,
        weapons: {
          [WEAPON_ID]: makeWeapon(WEAPON_ID, 'mistsplitter-reforged', 2),
        } as Record<CollectionWeaponId, CollectionWeapon>,
      }),
      EXPORTED_AT,
    );

    expect(envelope.characters).toEqual([{ characterId: 'amber', constellationLevel: 3 }]);
    expect(envelope.weapons).toEqual([
      { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 2 },
    ]);
  });

  it('omits server-managed timestamps, which no write path accepts', () => {
    const envelope = buildTransferEnvelope(
      snapshot({
        characters: { amber: makeCharacter('amber') } as Record<CharacterId, CollectionCharacter>,
      }),
      EXPORTED_AT,
    );

    expect(envelope.characters[0]).not.toHaveProperty('createdAt');
    expect(envelope.characters[0]).not.toHaveProperty('updatedAt');
  });

  it('drops teams nobody has filled in', () => {
    const envelope = buildTransferEnvelope(
      snapshot({
        teams: {
          1: makeTeam(1, { members: [{ characterId: 'amber' }, null, null, null] }),
          2: makeTeam(2),
          3: makeTeam(3),
          4: makeTeam(4),
        } as Record<TeamSlot, CollectionTeam>,
      }),
      EXPORTED_AT,
    );

    expect(envelope.teams).toHaveLength(1);
    expect(envelope.teams[0].slot).toBe(1);
  });

  it('keeps empty member positions so a team keeps its layout', () => {
    const envelope = buildTransferEnvelope(
      snapshot({
        teams: {
          1: makeTeam(1, { members: [null, { characterId: 'amber' }, null, null] }),
          2: makeTeam(2),
          3: makeTeam(3),
          4: makeTeam(4),
        } as Record<TeamSlot, CollectionTeam>,
      }),
      EXPORTED_AT,
    );

    expect(envelope.teams[0].members).toEqual([null, { characterId: 'amber' }, null, null]);
  });

  it('produces a file this build can read back', () => {
    const envelope = buildTransferEnvelope(
      snapshot({
        characters: { amber: makeCharacter('amber', 1) } as Record<
          CharacterId,
          CollectionCharacter
        >,
        weapons: {
          [WEAPON_ID]: makeWeapon(WEAPON_ID, 'mistsplitter-reforged'),
        } as Record<CollectionWeaponId, CollectionWeapon>,
        teams: {
          1: makeTeam(1, {
            members: [
              { characterId: 'amber', weaponInstanceId: WEAPON_ID as CollectionWeaponId },
              null,
              null,
              null,
            ],
          }),
          2: makeTeam(2),
          3: makeTeam(3),
          4: makeTeam(4),
        } as Record<TeamSlot, CollectionTeam>,
      }),
      EXPORTED_AT,
    );

    const result = parseTransferEnvelope(JSON.parse(serialiseEnvelope(envelope)));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.envelope).toEqual(envelope);
  });
});

describe('exportFilename', () => {
  it('strips punctuation the filesystem may reject from the timestamp', () => {
    expect(exportFilename(EXPORTED_AT)).toBe('genshin-collection-2026-08-01T12-00-00-000Z.json');
  });

  it('sorts chronologically by name', () => {
    const names = [
      exportFilename('2026-08-02T09:00:00.000Z'),
      exportFilename('2026-08-01T12:00:00.000Z'),
    ].sort();

    expect(names[0]).toContain('2026-08-01');
  });
});
