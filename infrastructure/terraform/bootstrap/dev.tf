# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Dev project: development environment

# Bootstrap dev environment
module "dev" {
  source = "./modules/project_bootstrap"

  environment        = "dev"
  project_id         = "dungeon-studio-genshin-dev"
  project_name       = "DS Genshin Development"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name

  depends_on = [module.shared, module.core]
}

# Create WIF bindings for dev service accounts
module "github_oidc_bindings_dev" {
  source = "./modules/github_oidc_bindings"

  service_account_rw_email = module.dev.github_deployer_rw_email
  service_account_ro_email = module.dev.github_deployer_ro_email
  wif_pool_project_number  = module.shared.project_number

  depends_on = [google_iam_workload_identity_pool_provider.github, module.dev]
}

# Cross-project: Grant dev RO SA permission to read core resources
# Allows dev terraform to use data sources for core resources (DNS zones, etc.)
resource "google_project_iam_member" "dev_ro_viewer_core" {
  project = module.core.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${module.dev.github_deployer_ro_email}"

  depends_on = [module.dev, module.core]
}

# Cross-project: Grant dev RW SA permission to read core resources
# Needed during apply to access the same data sources used in plan
resource "google_project_iam_member" "dev_rw_viewer_core" {
  project = module.core.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${module.dev.github_deployer_rw_email}"

  depends_on = [module.dev, module.core]
}

# In-project: Allow dev RW SA to manage Cloud Run service IAM policies.
# Required for environment Terraform resources such as
# `google_cloud_run_service_iam_member` in dev.
resource "google_project_iam_member" "dev_rw_run_admin" {
  project = module.dev.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${module.dev.github_deployer_rw_email}"

  depends_on = [module.dev]
}

# In-project: Minimal read-only permission for bucket IAM policy refresh during plan.
resource "google_project_iam_custom_role" "dev_ro_bucket_iam_policy_reader" {
  project     = module.dev.project_id
  role_id     = "terraformPlanBucketIamReader"
  title       = "Terraform Plan Bucket IAM Reader"
  description = "Read Cloud Storage bucket IAM policies for Terraform plan refresh"

  permissions = [
    "storage.buckets.getIamPolicy"
  ]

  depends_on = [module.dev]
}

resource "google_project_iam_member" "dev_ro_bucket_iam_policy_reader" {
  project = module.dev.project_id
  role    = google_project_iam_custom_role.dev_ro_bucket_iam_policy_reader.name
  member  = "serviceAccount:${module.dev.github_deployer_ro_email}"

  depends_on = [module.dev, google_project_iam_custom_role.dev_ro_bucket_iam_policy_reader]
}
