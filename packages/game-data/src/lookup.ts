// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Reads a catalogue record for the `getXById` helpers.
 *
 * The key type widens to `string`: those helpers are the runtime gate that
 * turns unvalidated input into a catalogue record, so they must accept IDs the
 * catalogue does not list.
 */
export function findById<T>(catalogue: Readonly<Record<string, T>>, id: string): T | undefined {
  return catalogue[id];
}
