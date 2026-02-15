<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# DSGEP-001: Workload Identity Federation architecture

- **Status**: Accepted
- **Created**: 2026-02-15
- **Authors**: Alex Brandt

## Abstract

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) describes the architectural decision to place Workload Identity Federation (WIF) infrastructure in the bootstrap Terraform configuration rather than in environment-specific Terraform workspaces. This centralizes security configuration, eliminates circular dependencies, and establishes a clear security boundary for Continuous Integration/Continuous Deployment (CI/CD) authentication.

## Problem statement

GitHub Actions workflows need to authenticate to Google Cloud Platform to manage infrastructure via Terraform. GCP provides Workload Identity Federation (WIF) as a secure, keyless authentication mechanism using Open ID Connect (OIDC) tokens. The key architectural question is: **where should you create and manage WIF infrastructure (identity pool and OIDC provider)?**

Two primary options exist:

1. **Per-environment approach**: Each environment (shared, core, dev) creates its own WIF pool/provider in its Terraform workspace
2. **Centralized approach**: A single WIF pool/provider in bootstrap, with environment-specific service account bindings

## Context

### Infrastructure layout

The project uses three GCP projects:

- `dungeon-studio-genshin-shared`: Houses Terraform state bucket and WIF infrastructure
- `dungeon-studio-genshin-core`: Common resources (Domain Name System (DNS), shared services) used across environments
- `dungeon-studio-genshin-dev`: Development environment resources

### Bootstrap vs environment Terraform

- **Bootstrap**: Creates GCP projects, service accounts, and foundational infrastructure. Run manually with user credentials.
- **Environments** (core, dev): Manage environment-specific resources. Run via GitHub Actions with WIF authentication.

### The circular dependency problem

If environment-specific Terraform creates WIF infrastructure:

1. dev environment Terraform needs WIF to authenticate via GitHub Actions
2. But dev environment Terraform must run to create the WIF infrastructure
3. This creates a chicken-egg problem on initial deployment

Additionally:

- Shared environment would create WIF infrastructure used by dev environment
- dev environment Terraform would need to reference shared WIF infrastructure
- On first bootstrap, shared apply runs before dev service accounts exist
- Identity and Access Management (IAM) bindings in shared environment referencing non-existent dev resources fail

## Decision

**Place WIF pool and OIDC provider in bootstrap Terraform, located in the shared project.** Bootstrap creates environment-specific service account bindings via a reusable `github_oidc_bindings` module for each project.

### Architecture

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

Each environment gets two service accounts—RW for apply and RO for plan—bound to this pool via the `github_oidc_bindings` module.

## Rationale

### Why bootstrap

1. **Eliminates circular dependencies**: Bootstrap runs with user credentials, so it can create WIF infrastructure before any GitHub Actions workflows need it.

2. **Single security boundary**: One WIF pool/provider configuration to audit and maintain. Changes to OIDC provider settings—attribute mappings, repository restrictions—happen in one place.

3. **Centralized trust model**: The shared project acts as the trust anchor. All environments reference the same identity pool, making the security model explicit and auditable.

4. **Simplified environment Terraform**: Environment workspaces like core and dev don't manage authentication infrastructure—they just use it. This keeps environment Terraform focused on application resources.

### Why shared project

The WIF pool lives in `dungeon-studio-genshin-shared` because:

- Shared project already houses the Terraform state bucket—another shared foundational resource
- Shared project is production-critical infrastructure, labeled as `environment = "production"`
- All environments need to reference the same pool, making "shared" the natural home

## Consequences

### Positive

- **No circular dependencies**: Bootstrap can create all foundational infrastructure in order
- **Clear ownership**: Security configuration lives in bootstrap; environments consume it
- **Easier troubleshooting**: One place to check WIF configuration when authentication fails
- **Future-proof**: Adding staging/production environments means calling the bindings module again—no need to recreate WIF infrastructure

### Negative

- **Bootstrap complexity**: Bootstrap Terraform now manages cross-project IAM—dev service accounts binding to shared WIF pool. This increases bootstrap scope.
- **Manual bootstrap**: You must run bootstrap with a user account that has sufficient permissions. Automating bootstrap would require a different authentication mechanism: service account with domain-wide delegation or manual bootstrap.

### Neutral

- **State bucket design trade-off**: The bootstrap configuration reads the state bucket from the shared project it also creates. This intentional "deadlock" requires out-of-band shared project creation + state bucket setup on first run, then import. This is acceptable because state is only for disaster recovery—projects can be rebuilt from scratch if needed.

## Alternatives considered

### Alternative 1: Workload Identity Federation in each environment

**Approach**: each environment creates its own WIF pool/provider.

**Rejected because**:

- Creates circular dependencies: environment Terraform needs WIF to run, but must run to create WIF
- Multiplies security configuration: 3 WIF pools to maintain
- Unclear which pool should be the "source of truth" for shared authentication

### Alternative 2: Workload Identity Federation in shared environment Terraform

**Approach**: move WIF creation to `environments/shared` Terraform workspace instead of bootstrap.

**Rejected because**:

- Shared environment Terraform runs via GitHub Actions and needs WIF to authenticate
- Creates the same circular dependency as Alternative 1
- Doesn't solve the "where does the first WIF come from" problem

### Alternative 3: Separate bootstrap for Workload Identity Federation only

**Approach**: create a minimal bootstrap just for WIF, then a second bootstrap for projects.

**Rejected because**:

- Adds unnecessary complexity: two bootstrap phases
- Still requires manual initial bootstrap with user credentials
- Current design already handles this cleanly with comprehensive bootstrap

## Implementation notes

### Bootstrap process

Bootstrap follows a three-step process:

1. **Create state bucket**: Run `infrastructure/scripts/bootstrap-terraform-state.sh` to create the shared project (`dungeon-studio-genshin-shared`) and state bucket (`dungeon-studio-genshin-tfstate`). Then import the project into Terraform state to resolve the circular dependency—bootstrap needs the state bucket but also manages the shared project.

2. **Run bootstrap**: run `terraform apply` in `infrastructure/terraform/bootstrap/`. This creates:
   - Core project (`dungeon-studio-genshin-core`)
   - dev project (`dungeon-studio-genshin-dev`)
   - Service accounts for each project: RW for terraform-apply, RO for terraform-plan
   - WIF pool and OIDC provider in the shared project
   - IAM bindings connecting service accounts to WIF
   - Cross-project permissions, such as dev RO access to core

3. **Automatic environment deployment**: GitHub Actions workflows authenticate via WIF and deploy environment-specific resources. The `terraform-apply-core` job runs before `terraform-apply-dev` (via `needs: terraform-apply-core`), maintaining sequential application across environments.

### Security: Attribute condition

The OIDC provider restricts tokens to a single repository:

```hcl
attribute_condition = "assertion.repository == 'dungeon-studio/genshin.dungeon.studio'"
```

This ensures only workflows from this repository can impersonate service accounts, even if someone compromises the WIF pool ID.

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

This lets dev workflows reference core resources like DNS zones without write access.

## Related documents

- [Bootstrap Terraform configuration](../../infrastructure/terraform/bootstrap/)
- [GitHub Actions workflows](../../.github/workflows/)
- [How to update game data](../how-tos/update-game-characters.md), an example workflow using WIF

## Revision history

- 2026-02-15: initial version (DSGEP-001 accepted)
