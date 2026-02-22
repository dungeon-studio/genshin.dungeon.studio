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

  autodelete_anonymous_users = false

  depends_on = [
    google_project_service.firebase,
    google_project_service.identitytoolkit,
  ]
}
