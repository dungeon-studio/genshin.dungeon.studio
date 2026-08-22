<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Workflow conventions

Conventions for GitHub Actions workflows in `.github/workflows/`. For conventions covering the project's source, see [code conventions](code-conventions.md).

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

## Trying a change locally

[act](https://github.com/nektos/act) runs these jobs on a local Docker daemon, so `act push -j workspace` answers a question about the wiring—the job graph, an `if:` condition, what a composite action hands the step after it—without pushing first. The event argument selects the jobs, so a pull-request-gated job like `schema-compat` needs `act pull_request`. For a check's result rather than its wiring, run the command the job runs: `pre-commit run --all-files` and `pnpm turbo run typecheck test build verify` finish sooner outside a container. The DevContainer installs act, and `.actrc` names the runner image so it won't prompt for one.

No secret unlocks a step that wants a service only GitHub's runners reach: SARIF uploads to the Security tab, `cache-from: type=gha`, the Google Cloud deployments behind workload identity federation, and the workflows that act on repository state through the GitHub API. A step wanting nothing more than a secret does run, so `act push -j workspace -s CODECOV_TOKEN` completes the Codecov upload. Every step before a failing one still runs, which is usually the part under test.

Two surprises are worth knowing before the first run. act copies the working tree into the job container rather than mounting it, and a [linked worktree](https://git-scm.com/docs/git-worktree) stores `.git` as a file pointing at the main checkout, so a step shelling out to git fails unless act runs from that checkout. Inside the DevContainer, act's job containers are siblings of it on the host daemon rather than children, so leave the copy-in behaviour alone: `--bind` mounts the workspace by its path on the host.
