// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Luna versions map to [major, minor] tuples in the 6.x series (after 5.x, the last numeric era).
const LUNA_VERSIONS = new Map<string, readonly [number, number]>([
  ['Luna I', [6, 0]],
  ['Luna II', [6, 1]],
  ['Luna III', [6, 2]],
  ['Luna IV', [6, 3]],
]);

function versionTuple(version: string): readonly [number, number] {
  const luna = LUNA_VERSIONS.get(version);
  if (luna !== undefined) return luna;

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
 * Orders game versions written either way.
 *
 * The game brands its 6.x releases `Luna I` onward while this package's data
 * records them as `6.0` onward, so a caller may hold a version in either form
 * and a plain string sort would misplace the named ones. Only the Luna names
 * the table maps are understood, so a new one has to be added there.
 *
 * @throws Error on a string that is neither a mapped Luna name nor `major` or
 * `major.minor`.
 */
export function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor] = versionTuple(a);
  const [bMajor, bMinor] = versionTuple(b);
  return aMajor - bMajor || aMinor - bMinor;
}

/**
 * The newest of the given versions, by {@link compareVersions}.
 *
 * @throws TypeError on an empty list.
 */
export function latestVersion(versions: readonly string[]): string {
  return versions.reduce((latest, version) =>
    compareVersions(version, latest) > 0 ? version : latest,
  );
}
