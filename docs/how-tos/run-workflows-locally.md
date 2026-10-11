<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Run workflows locally

This guide runs a workflow job on your own machine with [act](https://github.com/nektos/act), to test its wiring without pushing first. Wiring means the job graph, an `if:` condition, or what a composite action hands the step after it.

To check a result rather than wiring, run the job's command directly, such as `pre-commit run --all-files`. It finishes sooner outside a container.

For which workflow holds which job, see [Workflow conventions](../reference/workflow-conventions.md).

---

## Before you start

act runs jobs on a Docker daemon. The DevContainer installs act and reaches the host's daemon.

Run act from the main checkout, not a [linked worktree](https://git-scm.com/docs/git-worktree). act copies the working tree into the job container, and a linked worktree stores `.git` as a file pointing at the main checkout, so any step shelling out to git fails.

Inside the DevContainer, don't pass `--bind`. act's job containers are siblings of the DevContainer on the host daemon, so `--bind` mounts the workspace by its path on the host.

## 1) Run a job

Name the event and the job:

```bash
act push -j workspace
```

The event selects which jobs exist. A job gated on pull requests, like `schema-compat`, needs `act pull_request`.

## 2) Pass a secret a step needs

A step that needs only a secret runs once you pass it with `-s`, such as the Codecov upload:

```bash
act push -j workspace -s CODECOV_TOKEN
```

A step that needs a service only GitHub's runners reach fails whatever you pass:

- SARIF uploads to the Security tab.
- `cache-from: type=gha`.
- The Google Cloud deployments behind workload identity federation.
- Workflows that act on repository state through the GitHub API.

The steps before it still run.
