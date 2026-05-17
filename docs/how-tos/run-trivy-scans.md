<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

<!-- vale Microsoft.Headings = NO -->

# Run Trivy scans

<!-- vale Microsoft.Headings = YES -->

CI runs Trivy automatically on pull requests via the `trivy.yml`
workflow and the `terraform_trivy` pre-commit hook. Use this guide to
reproduce a finding locally or scan changes before pushing.

## Prerequisites

Install Trivy following the
[official instructions](https://aquasecurity.github.io/trivy/latest/getting-started/installation/).

## Scan Terraform

```bash
trivy config infrastructure/terraform
```

## Scan the API Dockerfile

```bash
trivy config apps/api
```

## Scan the API container image

```bash
docker build -t api-local:scan -f apps/api/Dockerfile .
trivy image api-local:scan
```
