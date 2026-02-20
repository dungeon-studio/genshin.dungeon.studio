# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  firestore_database_name = "(default)"
}

# Enable Firestore API
resource "google_project_service" "firestore" {
  project = var.gcp_dev_project_id
  service = "firestore.googleapis.com"

  disable_on_destroy = false
}

# Firestore database for application persistence
resource "google_firestore_database" "default" {
  project     = var.gcp_dev_project_id
  name        = local.firestore_database_name
  location_id = var.firestore_location_id
  type        = "FIRESTORE_NATIVE"

  # Dev environment should not block teardown workflows.
  delete_protection_state = "DELETE_PROTECTION_DISABLED"

  depends_on = [google_project_service.firestore]
}
