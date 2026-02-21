<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Add a Terraform environment

This guide explains how to add a new infrastructure environment (for example `staging`) to this repository.

---

## 1) Add bootstrap configuration

Copy `infrastructure/terraform/bootstrap/dev.tf` to `infrastructure/terraform/bootstrap/<environment>.tf`, then update names and references.

- Rename module blocks and resource names from `dev` to `<environment>`
- Set `environment`, `project_id`, and `project_name`
- Keep the same `github_oidc_bindings_<environment>` pattern
- Keep cross-project viewer access to `module.core` for RO and RW service accounts
- Keep any environment-scoped IAM needed for plan/apply

Use naming based on infrastructure environment names (`dev`, `staging`, `production`), not branch names or release-train names (for example `release/*`).

---

## 2) Update bootstrap outputs

Update `infrastructure/terraform/bootstrap/outputs.tf`:

- Add project and service-account outputs for the new environment
- Update `github_secrets_setup` with:
  - repository/Dependabot RO secret mapping
  - environment-level RW secret mapping

Keep secret names aligned with infrastructure environment names.

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

- In `.github/workflows/terraform-plan.yml`, copy one matrix entry and set `<environment>` + RO secret.
- In `.github/workflows/terraform-apply.yml`, copy one job and set job id, `with.environment`, and RW secret.
- Keep `.github/workflows/terraform-apply-reusable.yml` unchanged.

---

## 6) Apply bootstrap before expecting CI success

After merge, apply bootstrap so the new project, service accounts, and IAM bindings exist before relying on CI plan/apply jobs.

Then set/update GitHub secrets from `github_secrets_setup` output.

---

## 7) Validate and open pull request

After making changes:

1. Run `terraform fmt -recursive` in changed Terraform directories
2. Run `terraform init -backend=false && terraform validate` where relevant
3. Commit updates and open a pull request to `develop`
