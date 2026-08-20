# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# The bootstrap module labels this project `production` while everything
# addressable here says `prod`. That label is not an addressing scheme, so the
# mismatch is deliberate rather than drift.

terraform {
  required_version = "1.15.8"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.44.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "7.44.0"
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
  web_domain  = local.base_domain
}
