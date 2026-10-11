<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Workflow conventions

Conventions for GitHub Actions workflows in `.github/workflows/` and the pre-commit hooks they run. For why the conventions take this shape, see [Understanding workflow conventions](../explanation/understanding-workflow-conventions.md). To run a job without pushing, see [Run workflows locally](../how-tos/run-workflows-locally.md). For conventions covering the project's source, see [code conventions](code-conventions.md).

---

## Where a check runs

| A check that depends on     | Runs as         | Examples                                                         |
| --------------------------- | --------------- | ---------------------------------------------------------------- |
| Only the working tree       | Pre-commit hook | Linters, formatters, type checks, static scans                   |
| Execution                   | Workflow job    | Tests, end-to-end runs, container builds                         |
| Another revision            | Workflow job    | Coverage and schema compatibility, which compare with the base   |
| The network or a credential | Workflow job    | Online workflow audits, verified secret scanning, external links |

Adding a hook needs no workflow change.

A tool whose checks fall on both sides runs in both places. zizmor audits offline in a hook and online in `ci.yml`. lychee checks internal links in a hook and external links in `weekly.yml`.

## Naming

A workflow file is named for _when_ it runs:

- `ci.yml` holds every sensor that runs on an integration event: a pull request, or a push to a long-lived branch.
- `daily.yml` and `weekly.yml` hold the scheduled checks, one file per cadence.
- A path-gated check has its own file. Only a check with expensive setup has a path gate, and its triggers share one `paths:` list through a YAML anchor (`paths: &paths`, then `paths: *paths`).

Workflows that mutate state outside the checkout are named for what they change: `deploy.yml`, `terraform-apply.yml`, `labels.yml`, `release-notes.yml`.

A new check is a job in the file matching its when. A new file means a different when: a new trigger, a new cadence, or a path gate. Jobs on different triggers sit in different files, even when they serve the same purpose. Reusable (`workflow_call`) workflows are exempt, since a caller decides when they run.

A job is named for _what_ it checks: the action and its subject, such as `Plan dev infrastructure`, never a bare environment name. Job names are unique across every workflow.

## Required checks

The `develop` ruleset is the authoritative list of checks that block a merge. A required check matches a check run by name, which comes from the job's `name:` rather than its id.

- Renaming a required job blocks every pull request until the ruleset names the new check.
- A path-gated workflow is never required.
- The GitHub-managed `Analyze` runs aren't required. The ruleset gates code scanning and Code Quality findings through its own rules.

## Push triggers

Sensor workflows run on a push to the [git-flow](https://nvie.com/posts/a-successful-git-branching-model/) branches whose merge result ships or gets inherited: `develop`, `main`, `release/*`, and `hotfix/*`. Feature branches have no push trigger.

## Pinning tool versions

A tool installed in a workflow carries its version in a `*_VERSION` environment variable with a `# renovate:` annotation above it, so [`customManagers:githubActionsVersions`](https://docs.renovatebot.com/presets-customManagers/) tracks it. The install step downloads a release artifact at that version.
