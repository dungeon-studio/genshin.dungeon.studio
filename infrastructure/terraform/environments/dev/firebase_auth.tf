# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Firebase Management API for the project.
resource "google_project_service" "firebase" {
  project = var.gcp_dev_project_id
  service = "firebase.googleapis.com"

  disable_on_destroy = false
}

# Enable Identity Toolkit API for Firebase Authentication.
resource "google_project_service" "identitytoolkit" {
  project = var.gcp_dev_project_id
  service = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

# Initialize Identity Platform (Firebase Authentication) project config.
resource "google_identity_platform_config" "default" {
  project = var.gcp_dev_project_id

  autodelete_anonymous_users = true

  authorized_domains = [
    "${var.gcp_dev_project_id}.firebaseapp.com",
    "${var.gcp_dev_project_id}.web.app",
    "genshin.dungeon.studio",
  ]

  depends_on = [
    google_project_service.firebase,
    google_project_service.identitytoolkit,
  ]
}

# Read the Google OAuth client ID from Secret Manager.
data "google_secret_manager_secret_version" "firebase_auth_google_client_id" {
  project = var.gcp_dev_project_id
  secret  = google_secret_manager_secret.firebase_auth_google_client_id.secret_id
  version = "latest"
}

# Read the Google OAuth client secret from Secret Manager.
data "google_secret_manager_secret_version" "firebase_auth_google_client_secret" {
  project = var.gcp_dev_project_id
  secret  = google_secret_manager_secret.firebase_auth_google_client_secret.secret_id
  version = "latest"
}

# Configure Google as a supported identity provider.
resource "google_identity_platform_default_supported_idp_config" "google" {
  project = var.gcp_dev_project_id

  idp_id        = "google.com"
  client_id     = data.google_secret_manager_secret_version.firebase_auth_google_client_id.secret_data
  client_secret = data.google_secret_manager_secret_version.firebase_auth_google_client_secret.secret_data

  enabled = true

  depends_on = [google_identity_platform_config.default]
}
