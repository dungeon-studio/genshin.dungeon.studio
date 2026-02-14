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
data "google_storage_bucket" "state" {
  name    = "dungeon-studio-genshin-tfstate"
  project = "dungeon-studio-genshin-shared"
}

# Bootstrap shared infrastructure first (other environments depend on this)
module "shared" {
  source = "./modules/project_bootstrap"

  environment        = "production"
  project_id         = "dungeon-studio-genshin-shared"
  project_name       = "DS Genshin Shared"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name
}

# Bootstrap dev environment (depends on shared existing)
module "dev" {
  source = "./modules/project_bootstrap"

  environment        = "dev"
  project_id         = "dungeon-studio-genshin-dev"
  project_name       = "DS Genshin Development"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name

  depends_on = [module.shared]
}

# Grant shared RW SA permission to manage service account IAM in shared project
# This allows shared terraform to set up Workload Identity bindings for shared SAs
resource "google_project_iam_member" "shared_rw_sa_admin_shared" {
  project = module.shared.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${module.shared.github_deployer_rw_email}"

  depends_on = [module.shared]
}

# Grant shared RW SA permission to manage service account IAM in dev project
# This allows shared terraform to set up Workload Identity bindings for dev SAs
resource "google_project_iam_member" "shared_rw_sa_admin_dev" {
  project = module.dev.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${module.shared.github_deployer_rw_email}"

  depends_on = [module.dev, module.shared]
}

# Cross-project: Grant shared RO SA permission to read service accounts in dev project
# Required for data sources that reference dev service accounts in shared terraform
resource "google_project_iam_member" "shared_ro_sa_viewer_dev" {
  project = module.dev.project_id
  role    = "roles/iam.serviceAccountViewer"
  member  = "serviceAccount:${module.shared.github_deployer_ro_email}"

  depends_on = [module.dev, module.shared]
}
