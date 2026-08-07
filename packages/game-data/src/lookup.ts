// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Indexes catalogue records for the `getXById` helpers.
 *
 * Keyed by plain `string` rather than the record's own ID type: those helpers
 * are the runtime gate that turns unvalidated input into a catalogue record, so
 * they have to accept IDs the catalogue does not list.
 */
export function indexById<T extends { readonly id: string }>(
  records: readonly T[],
): ReadonlyMap<string, T> {
  return new Map<string, T>(records.map((record) => [record.id, record]));
}
