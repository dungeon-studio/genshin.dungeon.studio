/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

export type ISOTimestamp = string & { readonly [__brand]: 'ISOTimestamp' };

// Structural check: ISO 8601 date-time with required time and offset.
// Semantic check (e.g. month 13): delegated to Date.parse.
const ISO_8601_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function isISOTimestamp(value: unknown): value is ISOTimestamp {
  if (typeof value !== 'string') return false;

  const parts = ISO_8601_DATE_TIME.exec(value);
  if (parts === null || Number.isNaN(Date.parse(value))) return false;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);

  // Date.parse rolls an impossible day forward (2024-02-30 lands in March)
  // instead of failing, so the calendar date has to survive a UTC round-trip.
  // setUTCFullYear rather than Date.UTC, which maps years 0-99 into the 1900s.
  const roundTrip = new Date(0);
  roundTrip.setUTCFullYear(year, month - 1, day);

  return (
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day
  );
}

export function nowTimestamp(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}
