<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Workflow conventions

Conventions for GitHub Actions workflows in `.github/workflows/`. For conventions covering the project's source, see [code conventions](code-conventions.md); to try a change before pushing it, see [run workflows locally](../how-tos/run-workflows-locally.md).

---

## Naming

A workflow file is named for _when_ it runs. Its jobs are named for _what_ they check, because the filename no longer carries that.

- `ci.yml` holds every sensor that runs on an integration event: a pull request, or a push to a long-lived branch.
- `daily.yml` and `weekly.yml` hold the scheduled checks, one file per cadence.
- A path-gated check keeps its own file, since "runs when these paths change" is a narrower when. Gate only when the setup is expensive, and share one `paths:` list across triggers with a YAML anchor (`paths: &paths`, then `paths: *paths`).

Workflows that mutate state outside the checkout are named for what they change instead: `deploy.yml`, `terraform-apply.yml`, `labels.yml`, `release-notes.yml`.

A new check lands as a job in the file matching its when. A new file needs a different when: a new trigger, a new cadence, or a path gate. Two jobs on different triggers belong in different files even when they serve the same purpose, since sharing a file forces each to guard itself against the other's events. Reusable (`workflow_call`) workflows sit outside the rule, since a caller decides when they run.

The rule and its rationale come from [architecture decision record 0004 in alunduil-chezmoi](https://github.com/alunduil/alunduil-chezmoi/blob/main/docs/adr/0004-consolidate-ci-workflow.md).

## Push triggers

A push run attests a branch after a merge lands, because the merge result itself was never tested. The set follows the [git-flow](https://nvie.com/posts/a-successful-git-branching-model/) branches whose merge result ships or gets inherited: `develop`, `main`, `release/*`, and `hotfix/*`. Feature branches are absent deliberately; the unfiltered `pull_request` trigger already gates them.

## Pinning tool versions

A tool installed in a workflow carries its version in a `*_VERSION` environment variable with a `# renovate:` annotation above it, so [`customManagers:githubActionsVersions`](https://docs.renovatebot.com/presets-customManagers/) tracks it. Download a release artifact at that version rather than piping an installer script from a moving branch, which pins nothing and hides the dependency from Renovate.
