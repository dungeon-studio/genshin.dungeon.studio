# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_dev_project_id
}

resource "google_project" "dev" {
  name       = "DS Genshin Development"
  project_id = var.gcp_dev_project_id

  labels = var.common_labels
}
