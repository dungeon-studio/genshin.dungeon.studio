# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Core project: common resources across environments

# Bootstrap core infrastructure (common resources across environments)
module "core" {
  source = "./modules/project_bootstrap"

  environment        = "production"
  project_id         = "dungeon-studio-genshin-core"
  project_name       = "DS Genshin Core"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name

  depends_on = [module.shared]
}

# Create WIF bindings for core service accounts
module "github_oidc_bindings_core" {
  source = "./modules/github_oidc_bindings"

  service_account_rw_email = module.core.github_deployer_rw_email
  service_account_ro_email = module.core.github_deployer_ro_email
  wif_pool_project_number  = module.shared.project_number

  depends_on = [google_iam_workload_identity_pool_provider.github, module.core]
}
