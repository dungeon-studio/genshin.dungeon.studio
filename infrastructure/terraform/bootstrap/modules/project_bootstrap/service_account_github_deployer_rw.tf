# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# RW service account
resource "google_service_account" "github_deployer_rw" {
  project      = google_project.env.project_id
  account_id   = "github-deployer-rw"
  display_name = "GitHub Applier"
  description  = "GitHub Actions service account with write access for deployments"

  depends_on = [google_project_service.serviceusage]
}

resource "google_project_iam_member" "github_deployer_rw_editor" {
  project = google_project.env.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

# Grant permission to create and manage service accounts in this project
# Needed if environment terraform creates application service accounts
resource "google_project_iam_member" "github_deployer_rw_sa_admin" {
  project = google_project.env.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_rw_state_bucket" {
  bucket = var.state_bucket_name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_rw_bucket_reader" {
  bucket = var.state_bucket_name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}
