// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Field-level assertion primitives shared by the `assertCollection*` guards.
 *
 * Each takes the value and the dotted path it sits at, so a guard on a nested
 * structure reports the position that failed rather than the outermost type.
 */

export function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${path} must be a string, got: ${JSON.stringify(value)}`);
  }
}

export function assertOptionalString(value: unknown, path: string): void {
  if (value !== undefined) assertString(value, path);
}

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
