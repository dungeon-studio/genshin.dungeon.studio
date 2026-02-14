# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Dev environment RW service account (created by bootstrap), set up Workload Identity bindings

data "google_service_account" "github_deployer_rw_dev" {
  project    = var.gcp_dev_project_id
  account_id = "github-deployer-rw"
}

# Bind dev RW SA to Workload Identity
resource "google_service_account_iam_binding" "github_deployer_rw_dev_workload_identity" {
  service_account_id = data.google_service_account.github_deployer_rw_dev.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool_provider.github]
}

# Grant token creator to dev RW SA
resource "google_service_account_iam_binding" "github_deployer_rw_dev_token_creator" {
  service_account_id = data.google_service_account.github_deployer_rw_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}

# Bucket access: Grant write access to terraform state
resource "google_storage_bucket_iam_member" "github_deployer_rw_dev_storage" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.google_service_account.github_deployer_rw_dev.email}"
}
