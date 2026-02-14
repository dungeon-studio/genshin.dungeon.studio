# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_service_account" "github_deployer_ro_dev" {
  project      = var.gcp_dev_project_id
  account_id   = "github-deployer-ro"
  display_name = "GitHub Actions Read-Only"
  description  = "Service account for GitHub Actions plan runs"

  depends_on = [google_project_service.dev_iam]
}

resource "google_service_account_iam_binding" "github_deployer_ro_dev_workload_identity" {
  service_account_id = google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${var.gcp_shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

resource "google_project_iam_member" "github_deployer_ro_dev_viewer" {
  project = var.gcp_dev_project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro_dev.email}"
}

# Grant Workload Identity permission to generate tokens for read-only service account
resource "google_service_account_iam_binding" "github_deployer_ro_dev_token_creator" {
  service_account_id = google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${var.gcp_shared_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}
