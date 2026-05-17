# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Prod project: production environment

# Bootstrap prod environment
module "prod" {
  source = "./modules/project_bootstrap"

  environment        = "production"
  project_id         = "dungeon-studio-genshin-prod"
  project_name       = "DS Genshin Production"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name

  depends_on = [module.shared, module.core]
}

# Create WIF bindings for prod service accounts
module "github_oidc_bindings_prod" {
  source = "./modules/github_oidc_bindings"

  service_account_rw_email = module.prod.github_deployer_rw_email
  service_account_ro_email = module.prod.github_deployer_ro_email
  wif_pool_project_number  = module.shared.project_number

  depends_on = [google_iam_workload_identity_pool_provider.github, module.prod]
}

# Cross-project: Grant prod RO SA permission to read core resources
# Allows prod terraform to use data sources for core resources (DNS zones, etc.)
resource "google_project_iam_member" "prod_ro_viewer_core" {
  project = module.core.project_id
  role    = google_project_iam_custom_role.core_cross_project_reader.name
  member  = "serviceAccount:${module.prod.github_deployer_ro_email}"

  depends_on = [module.prod, module.core, google_project_iam_custom_role.core_cross_project_reader]
}

# Cross-project: Grant prod RW SA permission to read core resources
# Needed during apply to access the same data sources used in plan
resource "google_project_iam_member" "prod_rw_viewer_core" {
  project = module.core.project_id
  role    = google_project_iam_custom_role.core_cross_project_reader.name
  member  = "serviceAccount:${module.prod.github_deployer_rw_email}"

  depends_on = [module.prod, module.core, google_project_iam_custom_role.core_cross_project_reader]
}

# In-project: Allow prod RW SA to manage Cloud Run service IAM policies.
# Required for environment Terraform resources such as
# `google_cloud_run_service_iam_member` in prod.
resource "google_project_iam_member" "prod_rw_run_admin" {
  project = module.prod.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${module.prod.github_deployer_rw_email}"

  depends_on = [module.prod]
}
