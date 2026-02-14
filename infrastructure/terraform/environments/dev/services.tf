# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Service Usage API first - required to manage other APIs
resource "google_project_service" "dev_serviceusage" {
  project = var.gcp_dev_project_id
  service = "serviceusage.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "dev_iam" {
  project = var.gcp_dev_project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false

  depends_on = [google_project_service.dev_serviceusage]
}

# Enable IAM Credentials API for Workload Identity token generation
resource "google_project_service" "dev_iam_credentials" {
  project = var.gcp_dev_project_id
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false

  depends_on = [google_project_service.dev_serviceusage]
}
