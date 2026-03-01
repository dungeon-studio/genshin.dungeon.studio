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

For bug fixes, prefix with the conventional commit type:

- "fix(web): Collection page no longer crashes on empty data"

## Issue body structure

Use this template:

```markdown
## Summary

One or two sentences describing what this issue delivers.

## Why

Explain the motivation: what problem exists, what opportunity this creates,
or what dependency requires it.

## Scope

Bullet list of concrete changes required. Be specific enough that a
contributor can start without ambiguity.

## Acceptance criteria

Measurable conditions that must be true when this issue is done. Use
checkboxes:

- [ ] Criterion one
- [ ] Criterion two
- [ ] Typecheck and lint pass
```

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
2. Verify the title is outcome-oriented, not task-oriented.
3. Verify acceptance criteria are measurable, not vague.
4. Assign appropriate labels and milestone.
