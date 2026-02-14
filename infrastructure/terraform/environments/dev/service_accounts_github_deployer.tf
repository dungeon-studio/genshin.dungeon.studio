# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_service_account" "github_deployer_dev" {
  project      = var.gcp_dev_project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions deployments"

  depends_on = [google_project_service.dev_iam]
}

# Security: Bind service account to shared Workload Identity Pool
# This allows GitHub Actions to impersonate this service account via Workload Identity
resource "google_service_account_iam_binding" "github_deployer_dev_workload_identity" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.workloadIdentityUser"

  # References the Workload Identity Pool created in the shared environment
  members = [
    "principalSet://iam.googleapis.com/projects/${var.gcp_shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Grant write-access service account permissions to manage dev environment
resource "google_project_iam_member" "github_deployer_dev_editor" {
  project = var.gcp_dev_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_deployer_dev.email}"
}

# Grant Workload Identity permission to generate tokens for write-access service account
resource "google_service_account_iam_binding" "github_deployer_dev_token_creator" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${var.gcp_shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Grant write-access service account permission to manage state bucket
resource "google_storage_bucket_iam_member" "github_deployer_dev_storage" {
  bucket = "dungeon-studio-genshin-tfstate"
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_dev.email}"
}
