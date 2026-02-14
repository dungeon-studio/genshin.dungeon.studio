# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Dev environment read-only service account (created in shared, used in dev)

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
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool.github]
}

resource "google_project_iam_member" "github_deployer_ro_dev_viewer" {
  project = var.gcp_dev_project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro_dev.email}"
}

resource "google_service_account_iam_binding" "github_deployer_ro_dev_token_creator" {
  service_account_id = google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Bucket access: Grant read-only access to terraform state
resource "google_storage_bucket_iam_member" "github_deployer_ro_dev_state" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro_dev.email}"
}
