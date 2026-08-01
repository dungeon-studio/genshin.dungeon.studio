/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

export type UUID = string & { readonly [__brand]: 'UUID' };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Narrow an untrusted value to a UUID.
 *
 * Instance identifiers double as Firestore document ids, so anything reaching a
 * write path from a client — rather than from `randomUUID()` — has to be
 * checked before it names a document.
 */
export function isUUID(value: unknown): value is UUID {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
