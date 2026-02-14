# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Bootstrap environment: creates GCP projects with foundational setup

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
}

# Validate the state bucket exists in the shared project
# Foundational infrastructure: state bucket for all environments
data "google_storage_bucket" "state" {
  name    = "dungeon-studio-genshin-tfstate"
  project = "dungeon-studio-genshin-shared"
}
