/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

/**
 * An ISO 8601 date-time carrying an explicit UTC offset.
 *
 * The repository stores timestamps as strings of this type rather than as
 * `Date`, so a value survives a round trip through Firestore and JSON without
 * a parse step deciding what its offset means.
 */
export type ISOTimestamp = string & { readonly [__brand]: 'ISOTimestamp' };

// Structural check: ISO 8601 date-time with required time and offset.
// Field ranges (month 13, hour 25, leap second): delegated to Date.parse.
const ISO_8601_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Date.parse bounds the day to 01-31, but a day the month does not have rolls
// forward instead of failing: 2024-02-30 becomes 1 March. Date.UTC would be
// shorter but maps years 0-99 into the 1900s.
function isRealCalendarDate(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);

  const roundTrip = new Date(0);
  roundTrip.setUTCFullYear(year, month - 1, day);

  return roundTrip.toISOString().startsWith(date);
}

/**
 * Whether a value is a date-time this repository will store.
 *
 * Narrower than `Date.parse`, which accepts far more than ISO 8601. Seconds and
 * an offset are both required, so `2024-01-01T00:00Z` and `2024-01-01T00:00:00`
 * are rejected along with a calendar date no month has.
 */
export function isISOTimestamp(value: unknown): value is ISOTimestamp {
  if (typeof value !== 'string') return false;

  const parts = ISO_8601_DATE_TIME.exec(value);
  if (parts === null || Number.isNaN(Date.parse(value))) return false;

  return isRealCalendarDate(parts[1]);
}

/** The current instant in UTC, to millisecond precision. */
export function nowTimestamp(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}
