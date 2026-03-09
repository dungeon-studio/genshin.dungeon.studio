# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Secret Manager API for the project.
resource "google_project_service" "secretmanager" {
  project = var.gcp_dev_project_id
  service = "secretmanager.googleapis.com"

  disable_on_destroy = false
}

# Secret container for the Google OAuth client ID.
# The actual value must be stored manually via GCP Console or gcloud CLI
# after creating the OAuth consent screen.
resource "google_secret_manager_secret" "firebase_auth_google_client_id" {
  project   = var.gcp_dev_project_id
  secret_id = "firebase-auth-google-client-id"

  labels = var.common_labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

# Secret container for the Google OAuth client secret.
# The actual value must be stored manually via GCP Console or gcloud CLI
# after creating the OAuth consent screen.
resource "google_secret_manager_secret" "firebase_auth_google_client_secret" {
  project   = var.gcp_dev_project_id
  secret_id = "firebase-auth-google-client-secret"

  labels = var.common_labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}
