// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Slugify a Genshin name into a kebab-case id.
 *
 * Apostrophes are stripped rather than treated as word boundaries, so
 * "Wolf's Gravestone" becomes "wolfs-gravestone" — the established id
 * convention. Generic kebab-case helpers (lodash, change-case) split on the
 * apostrophe and would emit "wolf-s-gravestone", changing existing ids.
 */
export function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Slugifies a display name into the id its roster is keyed by.
 *
 * A name that slugifies to nothing means upstream data moved in a way the
 * roster can't represent, so generation aborts rather than emitting a record
 * no consumer can address. `noun` names the record kind in that error.
 */
export function toId(name: string, noun: string): string {
  const id = toKebabCase(name);
  if (!id) throw new Error(`Empty id for ${noun} "${name}"`);

  return id;
}
