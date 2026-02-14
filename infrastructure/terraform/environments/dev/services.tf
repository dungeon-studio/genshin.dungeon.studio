# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_project_service" "dev_iam" {
  project = var.gcp_dev_project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
}
