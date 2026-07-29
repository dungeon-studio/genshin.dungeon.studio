<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Infrastructure branch flow

How infrastructure automation maps branches to environments and Terraform actions.

## Branch strategy

The long-lived branches follow a [git-flow](https://nvie.com/posts/a-successful-git-branching-model/)-style release model; how each maps to an environment deployment is specific to this project.

- `develop`: integration branch
- `release/*`: release-train branches cut from `develop`
- `main`: long-term release target branch, used when production flow is active

## Terraform workflow routing

| Trigger                                             | Action                        |
| --------------------------------------------------- | ----------------------------- |
| push to `develop`                                   | applies `core` then `dev`     |
| push to `release/*`                                 | applies `core` then `staging` |
| pull requests to `develop`, `release/*`, and `main` | run Terraform plan checks     |

## Release-branch naming

Derive the name from the root `package.json` version using SemVer2 context, and include both the release date and short hash token:

```text
release/0.1.0-20260221.d24af0f
```
