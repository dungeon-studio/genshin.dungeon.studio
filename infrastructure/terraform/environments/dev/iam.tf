# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Get shared project number for Workload Identity Pool reference
locals {
  shared_project_number = var.gcp_shared_project_number
}

resource "google_project_service" "dev_iam" {
  project = var.gcp_dev_project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
}

resource "google_service_account" "github_deployer_dev" {
  project      = var.gcp_dev_project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions deployments"

  depends_on = [google_project_service.dev_iam]
}

resource "google_service_account" "github_deployer_ro_dev" {
  project      = var.gcp_dev_project_id
  account_id   = "github-deployer-ro"
  display_name = "GitHub Actions Read-Only"
  description  = "Service account for GitHub Actions plan runs"

  depends_on = [google_project_service.dev_iam]
}

# Security: Bind service account to shared Workload Identity Pool
# This allows GitHub Actions to impersonate this service account via Workload Identity
resource "google_service_account_iam_binding" "github_deployer_dev_workload_identity" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.workloadIdentityUser"

  # References the Workload Identity Pool created in the shared environment
  members = [
    "principalSet://iam.googleapis.com/projects/${local.shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

resource "google_service_account_iam_binding" "github_deployer_ro_dev_workload_identity" {
  service_account_id = google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${local.shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Grant write-access service account permissions to manage dev environment
resource "google_project_iam_member" "github_deployer_dev_editor" {
  project = var.gcp_dev_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_deployer_dev.email}"
}

resource "google_project_iam_member" "github_deployer_ro_dev_viewer" {
  project = var.gcp_dev_project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro_dev.email}"
}

# Grant Workload Identity permission to generate tokens for write-access service account
resource "google_service_account_iam_binding" "github_deployer_dev_token_creator" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${local.shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Grant Workload Identity permission to generate tokens for read-only service account
resource "google_service_account_iam_binding" "github_deployer_ro_dev_token_creator" {
  service_account_id = google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${local.shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}
