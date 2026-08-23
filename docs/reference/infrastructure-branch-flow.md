<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Infrastructure branch flow

How infrastructure automation maps branches to environments and Terraform actions.

## Branch strategy

The branches follow a [git-flow](https://nvie.com/posts/a-successful-git-branching-model/)-style release model. How each maps to an environment deployment is specific to this project, and [DSGEP-006](../explanation/dsgep-006-branching-model.md) records why.

`develop` and `main` are permanent. A `release/*` or `hotfix/*` branch lives from its cut until it merges.

- `develop`: integration branch
- `release/*`: release-train branches cut from `develop`
- `main`: release target branch, used when production flow is active
- `hotfix/*`: urgent production fixes cut from `main`

## Terraform workflow routing

| Trigger                                             | Action                        |
| --------------------------------------------------- | ----------------------------- |
| push to `develop`                                   | applies `core` then `dev`     |
| push to `release/*`                                 | applies `core` then `staging` |
| push to `hotfix/*`                                  | applies nothing               |
| pull requests to `develop`, `release/*`, and `main` | run Terraform plan checks     |

## Release-branch naming

Derive the name from the root `package.json` version using SemVer2 context, and include both the release date and short hash token:

```text
release/0.1.0-20260221.d24af0f
```
