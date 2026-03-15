/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

export type ISOTimestamp = string & { readonly [__brand]: 'ISOTimestamp' };

// Structural check: ISO 8601 date-time with required time and offset.
// Semantic check (e.g. month 13): delegated to Date.parse.
const ISO_8601_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function isISOTimestamp(value: unknown): value is ISOTimestamp {
  return (
    typeof value === 'string' && ISO_8601_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value))
  );
}
