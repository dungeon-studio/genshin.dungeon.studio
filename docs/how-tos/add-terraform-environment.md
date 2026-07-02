<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Add a Terraform environment

This guide explains how to add a new infrastructure environment such as `staging` to this repository.

---

## 1) Add bootstrap configuration

Copy `infrastructure/terraform/bootstrap/dev.tf` to `infrastructure/terraform/bootstrap/<environment>.tf`, then update names and references.

- Rename module blocks and resource names from `dev` to `<environment>`
- Set `environment`, `project_id`, and `project_name`
- Keep the same `github_oidc_bindings_<environment>` pattern, and set its
  `github_environment` to the GitHub Actions environment name the apply job
  runs in (it must match exactly, or RW Workload Identity auth fails closed)
- Keep cross-project viewer access to `module.core` for RO and RW service accounts
- Keep any environment-scoped IAM needed for plan/apply

Use naming based on infrastructure environment names such as `dev`, `staging`, and `production`, not branch names or release-train names such as `release/*`.

---

## 2) Update bootstrap outputs

Update `infrastructure/terraform/bootstrap/outputs.tf`:

- Add project and service-account outputs for the new environment
- Update `github_actions_setup` with:
  - repository-level RO variable mapping
  - environment-level RW variable mapping

Keep variable names aligned with infrastructure environment names. The
Workload Identity provider and service-account emails are non-secret
configuration; store them as GitHub Actions variables, not secrets.

---

## 3) Scaffold the environment folder

Copy `infrastructure/terraform/environments/dev/` to `infrastructure/terraform/environments/<environment>/`, then update values.

Keep these files in the new folder:

- `backend.tf`
- `main.tf`
- `variables.tf`
- `terraform.tfvars`
- `outputs.tf`

Update project IDs, project numbers, and any environment-specific variable values.

For early scaffolding, `outputs.tf` can remain empty except SPDX headers until useful outputs exist.

---

## 4) Initialize and commit lock file

From the new environment folder, run:

```bash
terraform init
```

Commit `.terraform.lock.hcl` for the new environment.

Don't commit `.terraform/` directories.

---

## 5) Align GitHub workflows

- In `.github/workflows/terraform-plan.yml`, copy one matrix entry and add `<environment>` to the RO service-account variable mapping.
- In `.github/workflows/terraform-apply.yml`, copy one job and set job id and `with.environment`.
- In `.github/workflows/terraform-apply-reusable.yml`, add `<environment>` to the RW service-account variable mapping.

---

## 6) Apply bootstrap before expecting continuous integration success

After merge, apply bootstrap so the new project, service accounts, and IAM bindings exist before relying on CI plan/apply jobs.

Then set/update GitHub Actions variables from `github_actions_setup` output.

---

## 7) Validate and open pull request

After making changes:

1. Run `terraform fmt -recursive` in changed Terraform directories
2. Run `terraform init -backend=false && terraform validate` where relevant
3. Commit updates and open a pull request to `develop`
