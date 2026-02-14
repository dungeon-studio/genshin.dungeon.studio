# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Shared environment controls access to the shared state bucket
# Each environment's service accounts get permissions granted here

# Shared environment - write access
resource "google_storage_bucket_iam_member" "github_deployer_shared_storage" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_shared.email}"
}

# Shared environment - read-only access
resource "google_storage_bucket_iam_member" "github_deployer_ro_shared_state" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}

# Dev environment - write access
resource "google_storage_bucket_iam_member" "github_deployer_dev_storage" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_dev.email}"
}

# Dev environment - read-only access
resource "google_storage_bucket_iam_member" "github_deployer_ro_dev_state" {
  bucket = data.google_storage_bucket.tfstate.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro_dev.email}"
}

# Future: Add staging and production environments here following the same pattern
# resource "google_storage_bucket_iam_member" "github_deployer_staging_storage" {
#   bucket = data.google_storage_bucket.tfstate.name
#   role   = "roles/storage.objectAdmin"
#   member = "serviceAccount:github-deployer@dungeon-studio-genshin-staging.iam.gserviceaccount.com"
# }
#
# resource "google_storage_bucket_iam_member" "github_deployer_ro_staging_state" {
#   bucket = data.google_storage_bucket.tfstate.name
#   role   = "roles/storage.objectViewer"
#   member = "serviceAccount:github-deployer-ro@dungeon-studio-genshin-staging.iam.gserviceaccount.com"
# }
