# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  firestore_database_name = "(default)"
}

# Enable Firestore API
resource "google_project_service" "firestore" {
  project = var.gcp_prod_project_id
  service = "firestore.googleapis.com"

  disable_on_destroy = false
}

# Firestore database for application persistence
resource "google_firestore_database" "default" {
  project     = var.gcp_prod_project_id
  name        = local.firestore_database_name
  location_id = var.firestore_location_id
  type        = "FIRESTORE_NATIVE"

  # Production holds the only copy of user collections, so refuse deletion at
  # both layers: the API rejects the call, and Terraform refuses to plan one.
  delete_protection_state = "DELETE_PROTECTION_ENABLED"

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.firestore]
}
