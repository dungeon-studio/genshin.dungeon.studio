# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_version = "1.16.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.7.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "8.7.0"
    }
  }
}

provider "google" {
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}

module "application_environment" {
  source = "../../modules/application_environment"

  project_id    = var.project_id
  common_labels = var.common_labels

  web_subdomain        = "develop"
  web_app_display_name = "Genshin Planner (dev)"

  enable_api_domain_mapping = var.enable_api_domain_mapping
  enable_api_public_invoker = var.enable_api_public_invoker
  enable_web_custom_domain  = true

  firestore_delete_protection = false
}
