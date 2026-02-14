# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Reference APIs enabled by bootstrap
data "google_project_service" "serviceusage" {
  project = var.gcp_dev_project_id
  service = "serviceusage.googleapis.com"
}

data "google_project_service" "iam" {
  project = var.gcp_dev_project_id
  service = "iam.googleapis.com"
}

# Enable IAM Credentials API for Workload Identity token generation
resource "google_project_service" "iam_credentials" {
  project = var.gcp_dev_project_id
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false

  depends_on = [data.google_project_service.serviceusage]
}
