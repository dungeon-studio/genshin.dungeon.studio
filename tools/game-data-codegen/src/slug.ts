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
 * Builds the id assigner for one roster, remembering the names it has seen.
 *
 * Ids are slugs of display names, so a collision (or a name that slugifies to
 * nothing) means upstream data moved in a way the roster can't represent.
 * Both abort generation rather than silently dropping a record. `noun` names
 * the record kind in those errors, e.g. `weapon`.
 */
export function createIdAssigner(noun: string): (name: string) => string {
  const nameById = new Map<string, string>();

  return (name) => {
    const id = toKebabCase(name);
    if (!id) throw new Error(`Empty id for ${noun} "${name}"`);

    const collision = nameById.get(id);
    if (collision) {
      throw new Error(`Duplicate ${noun} id "${id}" from "${collision}" and "${name}"`);
    }
    nameById.set(id, name);

    return id;
  };
}
