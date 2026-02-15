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
#
# DESIGN NOTE: This bootstrap configuration reads an existing state bucket in the
# dungeon-studio-genshin-shared project, while also creating that same shared project
# via module.shared. To avoid a bootstrapping deadlock:
#   - The shared project and state bucket MUST be created out-of-band first
#     (manually, via another Terraform configuration, or via previous bootstrap runs),
#   - Then imported into this Terraform state: `terraform import google_storage_bucket.state dungeon-studio-genshin-tfstate`
#
# This design is intentional: state storage is only for Disaster Recovery purposes,
# allowing complete re-creation of projects if needed. The state bucket itself is
# created separately and referenced here for validation and cross-project access.
data "google_storage_bucket" "state" {
  name    = "dungeon-studio-genshin-tfstate"
  project = "dungeon-studio-genshin-shared"
}
