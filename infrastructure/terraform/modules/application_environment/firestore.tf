# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  firestore_database_name = "(default)"
  firestore_location_id   = "eur3"
}

# Enable Firestore API
resource "google_project_service" "firestore" {
  project = var.project_id
  service = "firestore.googleapis.com"

  disable_on_destroy = false
}

# `prevent_destroy` only accepts a literal, so protection is a choice between
# two resource blocks rather than a variable on one.
resource "google_firestore_database" "protected" {
  count = var.firestore_delete_protection ? 1 : 0

  project     = var.project_id
  name        = local.firestore_database_name
  location_id = local.firestore_location_id
  type        = "FIRESTORE_NATIVE"

  delete_protection_state = "DELETE_PROTECTION_ENABLED"

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.firestore]
}

resource "google_firestore_database" "unprotected" {
  count = var.firestore_delete_protection ? 0 : 1

  project     = var.project_id
  name        = local.firestore_database_name
  location_id = local.firestore_location_id
  type        = "FIRESTORE_NATIVE"

  delete_protection_state = "DELETE_PROTECTION_DISABLED"

  depends_on = [google_project_service.firestore]
}
