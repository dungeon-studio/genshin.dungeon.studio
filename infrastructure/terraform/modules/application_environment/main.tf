# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
    google-beta = {
      source = "hashicorp/google-beta"
    }
  }
}

# Identity Platform must trust the registrable domain for sign-in redirects no
# matter which environment serves, so it stays separate from the hostname.
locals {
  base_domain = "genshin.dungeon.studio"
  web_domain  = join(".", compact([var.web_subdomain, local.base_domain]))
}
