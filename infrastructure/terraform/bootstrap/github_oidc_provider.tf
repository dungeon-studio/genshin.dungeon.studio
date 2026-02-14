# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Bootstrap WIF infrastructure for GitHub Actions authentication across all environments
# Located in shared project alongside state bucket for centralized security management

# Enable STS API in shared project - required for Workload Identity Federation
resource "google_project_service" "sts" {
  project = module.shared.project_id
  service = "sts.googleapis.com"

  disable_on_destroy = false

  depends_on = [module.shared]
}

# Enable IAM Credentials API - required for WIF token generation
resource "google_project_service" "iam_credentials" {
  project = module.shared.project_id
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false

  depends_on = [module.shared]
}

# This is the core security boundary for CI/CD authentication
# All environments bind service accounts to this pool
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  project                   = module.shared.project_id
  display_name              = "GitHub Actions"
  description               = "Workload Identity Pool for GitHub Actions across all environments"
  disabled                  = false

  depends_on = [google_project_service.sts]
}

# Configure the OIDC provider for GitHub
# Restricts tokens to dungeon-studio GitHub organization repositories
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  project                            = module.shared.project_id
  display_name                       = "GitHub"
  description                        = "OIDC provider for GitHub Actions"
  disabled                           = false

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.environment"      = "assertion.environment"
  }

  # Security: Restrict to the dungeon-studio/genshin.dungeon.studio repository
  attribute_condition = "assertion.repository == 'dungeon-studio/genshin.dungeon.studio'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
