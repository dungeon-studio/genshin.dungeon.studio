// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { ELEMENTAL_RESONANCES, getActiveResonances } from './resonances.js';

describe('getActiveResonances', () => {
  it('activates a resonance for a duplicated element', () => {
    expect(getActiveResonances(['Pyro', 'Pyro', 'Geo', 'Anemo'])).toStrictEqual([
      ELEMENTAL_RESONANCES.FERVENT_FLAMES,
    ]);
  });

  it('activates every resonance a party qualifies for', () => {
    expect(getActiveResonances(['Pyro', 'Pyro', 'Hydro', 'Hydro'])).toStrictEqual([
      ELEMENTAL_RESONANCES.FERVENT_FLAMES,
      ELEMENTAL_RESONANCES.SOOTHING_WATER,
    ]);
  });

  it('activates a resonance past its second copy of the element', () => {
    expect(getActiveResonances(['Cryo', 'Cryo', 'Cryo', 'Cryo'])).toStrictEqual([
      ELEMENTAL_RESONANCES.SHATTERING_ICE,
    ]);
  });

  it('ignores the order elements arrive in', () => {
    expect(getActiveResonances(['Pyro', 'Geo', 'Anemo', 'Pyro'])).toStrictEqual(
      getActiveResonances(['Pyro', 'Pyro', 'Geo', 'Anemo']),
    );
  });

  it('activates Protective Canopy only when all four elements differ', () => {
    expect(getActiveResonances(['Pyro', 'Hydro', 'Electro', 'Cryo'])).toStrictEqual([
      ELEMENTAL_RESONANCES.PROTECTIVE_CANOPY,
    ]);
  });

  it('resonates with nothing on an incomplete party', () => {
    expect(getActiveResonances(['Pyro', 'Pyro', 'Hydro'])).toStrictEqual([]);
  });
});
