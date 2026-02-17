# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.19"
    }
  }
}

# Create the project
resource "google_project" "env" {
  name                = var.project_name
  project_id          = var.project_id
  auto_create_network = false
  billing_account     = var.billing_account_id

  labels = {
    environment = var.environment
    created_by  = "bootstrap"
    managed_by  = "terraform"
  }
}
