// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { buildResonances, type TextMap, type UpstreamResonance } from './resonances.js';

const COUNT_FIELDS = [
  'fireAvatarCount',
  'waterAvatarCount',
  'windAvatarCount',
  'electricAvatarCount',
  'grassAvatarCount',
  'iceAvatarCount',
  'rockAvatarCount',
];

function pair(id: number, field: string): UpstreamResonance {
  return {
    teamResonanceId: id,
    cond: 'TEAM_RESONANCE_COND_NONE',
    nameTextMapHash: id,
    descTextMapHash: id + 1000,
    ...Object.fromEntries(COUNT_FIELDS.map((f) => [f, f === field ? 2 : 0])),
  };
}

/** The shape upstream ships: one pair per element plus Protective Canopy. */
function upstream(): UpstreamResonance[] {
  return [
    ...COUNT_FIELDS.map((field, index) => pair(index + 1, field)),
    {
      teamResonanceId: 99,
      cond: 'TEAM_RESONANCE_COND_ALL_DIFFERENT',
      nameTextMapHash: 99,
      descTextMapHash: 1099,
      ...Object.fromEntries(COUNT_FIELDS.map((f) => [f, 0])),
    },
  ];
}

function textMapFor(records: readonly UpstreamResonance[]): TextMap {
  return Object.fromEntries(
    records.flatMap((r) => [
      [String(r.nameTextMapHash), `Resonance ${r.teamResonanceId}`],
      [String(r.descTextMapHash), `Effect ${r.teamResonanceId}`],
    ]),
  );
}

describe('buildResonances', () => {
  it('maps upstream counts and cond onto the condition union', () => {
    const records = upstream();
    const resonances = buildResonances(records, textMapFor(records));

    expect(resonances.map(({ condition }) => condition)).toEqual([
      { trigger: 'PAIR', element: 'Pyro' },
      { trigger: 'PAIR', element: 'Hydro' },
      { trigger: 'PAIR', element: 'Anemo' },
      { trigger: 'PAIR', element: 'Electro' },
      { trigger: 'PAIR', element: 'Dendro' },
      { trigger: 'PAIR', element: 'Cryo' },
      { trigger: 'PAIR', element: 'Geo' },
      { trigger: 'UNIQUE_ELEMENTS' },
    ]);
    expect(resonances[0]).toMatchObject({
      id: 'resonance-1',
      name: 'Resonance 1',
      description: 'Effect 1',
    });
  });

  it('rejects an element count field it has no mapping for', () => {
    const records = [...upstream(), { ...pair(50, 'fireAvatarCount'), moonAvatarCount: 2 }];

    expect(() => buildResonances(records, textMapFor(records))).toThrow(/moonAvatarCount/);
  });

  it('rejects a trigger the condition union cannot express', () => {
    const records = upstream().map((r) =>
      r.teamResonanceId === 1 ? { ...r, fireAvatarCount: 3 } : r,
    );

    expect(() => buildResonances(records, textMapFor(records))).toThrow(/Unrecognised trigger/);
  });

  it('rejects a roster missing an element', () => {
    const records = upstream().filter((r) => r.teamResonanceId !== 7);

    expect(() => buildResonances(records, textMapFor(records))).toThrow(/missing \["Geo"\]/);
  });

  it('rejects a record with no English text', () => {
    const records = upstream();
    const textMap = { ...textMapFor(records) };
    delete textMap['1001'];

    expect(() => buildResonances(records, textMap)).toThrow(/No English text/);
  });
});
