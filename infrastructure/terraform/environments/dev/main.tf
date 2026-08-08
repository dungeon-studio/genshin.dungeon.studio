# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

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
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}

# `web_domain` is this environment's own hostname; `base_domain` is the
# registrable domain every environment shares, which is what Identity Platform
# has to trust for sign-in redirects regardless of which environment serves.
locals {
  base_domain = "genshin.dungeon.studio"
  web_domain  = "develop.${local.base_domain}"
}
