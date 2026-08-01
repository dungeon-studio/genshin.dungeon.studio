/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

export type UUID = string & { readonly [__brand]: 'UUID' };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accepts the canonical 8-4-4-4-12 hex form in either case, and nothing else —
 * no surrounding braces, no `urn:uuid:` prefix.
 */
export function isUUID(value: unknown): value is UUID {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
