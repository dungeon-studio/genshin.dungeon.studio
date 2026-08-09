<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Run workflows locally

[act](https://github.com/nektos/act) runs the jobs in `.github/workflows/` on a
local Docker daemon. Reach for it when you change a workflow itself—the job
graph, an `if:` condition, what a composite action feeds the step after it—and
want an answer before pushing.

When you want a check's _result_ rather than its wiring, run the command the job
runs. `pre-commit run --all-files`, `pnpm turbo run typecheck test build`, and
`pnpm turbo run test:e2e` are the same checks without the container around them,
and they finish sooner.

## Prerequisites

The DevContainer installs act and already exposes the host Docker socket.
Elsewhere, follow the
[act installation instructions](https://nektosact.com/installation/) and confirm
`docker info` succeeds.

`.actrc` in the repository root names the runner image, so act won't ask you to
pick one. The first run pulls it, about 1.6 GB.

## List the jobs act sees

```bash
act -l
```

`-j` takes the job ID from the left column, not the display name beside it.

## Run one job

```bash
act push -j workspace
```

The event argument decides which jobs exist: `schema-compat` carries
`if: github.event_name == 'pull_request'`, so only
`act pull_request -j schema-compat` runs it.

## Check the wiring without running it

```bash
act push -n
```

A dry run resolves the job graph, the `if:` conditions, and every `uses:`
reference without starting a step—the whole question most workflow edits raise.

## Pass a secret

`workspace` and `e2e` finish their Codecov upload once you hand act a token:

```bash
act push -j workspace -s CODECOV_TOKEN
```

With no value attached, act prompts for one. `--secret-file` reads several at
once. Keep that file outside the repository.

## What can't work locally

No secret unlocks a step that wants a service only GitHub's own runners reach:

- SARIF uploads to the Security tab, in the `trivy-*` and `workflow-audit` jobs
- `cache-from: type=gha` in `container`, which wants the Actions cache service
- `deploy.yml` and the Terraform workflows, which reach Google Cloud through
  workload identity federation
- the scheduled and repository-management workflows, which act on repository
  state through the GitHub API

Every step before the failing one still runs, and that's usually the part under
test.

## Gotchas

act copies the working tree into the job container rather than mounting it, and
a [linked worktree](https://git-scm.com/docs/git-worktree) stores `.git` as a
file pointing at the main checkout. That path doesn't exist inside the
container, so any step shelling out to git fails there. `verify-build-output.sh`
is the one such step in `ci.yml` today. Run act from the main checkout when you
need it.

Inside the DevContainer, act's job containers are siblings of it on the host
daemon rather than children. Leave the copy-in behaviour alone: `--bind` mounts
the workspace by its path on the host, which isn't where the DevContainer sees
it.
