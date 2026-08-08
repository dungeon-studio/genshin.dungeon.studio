# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# NOTE: This environment is `prod` everywhere it is addressable -- folder name,
# state prefix, GitHub Actions environment, and the GCP_*_PROD_* secrets emitted
# by bootstrap outputs. The bootstrap module labels the underlying project
# `production` because its `environment` variable only accepts that spelling;
# that label is not an addressing scheme and does not propagate here.

terraform {
  required_version = "1.15.8"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.43.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "7.42.0"
    }
  }
}

provider "google" {
  project = var.gcp_prod_project_id
}

provider "google-beta" {
  project = var.gcp_prod_project_id
}

data "google_project" "prod" {
  project_id = var.gcp_prod_project_id
}
