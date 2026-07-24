# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_version = "1.15.8"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.40.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "7.40.0"
    }
  }
}

provider "google" {
  project = var.gcp_dev_project_id
}

provider "google-beta" {
  project = var.gcp_dev_project_id
}

data "google_project" "dev" {
  project_id = var.gcp_dev_project_id
}
