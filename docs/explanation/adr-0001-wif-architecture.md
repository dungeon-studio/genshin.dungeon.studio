---
status: accepted
date: 2026-02-15
decision-makers: Alex Brandt
---

# Workload identity federation architecture

## Context and problem statement

GitHub Actions workflows need to authenticate to Google Cloud Platform (GCP) to manage infrastructure via Terraform. GCP provides Workload Identity Federation (WIF) as a secure, keyless authentication mechanism using OpenID Connect (OIDC) tokens. Which Terraform configuration should create and manage the WIF identity pool and OIDC provider?

The project uses three GCP projects:

- `dungeon-studio-genshin-shared` houses the Terraform state bucket and WIF infrastructure.
- `dungeon-studio-genshin-core` holds common resources, such as Domain Name System (DNS) zones and shared services, used across environments.
- `dungeon-studio-genshin-dev` holds development environment resources.

Terraform runs in two kinds of configuration:

- Bootstrap creates GCP projects, service accounts, and foundational infrastructure. It runs manually with user credentials.
- Environments, such as core and dev, manage environment-specific resources. They run via GitHub Actions with WIF authentication.

If environment-specific Terraform creates WIF infrastructure, initial deployment has a circular dependency:

1. Dev environment Terraform needs WIF to authenticate via GitHub Actions.
2. Dev environment Terraform must run to create the WIF infrastructure.

A shared environment hits the same problem from the other side. It would create WIF infrastructure that the dev environment references. On first bootstrap, though, the shared apply runs before dev service accounts exist, so Identity and Access Management (IAM) bindings referencing dev resources fail.

## Decision drivers

- No circular dependency on first deployment
- One security boundary to audit for continuous integration and deployment authentication
- An explicit trust anchor that every environment references
- Environment Terraform focused on application resources, not authentication infrastructure

## Considered options

- Bootstrap Terraform, in the shared project
- Each environment
- A shared environment workspace
- A separate bootstrap for federation only

## Decision outcome

Chosen option: bootstrap Terraform, in the shared project. Bootstrap runs with user credentials, so it can create WIF infrastructure before any GitHub Actions workflow needs it. Bootstrap creates environment-specific service account bindings via a reusable `github_oidc_bindings` module for each project.

```text
bootstrap/
├── shared.tf                    # Creates dungeon-studio-genshin-shared project
├── core.tf                      # Creates dungeon-studio-genshin-core project + bindings
├── dev.tf                       # Creates dungeon-studio-genshin-dev project + bindings
├── github_oidc_provider.tf      # WIF pool + OIDC provider (in shared project)
└── modules/
    ├── project_bootstrap/       # Creates project + service accounts
    └── github_oidc_bindings/    # Binds service accounts to WIF pool
```

The WIF pool lives at:

```text
projects/dungeon-studio-genshin-shared/locations/global/workloadIdentityPools/github
```

Each environment gets two service accounts, read-write for apply and read-only for plan, bound to this pool via the `github_oidc_bindings` module.

The pool lives in `dungeon-studio-genshin-shared` because that project already houses the Terraform state bucket, another shared foundational resource. It's production-critical infrastructure, labeled `environment = "production"`, and every environment needs to reference the same pool.

### Consequences

- Good, because bootstrap can create all foundational infrastructure in order, with no circular dependency.
- Good, because security configuration lives in bootstrap and environments consume it, so ownership is clear.
- Good, because one place holds the WIF configuration to check when authentication fails.
- Good, because adding staging or production environments means calling the bindings module again, with no new WIF infrastructure.
- Bad, because bootstrap Terraform manages cross-project IAM, with dev service accounts binding to the shared WIF pool. This increases bootstrap scope.
- Bad, because bootstrap must run with a user account that has sufficient permissions. Automating it would need a different authentication mechanism, such as a service account with domain-wide delegation.
- Neutral, because bootstrap reads the state bucket from the shared project it also creates. This intentional deadlock requires creating the shared project and state bucket out of band on first run, then importing the project. That's acceptable because state is only for disaster recovery, and projects can be rebuilt from scratch.

## Pros and cons of the options

### Bootstrap Terraform, in the shared project

- Good, because bootstrap runs with user credentials, so nothing needs WIF before WIF exists.
- Good, because OIDC provider settings, such as attribute mappings and repository restrictions, change in one place.
- Good, because the shared project acts as a single, auditable trust anchor.
- Bad, because bootstrap grows to manage cross-project IAM.

### Each environment

Each environment creates its own WIF pool and provider.

- Bad, because environment Terraform needs WIF to run but must run to create WIF.
- Bad, because it multiplies security configuration to three pools.
- Bad, because nothing marks which pool is the source of truth for shared authentication.

### A shared environment workspace

WIF creation moves to an `environments/shared` Terraform workspace instead of bootstrap.

- Bad, because shared environment Terraform runs via GitHub Actions and needs WIF to authenticate, recreating the same circular dependency.
- Bad, because it doesn't answer where the first WIF comes from.

### A separate bootstrap for federation only

A minimal bootstrap creates WIF, then a second bootstrap creates projects.

- Bad, because two bootstrap phases add complexity.
- Bad, because the initial bootstrap still runs manually with user credentials.
- Bad, because the single comprehensive bootstrap already handles this ordering.

## More information

### Bootstrap process

1. Create the state bucket. Run `infrastructure/scripts/bootstrap-terraform-state.sh` to create the shared project (`dungeon-studio-genshin-shared`) and state bucket (`dungeon-studio-genshin-tfstate`). Then import the project into Terraform state to resolve the circular dependency, since bootstrap needs the state bucket but also manages the shared project.
2. Run `terraform apply` in `infrastructure/terraform/bootstrap/`. This creates:
   - The core project (`dungeon-studio-genshin-core`)
   - The dev project (`dungeon-studio-genshin-dev`)
   - Service accounts for each project, read-write for `terraform-apply` and read-only for `terraform-plan`
   - The WIF pool and OIDC provider in the shared project
   - IAM bindings connecting service accounts to WIF
   - Cross-project permissions, such as dev read-only access to core
3. GitHub Actions workflows authenticate via WIF and deploy environment-specific resources. The `terraform-apply-dev` job declares `needs: terraform-apply-core`, so environments apply in sequence.

### Attribute condition

The OIDC provider restricts tokens to a single repository:

```hcl
attribute_condition = "assertion.repository == 'dungeon-studio/genshin.dungeon.studio'"
```

Only workflows from this repository can impersonate service accounts, even if someone compromises the WIF pool ID.

### Cross-project permissions

The dev environment has read-only access to core project resources:

```hcl
# In bootstrap/dev.tf
resource "google_project_iam_member" "dev_ro_to_core" {
  project = module.core.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${module.dev.github_deployer_ro_email}"
}
```

Dev workflows can reference core resources like DNS zones without write access.

### Related documents

- [Bootstrap Terraform configuration](../../infrastructure/terraform/bootstrap/)
- [GitHub Actions workflows](../../.github/workflows/)
- [How to update game data](../how-tos/update-game-characters.md), an example workflow using WIF
