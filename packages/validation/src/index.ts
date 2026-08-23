/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * One thing wrong with a value, as a form would show it.
 *
 * Validators hand back a list of these rather than throwing, so a user sees
 * every problem at once instead of one per submission.
 */
export interface ValidationIssue {
  /** Shown to the user as written, so it names the value rather than the type. */
  message: string;
  /**
   * Dot-path to the offending field, such as `members[0].characterId`. Absent
   * when the whole value is at fault rather than one field of it.
   */
  path?: string;
}

export function issue(message: string, path?: string): ValidationIssue {
  return { message, path };
}

export function isValid(issues: readonly ValidationIssue[]): boolean {
  return issues.length === 0;
}

/**
 * Rewrites issues from a nested validator so their paths read from the
 * enclosing value.
 *
 * An issue with no path takes the prefix as its path, which turns "this plan is
 * wrong" into "`members[0].artifactPlan` is wrong". Copies rather than mutates,
 * so the nested validator's list stays usable on its own.
 */
export function prefixPaths(issues: readonly ValidationIssue[], prefix: string): ValidationIssue[] {
  if (prefix === '') return issues.map((i) => ({ ...i }));

  return issues.map((i) => ({
    ...i,
    path: i.path ? `${prefix}.${i.path}` : prefix,
  }));
}
