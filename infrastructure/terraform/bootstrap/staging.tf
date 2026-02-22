# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Staging project: pre-production infrastructure environment

# Bootstrap staging environment
module "staging" {
  source = "./modules/project_bootstrap"

  environment        = "staging"
  project_id         = "dungeon-studio-genshin-staging"
  project_name       = "DS Genshin Staging"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name

  depends_on = [module.shared, module.core]
}

# Create WIF bindings for staging service accounts
module "github_oidc_bindings_staging" {
  source = "./modules/github_oidc_bindings"

  service_account_rw_email = module.staging.github_deployer_rw_email
  service_account_ro_email = module.staging.github_deployer_ro_email
  wif_pool_project_number  = module.shared.project_number

  depends_on = [google_iam_workload_identity_pool_provider.github, module.staging]
}

# Cross-project: Grant staging RO SA permission to read core resources
# Allows staging terraform to use data sources for core resources (DNS zones, etc.)
resource "google_project_iam_member" "staging_ro_viewer_core" {
  project = module.core.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${module.staging.github_deployer_ro_email}"

  depends_on = [module.staging, module.core]
}

# Cross-project: Grant staging RW SA permission to read core resources
# Needed during apply to access the same data sources used in plan
resource "google_project_iam_member" "staging_rw_viewer_core" {
  project = module.core.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${module.staging.github_deployer_rw_email}"

  depends_on = [module.staging, module.core]
}

# In-project: Allow staging RW SA to manage Cloud Run service IAM policies.
# Required for environment Terraform resources such as
# `google_cloud_run_service_iam_member` in staging.
resource "google_project_iam_member" "staging_rw_run_admin" {
  project = module.staging.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${module.staging.github_deployer_rw_email}"

  depends_on = [module.staging]
}

# In-project: Minimal read-only permission for bucket IAM policy refresh during plan.
resource "google_project_iam_custom_role" "staging_ro_bucket_iam_policy_reader" {
  project     = module.staging.project_id
  role_id     = "terraformPlanBucketIamReader"
  title       = "Terraform Plan Bucket IAM Reader"
  description = "Read Cloud Storage bucket IAM policies for Terraform plan refresh"

  permissions = [
    "storage.buckets.getIamPolicy"
  ]

  depends_on = [module.staging]
}

resource "google_project_iam_member" "staging_ro_bucket_iam_policy_reader" {
  project = module.staging.project_id
  role    = google_project_iam_custom_role.staging_ro_bucket_iam_policy_reader.name
  member  = "serviceAccount:${module.staging.github_deployer_ro_email}"

  depends_on = [module.staging, google_project_iam_custom_role.staging_ro_bucket_iam_policy_reader]
}
