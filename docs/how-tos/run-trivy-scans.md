<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

<!-- vale Microsoft.Headings = NO -->

# Run Trivy scans

<!-- vale Microsoft.Headings = YES -->

Trivy scans infrastructure code for misconfigurations and security
vulnerabilities. It runs in three places: as a pre-commit hook, in GitHub
Actions, and on demand locally.

## Prerequisites

Install Trivy following the
[official instructions](https://aquasecurity.github.io/trivy/latest/getting-started/installation/).

## Run locally

Scan Terraform files:

```bash
trivy config infrastructure/terraform
```

Scan the API Dockerfile:

```bash
trivy config apps/api
```

Scan the built container image:

```bash
docker build -t api-local:scan -f apps/api/Dockerfile .
trivy image api-local:scan
```

## Pre-commit hook

The `terraform_trivy` hook in `.pre-commit-config.yaml` scans
Terraform files on each commit. It uses the
[pre-commit-terraform](https://github.com/antonbabenko/pre-commit-terraform)
framework.

The hook requires Trivy installed locally. It's skipped by
`pre-commit.ci` and runs in the `pre-commit.yml` GitHub Actions workflow
instead.

## GitHub Actions

The `trivy.yml` workflow runs on pull requests and pushes to `develop`
and `main`. It has three jobs:

- **Infrastructure scanning**: scans `infrastructure/terraform/` for
  Terraform misconfigurations.
- **Dockerfile scanning**: scans `apps/api/` for Dockerfile
  misconfigurations.
- **Container image scanning**: builds and scans the API Docker image
  for known vulnerabilities.

All jobs upload results in SARIF format to the GitHub Security tab.
Only high and critical severity findings fail the workflow.

## Configuration

Trivy reads its configuration from `.trivy.yaml` in the repository root.
The configuration enables misconfiguration and secret scanning, and
points Terraform variable files for accurate evaluation.
