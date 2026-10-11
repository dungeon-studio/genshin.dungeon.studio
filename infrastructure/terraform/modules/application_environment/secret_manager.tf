# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Secret Manager API for the project.
resource "google_project_service" "secretmanager" {
  project = var.project_id
  service = "secretmanager.googleapis.com"

  disable_on_destroy = false
}

# Secret containers for the Google OAuth client credentials.
# The actual values must be stored manually via GCP Console or gcloud CLI
# after creating the OAuth consent screen.
resource "google_secret_manager_secret" "firebase_auth_google" {
  for_each = toset(["client-id", "client-secret"])

  project   = var.project_id
  secret_id = "firebase-auth-google-${each.key}"

  labels = var.common_labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}
