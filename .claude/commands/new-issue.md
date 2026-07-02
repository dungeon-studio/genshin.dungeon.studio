---
description: File a GitHub issue using the repository's issue templates
argument-hint: '[description]'
allowed-tools: Read, Bash, Grep, Glob
---

# New GitHub issue

Follow the workflow guardrails in
[`copilot-instructions.md`](../../.github/copilot-instructions.md).

Input: **$ARGUMENTS**

## Process

1. Search open and closed issues first (`gh search issues`) to avoid duplicates.
   If one already covers this outcome, update it instead of filing a new one.
2. Pick the matching template from `.github/ISSUE_TEMPLATE/`; the repository
   disables blank issues, so every issue uses one. Choose work item for planned
   development, feature request for a user-journey capability, or bug report for
   broken behavior. Fill every required field and follow the title guidance the
   template states.
3. Apply labels from the repository's current set (`gh label list`); don't
   guess names. Use at least one category and one area label when applicable.
4. Assign the active milestone when the issue fits its scope.
5. Link dependencies with native GitHub relationships (blocked by, is blocking),
   not body text or comments.
