# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_project_service" "shared_iam" {
  project = var.gcp_shared_project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "shared_sts" {
  project = var.gcp_shared_project_id
  service = "sts.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "shared_iamcredentials" {
  project = var.gcp_shared_project_id
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false
}

# This is the core security boundary for CI/CD authentication
# All environments bind service accounts to this pool
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  project                   = var.gcp_shared_project_id
  display_name              = "GitHub Actions"
  description               = "Workload Identity Pool for GitHub Actions across all environments"
  disabled                  = false

  depends_on = [google_project_service.shared_iam]
}

# Configure the OIDC provider for GitHub
# Restricts tokens to dungeon-studio GitHub organization repositories
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  project                            = var.gcp_shared_project_id
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

  # Security: Restrict to dungeon-studio/genshin.dungeon.studio only
  attribute_condition = "assertion.repository == 'dungeon-studio/genshin.dungeon.studio'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
