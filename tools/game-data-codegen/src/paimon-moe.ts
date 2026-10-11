// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { writeFile } from 'node:fs/promises';

import { renderModule } from './emit.js';
import { toKebabCase } from './slug.js';

const UPSTREAM_REPOSITORY = 'https://github.com/MadeBaruna/paimon-moe';

const UPSTREAM_BANNERS =
  'https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/banners.js';

/** Resolves from `src/` and `dist/` alike, since both sit one level down. */
const FIRST_BANNER_DATES_MODULE = new URL(
  '../src/first-banner-dates.generated.ts',
  import.meta.url,
);

/** The fields of a paimon-moe character banner that dating reads. */
export interface Banner {
  /** Local time, `YYYY-MM-DD HH:mm:ss`. */
  start: string;
  /** Featured five-star characters, as paimon-moe's snake_case ids. */
  featured: readonly string[];
  /** Featured four-star characters, as paimon-moe's snake_case ids. */
  featuredRare: readonly string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isBanner(value: unknown): value is Banner {
  return (
    typeof value === 'object' &&
    value !== null &&
    'start' in value &&
    typeof value.start === 'string' &&
    'featured' in value &&
    isStringArray(value.featured) &&
    'featuredRare' in value &&
    isStringArray(value.featuredRare)
  );
}

/**
 * The character banners in an evaluated `banners.js`.
 *
 * @throws Error when upstream has reshaped the module, so a refresh fails
 *   rather than writing a partial table.
 */
export function toCharacterBanners(module: unknown): Banner[] {
  if (
    typeof module === 'object' &&
    module !== null &&
    'banners' in module &&
    typeof module.banners === 'object' &&
    module.banners !== null &&
    'characters' in module.banners &&
    Array.isArray(module.banners.characters)
  ) {
    const characters: unknown[] = module.banners.characters;
    if (characters.every(isBanner)) return characters;
  }
  throw new Error(`${UPSTREAM_BANNERS} no longer exports character banners in a known shape`);
}

/** The start date of the first banner featuring each character, keyed by roster id. */
export function firstBannerDates(banners: readonly Banner[]): Map<string, string> {
  const firstBanner = new Map<string, string>();
  for (const banner of banners) {
    const date = banner.start.slice(0, 'YYYY-MM-DD'.length);
    for (const name of [...banner.featured, ...banner.featuredRare]) {
      const id = toKebabCase(name);
      const known = firstBanner.get(id);
      if (!known || date < known) firstBanner.set(id, date);
    }
  }
  return firstBanner;
}

/** Quotes only the keys that need it, which is how Prettier leaves them. */
function toKey(id: string): string {
  return /^[a-z]\w*$/.test(id) ? id : `'${id}'`;
}

/** One member per character, sorted by id. */
export function serializeFirstBannerDates(dates: ReadonlyMap<string, string>): string[] {
  return [...dates]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, date]) => `  ${toKey(id)}: '${date}',`);
}

/**
 * The character banners in paimon-moe's current `banners.js`.
 *
 * Evaluates the fetched file, which upstream publishes as a module rather
 * than as data.
 *
 * @throws Error when the fetch fails or upstream has reshaped the module.
 */
async function fetchCharacterBanners(): Promise<Banner[]> {
  const response = await fetch(UPSTREAM_BANNERS);
  if (!response.ok) {
    throw new Error(
      `Fetching ${UPSTREAM_BANNERS} failed: ${response.status} ${response.statusText}`,
    );
  }
  const source = Buffer.from(await response.text()).toString('base64');
  const module: unknown = await import(`data:text/javascript;base64,${source}`);
  return toCharacterBanners(module);
}

/**
 * Rewrite `first-banner-dates.generated.ts` from paimon-moe's current banner data.
 * Returns the number of characters dated.
 *
 * @throws Error when the fetch fails or upstream has reshaped the module.
 */
export async function generateFirstBannerDates(): Promise<number> {
  const dates = firstBannerDates(await fetchCharacterBanners());
  await writeFile(
    FIRST_BANNER_DATES_MODULE,
    renderModule({
      exportName: 'FIRST_BANNER_DATES',
      command: 'first-banner-dates',
      entries: serializeFirstBannerDates(dates),
      upstream: { copyright: '2021 Made Baruna', source: UPSTREAM_REPOSITORY },
    }),
  );
  return dates.size;
}
