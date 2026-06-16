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
