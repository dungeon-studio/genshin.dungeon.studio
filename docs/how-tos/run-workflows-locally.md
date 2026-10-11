<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Run workflows locally

This guide runs a workflow job on your own machine with [act](https://github.com/nektos/act), to test its wiring without pushing first. Wiring means the job graph, an `if:` condition, or what a composite action hands the step after it.

For a check's result rather than its wiring, run the command the job runs instead: `pre-commit run --all-files` and `pnpm turbo run typecheck test build verify` finish sooner outside a container.

For which workflow holds which job, see [Workflow conventions](../reference/workflow-conventions.md).

---

## Before you start

The DevContainer installs act, and `.actrc` names the runner image so act won't prompt for one. act runs jobs on a local Docker daemon.

Run act from the main checkout, not a [linked worktree](https://git-scm.com/docs/git-worktree). act copies the working tree into the job container, and a linked worktree stores `.git` as a file pointing at the main checkout, so any step shelling out to git fails.

Inside the DevContainer, leave act's copy-in behaviour alone. act's job containers are siblings of the DevContainer on the host daemon, so `--bind` mounts the workspace by its path on the host.

## 1) Run a job

Name the event and the job:

```bash
act push -j workspace
```

The event selects which jobs exist. A job gated on pull requests, like `schema-compat`, needs `act pull_request`.

## 2) Pass a secret a step needs

```bash
act push -j workspace -s CODECOV_TOKEN
```

A step needing nothing more than a secret then runs. This one completes the Codecov upload.

## Steps that can't run locally

No secret unlocks a step that needs a service only GitHub's runners reach:

- SARIF uploads to the Security tab.
- `cache-from: type=gha`.
- The Google Cloud deployments behind workload identity federation.
- Workflows that act on repository state through the GitHub API.

Every step before a failing one still runs, which is usually the part under test.
