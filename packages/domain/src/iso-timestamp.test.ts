// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { isISOTimestamp, nowTimestamp } from './iso-timestamp.js';

describe('isISOTimestamp', () => {
  it('accepts a valid UTC timestamp', () => {
    expect(isISOTimestamp('2024-01-15T12:30:00Z')).toBe(true);
  });

  it('accepts a timestamp with milliseconds', () => {
    expect(isISOTimestamp('2024-01-15T12:30:00.000Z')).toBe(true);
  });

  it('accepts a timestamp with positive offset', () => {
    expect(isISOTimestamp('2024-06-01T08:00:00+05:30')).toBe(true);
  });

  it('accepts a timestamp with negative offset', () => {
    expect(isISOTimestamp('2024-06-01T08:00:00-04:00')).toBe(true);
  });

  it('rejects a date-only string', () => {
    expect(isISOTimestamp('2024-01-15')).toBe(false);
  });

  it('rejects a timestamp without timezone', () => {
    expect(isISOTimestamp('2024-01-15T12:30:00')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isISOTimestamp('')).toBe(false);
  });

  it('rejects a non-string value', () => {
    expect(isISOTimestamp(123)).toBe(false);
  });

  it('rejects null', () => {
    expect(isISOTimestamp(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isISOTimestamp(undefined)).toBe(false);
  });

  it('rejects a semantically invalid date (month 13)', () => {
    expect(isISOTimestamp('2024-13-01T00:00:00Z')).toBe(false);
  });

  it('rejects a random string', () => {
    expect(isISOTimestamp('not-a-timestamp')).toBe(false);
  });
});

describe('nowTimestamp', () => {
  it('returns a valid ISOTimestamp', () => {
    const ts = nowTimestamp();
    expect(isISOTimestamp(ts)).toBe(true);
  });
});
