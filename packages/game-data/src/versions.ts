// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/** The game version the static data in this package covers. */
export const GAME_DATA_VERSION = 'Luna IV';

// Luna versions map to [major, minor] tuples in the 6.x series (after 5.x, the last numeric era).
const LUNA_VERSIONS: Record<string, readonly [number, number]> = {
  'Luna I': [6, 0],
  'Luna II': [6, 1],
  'Luna III': [6, 2],
  'Luna IV': [6, 3],
};

function versionTuple(version: string): readonly [number, number] {
  if (Object.hasOwn(LUNA_VERSIONS, version)) return LUNA_VERSIONS[version];

  const parts = version.split('.');
  if (parts.length > 2) {
    throw new Error(`Invalid version string: "${version}"`);
  }

  const [majorRaw, minorRaw] = parts;
  if (!majorRaw || (minorRaw !== undefined && minorRaw === '')) {
    throw new Error(`Invalid version string: "${version}"`);
  }

  const major = Number(majorRaw);
  const minor = minorRaw === undefined ? 0 : Number(minorRaw);

  if (Number.isNaN(major) || Number.isNaN(minor)) {
    throw new Error(`Invalid version string: "${version}"`);
  }

  return [major, minor];
}

/**
 * Compare two version strings for sorting.
 * Returns negative if a comes before b, positive if after, zero if equal.
 */
export function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor] = versionTuple(a);
  const [bMajor, bMinor] = versionTuple(b);
  return aMajor - bMajor || aMinor - bMinor;
}
