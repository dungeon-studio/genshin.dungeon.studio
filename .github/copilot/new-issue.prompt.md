---
description: Create a well-structured GitHub issue with labels, milestone, and acceptance criteria
agent: agent
argument-hint: Brief description of the problem or feature
tools: ['githubRepo', 'codebase']
---

# New GitHub issue

Follow the workflow guardrails in
[Copilot instructions](../copilot-instructions.md).

## Inputs

- Description: `${input:description}`

## Title format

Write an outcome-oriented title that describes the desired end state, not the
task. Good titles read as statements that are true when the issue is done:

- "Clients integrate profile media types without negotiation failures"
- "Profile writes persist across API restarts in Firestore"
- "Terraform apply and deploy permissions use separate roles"

For bug reports, describe what went wrong:

- "Collection page shows a blank screen after adding a character"

## Choose the right template

The repository has three issue templates in `.github/ISSUE_TEMPLATE/`. Pick the
one that matches the intent:

| Template            | When to use                                                 |
| ------------------- | ----------------------------------------------------------- |
| **Work item**       | Planned development work ready to implement.                |
| **Feature request** | A new capability framed around a user journey.              |
| **Bug report**      | Something is broken: actual behavior differs from expected. |

Fill in every required field. Leave optional fields blank only when they truly
don't apply.

## Labels

Apply labels from the repository's label set. Use at least one category label
and one area label when applicable:

**Category**: `enhancement`, `bug`, `documentation`, `security`

**Area**: `web`, `api`, `game-data`, `types`, `infrastructure`, `terraform`,
`actions`, `devcontainer`, `authentication`, `database`, `ai`

**Other**: `dependencies`, `good first issue`, `accessibility`

## Milestone

Assign to the current active milestone when the issue fits its scope. Check
existing milestones before creating or assigning.

## Dependencies

Track issue dependencies only with native GitHub issue relationships
(`blocked by` / `is blocking`), not body text or comments. Use the sidebar
controls or `gh` CLI to link related issues.

## Before submitting

1. Search existing issues to avoid duplicates.
2. Verify the title is outcome-oriented or describes the problem directly.
3. Verify required fields are specific, not vague.
4. Assign appropriate labels and milestone.
