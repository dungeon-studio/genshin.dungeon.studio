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

# TODO(#36): Add google_identity_platform_default_supported_idp_config for
# google.com after OAuth credentials are stored in Secret Manager.
# Requires a second apply once the manual steps are complete.
