# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_service_account" "github_deployer_ro_shared" {
  project      = var.gcp_shared_project_id
  account_id   = "github-deployer-ro"
  display_name = "GitHub Actions Read-Only"
  description  = "Service account for GitHub Actions plan runs"

  depends_on = [google_project_service.shared_iam]
}

# Security: Allow GitHub Actions to impersonate this service account via Workload Identity
resource "google_service_account_iam_binding" "github_deployer_ro_shared_workload_identity" {
  service_account_id = google_service_account.github_deployer_ro_shared.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool.github]
}

resource "google_project_iam_member" "github_deployer_ro_shared_viewer" {
  project = var.gcp_shared_project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}

resource "google_project_iam_member" "github_deployer_ro_shared_security_reviewer" {
  project = var.gcp_shared_project_id
  role    = "roles/iam.securityReviewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}

# Grant Workload Identity permission to generate tokens for read-only service account
resource "google_service_account_iam_binding" "github_deployer_ro_shared_token_creator" {
  service_account_id = google_service_account.github_deployer_ro_shared.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Grant read-only service account access to state bucket
resource "google_storage_bucket_iam_member" "github_deployer_ro_shared_state" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}
