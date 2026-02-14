# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Dev environment service accounts (created in shared, used in dev)

resource "google_service_account" "github_deployer_dev" {
  project      = var.gcp_dev_project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions deployments"

  depends_on = [google_project_service.dev_iam]
}

resource "google_service_account_iam_binding" "github_deployer_dev_workload_identity" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool.github]
}

resource "google_project_iam_member" "github_deployer_dev_editor" {
  project = var.gcp_dev_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_deployer_dev.email}"
}

resource "google_service_account_iam_binding" "github_deployer_dev_token_creator" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Bucket access: Grant write access to terraform state
resource "google_storage_bucket_iam_member" "github_deployer_dev_storage" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_dev.email}"
}
