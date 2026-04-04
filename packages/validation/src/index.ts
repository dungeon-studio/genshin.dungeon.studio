/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

export interface ValidationIssue {
  message: string;
  /** Dot-path to the offending field, e.g. `members[0].characterId`. */
  path?: string;
}

export function issue(message: string, path?: string): ValidationIssue {
  return { message, path };
}

export function isValid(issues: readonly ValidationIssue[]): boolean {
  return issues.length === 0;
}

/** Prefix all issue paths with a dot-separated prefix. */
export function prefixPaths(issues: readonly ValidationIssue[], prefix: string): ValidationIssue[] {
  return issues.map((i) => ({
    ...i,
    path: i.path ? `${prefix}.${i.path}` : prefix,
  }));
}
