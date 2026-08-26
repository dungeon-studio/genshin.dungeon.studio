// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';

interface VersionedRecord {
  name: string;
  version: string;
}

/**
 * Newest version first, with name breaking ties so a regeneration that changes
 * no data produces no diff.
 */
export function byVersionThenName(a: VersionedRecord, b: VersionedRecord): number {
  return compareVersions(b.version, a.version) || a.name.localeCompare(b.name);
}
