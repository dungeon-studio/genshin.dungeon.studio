// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { GameVersion } from '@genshin/game-data';

/** @throws Error naming the record whose version isn't `major.minor`. */
export function toGameVersion(value: string, subject: string): GameVersion {
  const match = /^(\d+)\.(\d+)$/.exec(value);
  if (!match) throw new Error(`Unknown version "${value}" for ${subject}`);

  return { major: Number(match[1]), minor: Number(match[2]) };
}

export function serializeVersion(version: GameVersion): string {
  return `{ major: ${version.major}, minor: ${version.minor} }`;
}
