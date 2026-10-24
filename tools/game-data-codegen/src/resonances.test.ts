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

/** One upstream record, with a count of two on `pairField` and zero elsewhere. */
function record(id: number, cond: string, pairField?: string): UpstreamResonance {
  return {
    teamResonanceId: id,
    cond,
    nameTextMapHash: id,
    descTextMapHash: id + 1000,
    ...Object.fromEntries(COUNT_FIELDS.map((field) => [field, field === pairField ? 2 : 0])),
  };
}

/** The shape upstream ships: one pair per element plus Protective Canopy. */
function upstream(): UpstreamResonance[] {
  return [
    ...COUNT_FIELDS.map((field, index) => record(index + 1, 'TEAM_RESONANCE_COND_NONE', field)),
    record(99, 'TEAM_RESONANCE_COND_ALL_DIFFERENT'),
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

  it('reads records that omit default-valued fields', () => {
    const records = upstream();
    const sparse = records.map((r) =>
      Object.fromEntries(
        Object.entries(r).filter(
          ([, value]) => value !== 0 && value !== 'TEAM_RESONANCE_COND_NONE',
        ),
      ),
    );

    expect(buildResonances(sparse, textMapFor(records))).toEqual(
      buildResonances(records, textMapFor(records)),
    );
  });

  it('rejects records upstream has reshaped', () => {
    const records = upstream().map(({ nameTextMapHash: _, ...rest }) => rest);

    expect(() => buildResonances(records, {})).toThrow(/no longer holds records/);
  });

  it('rejects an element count field it has no mapping for', () => {
    const records = [
      ...upstream(),
      { ...record(50, 'TEAM_RESONANCE_COND_NONE', 'fireAvatarCount'), moonAvatarCount: 2 },
    ];

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
    const { '1001': _, ...textMap } = textMapFor(records);

    expect(() => buildResonances(records, textMap)).toThrow(/No English text/);
  });
});
