# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Service Usage API first - required to manage other APIs
resource "google_project_service" "shared_serviceusage" {
  project = var.gcp_shared_project_id
  service = "serviceusage.googleapis.com"

  disable_on_destroy = false
}

# Enable Cloud Resource Manager API - required for project operations
resource "google_project_service" "shared_cloudresourcemanager" {
  project = var.gcp_shared_project_id
  service = "cloudresourcemanager.googleapis.com"

  disable_on_destroy = false

  depends_on = [google_project_service.shared_serviceusage]
}
