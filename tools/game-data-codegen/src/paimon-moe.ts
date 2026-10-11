// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { writeFile } from 'node:fs/promises';

import type { Banner } from '../vendor/paimon-moe/banners.js';
import { banners } from '../vendor/paimon-moe/banners.js';

export type { Banner };

const UPSTREAM_BANNERS =
  'https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/banners.js';

const BANNER_SNAPSHOT = new URL('../vendor/paimon-moe/banners.js', import.meta.url);

/** Character event banners from the vendored paimon-moe snapshot. */
export const characterBanners: readonly Banner[] = banners.characters;

/** Replace the vendored snapshot with paimon-moe's current banner data. */
export async function fetchBanners(): Promise<void> {
  const response = await fetch(UPSTREAM_BANNERS);
  if (!response.ok) {
    throw new Error(
      `Fetching ${UPSTREAM_BANNERS} failed: ${response.status} ${response.statusText}`,
    );
  }
  await writeFile(BANNER_SNAPSHOT, await response.text());
}
