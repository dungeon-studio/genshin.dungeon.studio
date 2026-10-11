# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_version = "1.16.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "8.6.0"
    }
  }
}

provider "google" {
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}

# Identity Platform must trust the registrable domain for sign-in redirects no
# matter which environment serves, so it stays separate from the hostname.
locals {
  base_domain = "genshin.dungeon.studio"
  web_domain  = "develop.${local.base_domain}"
}

module "application_environment" {
  source = "../../modules/application_environment"

  project_id    = var.project_id
  common_labels = var.common_labels

  base_domain          = local.base_domain
  web_domain           = local.web_domain
  web_app_display_name = "Genshin Planner (dev)"

  enable_api_domain_mapping = var.enable_api_domain_mapping
  enable_api_public_invoker = var.enable_api_public_invoker
  enable_web_custom_domain  = true

  firestore_location_id       = var.firestore_location_id
  firestore_delete_protection = false
}
