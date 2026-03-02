# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Secret Manager API for the project.
resource "google_project_service" "secretmanager" {
  project = var.gcp_dev_project_id
  service = "secretmanager.googleapis.com"

  disable_on_destroy = false
}
