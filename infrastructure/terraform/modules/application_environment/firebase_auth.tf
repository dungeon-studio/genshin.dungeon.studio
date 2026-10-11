# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_project_service" "firebase" {
  project = var.project_id
  service = "firebase.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "identitytoolkit" {
  project = var.project_id
  service = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

resource "google_identity_platform_config" "default" {
  project = var.project_id

  autodelete_anonymous_users = true

  authorized_domains = [
    "${var.project_id}.firebaseapp.com",
    "${var.project_id}.web.app",
    local.base_domain,
  ]

  depends_on = [
    google_project_service.firebase,
    google_project_service.identitytoolkit,
  ]
}

# Terraform creates the secret containers but never their versions, so an
# environment's first apply fails here until the credentials are stored by hand.
data "google_secret_manager_secret_version" "firebase_auth_google" {
  for_each = google_secret_manager_secret.firebase_auth_google

  project = var.project_id
  secret  = each.value.secret_id
  version = "latest"
}

resource "google_identity_platform_default_supported_idp_config" "google" {
  project = var.project_id

  idp_id        = "google.com"
  client_id     = data.google_secret_manager_secret_version.firebase_auth_google["client-id"].secret_data
  client_secret = data.google_secret_manager_secret_version.firebase_auth_google["client-secret"].secret_data

  enabled = true

  # Identity Platform never returns client_secret, so it always reads as drift.
  # Rotating the secret replaces this config, briefly disabling Google sign-in.
  lifecycle {
    ignore_changes       = [client_secret]
    replace_triggered_by = [terraform_data.firebase_auth_google_client_secret_version]
  }

  depends_on = [google_identity_platform_config.default]
}

resource "terraform_data" "firebase_auth_google_client_secret_version" {
  input = data.google_secret_manager_secret_version.firebase_auth_google["client-secret"].name
}
