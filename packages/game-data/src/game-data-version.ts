// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ARTIFACT_SET_ROSTER } from './artifacts.js';
import { CHARACTER_ROSTER } from './characters.js';
import { latestVersion } from './versions.js';
import { WEAPON_ROSTER } from './weapons.js';

/** The game version the static data in this package covers: the newest version any record carries. */
export const GAME_DATA_VERSION = latestVersion(
  [...CHARACTER_ROSTER, ...WEAPON_ROSTER, ...ARTIFACT_SET_ROSTER].map((record) => record.version),
);
