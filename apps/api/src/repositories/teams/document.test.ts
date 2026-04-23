// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { CURRENT_VERSION, fromDocument, toDocument, type V1Team, type V0Team } from './document.js';

const TIMESTAMP = '2024-01-15T12:00:00.000Z';

function makeV1Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    schemaVersion: 1 as const,
    name: 'My Team',
    members: [{ characterId: 'columbina' }, null, null, null],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V1Team;
  return { ...base, ...overrides };
}

function makeV0Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    name: 'Old Team',
    members: [null, null, null, null],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V0Team;
  return { ...base, ...overrides };
}

describe('fromDocument', () => {
  it('migrates a v0 document (no schemaVersion)', () => {
    const team = fromDocument(2, makeV0Document());
    expect(team.slot).toBe(2);
    expect(team.name).toBe('Old Team');
  });

  it('migrates primaryStats → priorityMinorAffixes in v0 artifact plans', () => {
    const team = fromDocument(
      1,
      makeV0Document({
        members: [
          {
            characterId: 'columbina',
            artifactPlan: {
              primaryStats: ['crit-rate', 'crit-damage'],
              secondaryStats: ['elemental-mastery'],
            },
          },
          null,
          null,
          null,
        ],
      }),
    );
    expect(team.members[0]?.artifactPlan?.priorityMinorAffixes).toEqual([
      'crit-rate',
      'crit-damage',
    ]);
    expect(team.members[0]?.artifactPlan?.secondaryMinorAffixes).toEqual(['elemental-mastery']);
    expect(team.members[0]?.artifactPlan).not.toHaveProperty('primaryStats');
    expect(team.members[0]?.artifactPlan).not.toHaveProperty('secondaryStats');
  });

  it('preserves priorityMinorAffixes in v0 artifact plans that already use new names', () => {
    const team = fromDocument(
      1,
      makeV0Document({
        name: 'Team',
        members: [
          { characterId: 'columbina', artifactPlan: { priorityMinorAffixes: ['crit-rate'] } },
          null,
          null,
          null,
        ],
      }),
    );
    expect(team.members[0]?.artifactPlan?.priorityMinorAffixes).toEqual(['crit-rate']);
  });

  it('throws for too many members', () => {
    expect(() =>
      fromDocument(1, makeV1Document({ members: [null, null, null, null, null] })),
    ).toThrow(TypeError);
  });

  it('includes optional description', () => {
    const team = fromDocument(1, makeV1Document({ description: 'My best team' }));
    expect(team.description).toBe('My best team');
  });
});

describe('toDocument', () => {
  it('stamps the current schema version', () => {
    const team = fromDocument(1, makeV1Document());
    const doc = toDocument(team);
    expect(doc.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('round-trips a team through toDocument then fromDocument', () => {
    const team = fromDocument(1, makeV1Document());
    const doc = toDocument(team);
    const restored = fromDocument(1, doc as unknown as Record<string, unknown>);
    expect(restored).toEqual(team);
  });
});
