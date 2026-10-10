<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

<!-- vale Microsoft.Headings = NO -->

# Run Trivy scans

<!-- vale Microsoft.Headings = YES -->

CI runs Trivy automatically on pull requests via the `trivy-*` jobs in
`ci.yml` and the `terraform_trivy` pre-commit hook. Use this guide to
reproduce a finding locally or scan changes before pushing.

Trivy looks for `trivy.yaml`, never the dot-prefixed name this repository uses,
so add `--config .trivy.yaml` to any command here that needs to match CI rather
than Trivy's own defaults.

## Prerequisites

Install Trivy following the
[official instructions](https://trivy.dev/docs/latest/getting-started/installation/).

## Scan Terraform

```bash
trivy config infrastructure/terraform
```

## Scan the API Dockerfile

```bash
trivy config apps/api
```

## Scan the API container image

CI reports these findings to the Security tab instead of failing the pull
request. This command prints the same set:

```bash
docker build -t api-local:scan -f apps/api/Dockerfile .
trivy image --scanners vuln --ignore-unfixed --exit-code 0 --config .trivy.yaml api-local:scan
```

## Scan dependencies

The only scans that block a pull request, so match CI exactly. The licence scan
reads licences from `node_modules`, so run `pnpm install` first:

```bash
trivy fs --scanners vuln --config .trivy.yaml pnpm-lock.yaml
trivy fs --scanners license --severity UNKNOWN,HIGH,CRITICAL --config .trivy.yaml .
```

The licence scan fails on licences Trivy rates restricted or forbidden, such as
GPL and AGPL, and on licences it can't classify. Resolve a licence failure in
one of three ways:

- Replace the dependency with one under an accepted licence.
- Add a permissive licence Trivy doesn't classify to `license.permissive` in
  `.trivy.yaml`.
- Record an accepted copyleft licence in `.trivyignore.yaml`. The entry exempts
  that licence in every package.

Record an advisory with no upstream fix in `.trivyignore.yaml`.
