// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Luna versions map to [major, minor] tuples in the 6.x series (after 5.x, the last numeric era).
const LUNA_VERSIONS: Record<string, readonly [number, number]> = {
  'Luna I': [6, 0],
  'Luna II': [6, 1],
  'Luna III': [6, 2],
  'Luna IV': [6, 3],
};

function versionTuple(version: string): readonly [number, number] {
  if (version in LUNA_VERSIONS) return LUNA_VERSIONS[version];
  const [major, minor] = version.split('.').map(Number);
  return [major, minor ?? 0];
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
