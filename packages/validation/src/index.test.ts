// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import type { ValidationIssue } from './index.js';
import { issue, isValid, prefixPaths } from './index.js';

describe('issue', () => {
  it('creates a ValidationIssue with message only', () => {
    const result = issue('something went wrong');

    expect(result).toEqual({ message: 'something went wrong' });
  });

  it('creates a ValidationIssue with message and path', () => {
    const result = issue('invalid value', 'members[0].characterId');

    expect(result).toEqual({ message: 'invalid value', path: 'members[0].characterId' });
  });

  it('sets path to undefined when omitted', () => {
    const result = issue('missing field');

    expect(result.path).toBeUndefined();
  });
});

describe('isValid', () => {
  it('returns true for an empty array', () => {
    expect(isValid([])).toBe(true);
  });

  it('returns false for a non-empty array', () => {
    const issues: ValidationIssue[] = [{ message: 'bad' }];

    expect(isValid(issues)).toBe(false);
  });

  it('returns false for multiple issues', () => {
    const issues: ValidationIssue[] = [{ message: 'first' }, { message: 'second' }];

    expect(isValid(issues)).toBe(false);
  });
});

describe('prefixPaths', () => {
  it('prepends prefix to existing paths with dot separator', () => {
    const issues: ValidationIssue[] = [{ message: 'bad', path: 'characterId' }];

    const result = prefixPaths(issues, 'members[0]');

    expect(result).toEqual([{ message: 'bad', path: 'members[0].characterId' }]);
  });

  it('sets prefix as path when path is absent', () => {
    const issues: ValidationIssue[] = [{ message: 'missing' }];

    const result = prefixPaths(issues, 'team');

    expect(result).toEqual([{ message: 'missing', path: 'team' }]);
  });

  it('returns an empty array when given no issues', () => {
    expect(prefixPaths([], 'prefix')).toEqual([]);
  });

  it('handles multiple issues', () => {
    const issues: ValidationIssue[] = [{ message: 'first', path: 'a' }, { message: 'second' }];

    const result = prefixPaths(issues, 'root');

    expect(result).toEqual([
      { message: 'first', path: 'root.a' },
      { message: 'second', path: 'root' },
    ]);
  });

  it('copies issues without modifying paths when prefix is empty', () => {
    const issues: ValidationIssue[] = [{ message: 'err', path: 'field' }];

    const result = prefixPaths(issues, '');

    expect(result).toEqual([{ message: 'err', path: 'field' }]);
    expect(result[0]).not.toBe(issues[0]);
  });
});
