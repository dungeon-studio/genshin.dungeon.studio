<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Add a Terraform environment

This guide explains how to add a new infrastructure environment such as `staging` to this repository.

For how branches map to environments and Terraform actions, see [Infrastructure branch flow](../reference/infrastructure-branch-flow.md).

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
- Update `github_secrets_setup` with:
  - repository/Dependabot RO secret mapping
  - environment-level RW secret mapping

Keep secret names aligned with infrastructure environment names.

---

## 3) Scaffold the environment folder

Create `infrastructure/terraform/environments/<environment>/` with these files, using `prod/` as the model:

- `backend.tf`: set the state `prefix` to `environments/<environment>`
- `main.tf`: pin the providers and call `infrastructure/terraform/modules/application_environment`
- `variables.tf` and `terraform.tfvars`: declare and set the values that vary per environment
- `outputs.tf`: re-export the module outputs the deploy workflow reads

Start with every `enable_*` flag off. Turn on a domain flag after `core` publishes that name's DNS record, and the invoker flag after the first deploy.

The first apply creates the Google OAuth secret containers, then fails reading them. Store the client ID and secret in those containers, then re-run the apply.

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

- In the `terraform-plan` job in `.github/workflows/ci.yml`, add `<environment>` to the matrix and a branch for its RO secret to the auth step's `service_account`.
- In `.github/workflows/terraform-apply.yml`, copy one job and set job id, `with.environment`, and RW secret. Match the routing in [Infrastructure branch flow](../reference/infrastructure-branch-flow.md).
- Keep `.github/workflows/terraform-apply-reusable.yml` unchanged.

---

## 6) Apply bootstrap before expecting continuous integration success

After merge, apply bootstrap so the new project, service accounts, and IAM bindings exist before relying on CI plan/apply jobs.

Then set/update GitHub secrets from `github_secrets_setup` output.

---

## 7) Open a pull request

Commit and open a pull request to `develop`.
