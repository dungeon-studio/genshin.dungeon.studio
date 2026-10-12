// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * A game release.
 *
 * The game brands its 6.x releases `Luna I` onward, but this package records
 * them numerically like every other release.
 */
export interface GameVersion {
  readonly major: number;
  readonly minor: number;
}

/** Orders game versions oldest first. */
export function compareVersions(a: GameVersion, b: GameVersion): number {
  return a.major - b.major || a.minor - b.minor;
}

/** @throws TypeError on an empty list. */
export function latestVersion(versions: readonly GameVersion[]): GameVersion {
  return versions.reduce((latest, version) =>
    compareVersions(version, latest) > 0 ? version : latest,
  );
}

/** Writes a version the way the game's patch notes do, such as `5.8`. */
export function formatVersion(version: GameVersion): string {
  return `${version.major}.${version.minor}`;
}
