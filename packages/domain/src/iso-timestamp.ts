/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

export type ISOTimestamp = string & { readonly [__brand]: 'ISOTimestamp' };

// Structural check: ISO 8601 date-time with required time and offset.
// Field ranges (month 13, hour 25, leap second): delegated to Date.parse.
const ISO_8601_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Date.parse bounds the day to 01-31, but a day the month does not have rolls
// forward rather than failing — 2024-02-30 lands in March. Such a date is only
// real if it survives a UTC round-trip unchanged. Built with setUTCFullYear
// rather than Date.UTC, which maps years 0-99 into the 1900s.
function isRealCalendarDate(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);

  const roundTrip = new Date(0);
  roundTrip.setUTCFullYear(year, month - 1, day);

  return roundTrip.toISOString().startsWith(date);
}

export function isISOTimestamp(value: unknown): value is ISOTimestamp {
  if (typeof value !== 'string') return false;

  const parts = ISO_8601_DATE_TIME.exec(value);
  if (parts === null || Number.isNaN(Date.parse(value))) return false;

  return isRealCalendarDate(parts[1]);
}

export function nowTimestamp(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}
