---
description: Create a well-structured GitHub issue with labels, milestone, and acceptance criteria
argument-hint: '[description]'
allowed-tools: Read, Bash, Grep, Glob
---

# New GitHub issue

Follow the workflow guardrails in
[`copilot-instructions.md`](../../.github/copilot-instructions.md).

## Inputs

- Description: **$ARGUMENTS**

## Title convention (the most important rule)

Write the title as a statement that's true when the issue is done. Describe the
desired end state, not the task:

- "Clients integrate profile media types without negotiation failures"
- "Profile writes persist across API restarts in Firestore"
- "Terraform apply and deploy permissions use separate roles"

For bug reports, describe what went wrong instead:

- "Collection page shows a blank screen after adding a character"

## Choose the right template

The repository has three issue templates in `.github/ISSUE_TEMPLATE/`. Pick the
one that matches the intent:

| Template        | When to use                                                 |
| --------------- | ----------------------------------------------------------- |
| Work item       | Planned development work ready to implement.                |
| Feature request | A new capability framed around a user journey.              |
| Bug report      | Something is broken: actual behavior differs from expected. |

Fill in every required field. Leave optional fields blank only when they truly
don't apply.

## Labels

Apply at least one category label and one area label when applicable:

- Category: `enhancement`, `bug`, `documentation`, `security`
- Area: `web`, `api`, `game-data`, `types`, `infrastructure`, `terraform`,
  `actions`, `devcontainer`, `authentication`, `database`, `ai`
- Other: `dependencies`, `good first issue`, `accessibility`

## Milestone

Assign to the current active milestone when the issue fits its scope. Check
existing milestones before assigning.

## Dependencies

Track issue dependencies only with native GitHub issue relationships
(`blocked by` and `is blocking`), not body text or comments. Use the GitHub UI
or the `gh` CLI to link related issues.

## Before submitting

1. Search existing issues with `gh search issues` to avoid duplicates.
2. Verify the title reads as a statement that's true when done, or describes
   the problem directly for bugs.
3. Verify required fields are specific, not vague.
4. Assign appropriate labels and a milestone.
