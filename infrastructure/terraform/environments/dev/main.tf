# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.19"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 7.19"
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
