# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_service_account" "github_deployer_shared" {
  project      = var.gcp_shared_project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions deployments"

  depends_on = [google_project_service.shared_iam]
}

# Security: Allow GitHub Actions to impersonate this service account via Workload Identity
resource "google_service_account_iam_binding" "github_deployer_shared_workload_identity" {
  service_account_id = google_service_account.github_deployer_shared.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool.github]
}

# Grant write-access service account permission to manage GCS state bucket
# Use bucket-level IAM binding for object-level permissions on state bucket only
resource "google_storage_bucket_iam_member" "github_deployer_shared_storage" {
  bucket = "dungeon-studio-genshin-tfstate"
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_shared.email}"
}

# Grant Workload Identity permission to generate tokens for write-access service account
resource "google_service_account_iam_binding" "github_deployer_shared_token_creator" {
  service_account_id = google_service_account.github_deployer_shared.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
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
