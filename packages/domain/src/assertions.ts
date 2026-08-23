// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Field-level assertion primitives shared by the `assertCollection*` guards.
 *
 * Passing the path in is what lets a guard over a nested structure report the
 * position that failed, such as `CollectionTeam.members[0].artifactPlan.sets`,
 * rather than the outermost type.
 */

export function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${path} must be a string, got: ${JSON.stringify(value)}`);
  }
}

export function assertOptionalString(value: unknown, path: string): void {
  if (value !== undefined) assertString(value, path);
}

/**
 * Asserts an absent value, or an array of strings whose length falls within an
 * inclusive range.
 *
 * An absent value skips the range entirely, so a caller wanting to require the
 * field has to check for it separately. A failure reports the index that broke,
 * not the array.
 */
export function assertOptionalStringArray(
  value: unknown,
  path: string,
  min: number,
  max: number,
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be an array, got: ${JSON.stringify(value)}`);
  }
  if (value.length < min || value.length > max) {
    throw new TypeError(
      `${path} must have between ${min} and ${max} elements, got: ${value.length}`,
    );
  }
  value.forEach((element, index) => {
    assertString(element, `${path}[${index}]`);
  });
}
