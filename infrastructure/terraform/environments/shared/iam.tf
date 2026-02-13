# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_service_account" "github_deployer_shared" {
  project      = var.gcp_shared_project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions deployments"
}

resource "google_service_account" "github_deployer_ro_shared" {
  project      = var.gcp_shared_project_id
  account_id   = "github-deployer-ro"
  display_name = "GitHub Actions Read-Only"
  description  = "Service account for GitHub Actions plan runs"
}

# Security: Allow GitHub Actions to impersonate this service account via Workload Identity
resource "google_service_account_iam_binding" "github_deployer_shared_workload_identity" {
  service_account_id = google_service_account.github_deployer_shared.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.actor/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool.github]
}

resource "google_service_account_iam_binding" "github_deployer_ro_shared_workload_identity" {
  service_account_id = google_service_account.github_deployer_ro_shared.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.actor/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool.github]
}

# Grant shared service account permission to manage GCS state bucket
resource "google_project_iam_member" "github_deployer_shared_storage" {
  project = var.gcp_shared_project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.github_deployer_shared.email}"
}

resource "google_project_iam_member" "github_deployer_ro_shared_viewer" {
  project = var.gcp_shared_project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_ro_shared_state" {
  bucket = "dungeon-studio-genshin-tfstate"
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}

# Grant shared service account permission to manage IAM (for Workload Identity setup)
resource "google_project_iam_member" "github_deployer_shared_iam" {
  project = var.gcp_shared_project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.github_deployer_shared.email}"
}

# Security: Allow impersonation of service accounts in other projects
# Needed for Terraform to apply changes across dev/staging/production projects
resource "google_project_iam_member" "github_deployer_shared_impersonate" {
  project = var.gcp_shared_project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_deployer_shared.email}"
}
