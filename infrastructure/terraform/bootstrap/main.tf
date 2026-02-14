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

# Bootstrap shared infrastructure first (other environments depend on this)
module "shared" {
  source = "./modules/project_bootstrap"

  environment        = "production"
  project_id         = "dungeon-studio-genshin-shared"
  project_name       = "DS Genshin Shared"
  billing_account_id = var.billing_account_id
}

# Bootstrap dev environment (depends on shared existing)
module "dev" {
  source = "./modules/project_bootstrap"

  environment        = "dev"
  project_id         = "dungeon-studio-genshin-dev"
  project_name       = "DS Genshin Development"
  billing_account_id = var.billing_account_id

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
