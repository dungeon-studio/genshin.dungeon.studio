# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "shared_project_id" {
  value       = module.shared.project_id
  description = "Shared project ID (OIDC + state bucket, bootstrap-managed only)"
  sensitive   = false
}

output "core_project_id" {
  value       = module.core.project_id
  description = "Core project ID (common resources across environments)"
  sensitive   = false
}

output "dev_project_id" {
  value       = module.dev.project_id
  description = "Dev project ID"
  sensitive   = false
}

output "staging_project_id" {
  value       = module.staging.project_id
  description = "Staging project ID"
  sensitive   = false
}

output "prod_project_id" {
  value       = module.prod.project_id
  description = "Prod project ID"
  sensitive   = false
}

output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Workload Identity Provider resource name for GitHub Actions"
  sensitive   = false
}

output "github_deployer_rw_core_service_account_email" {
  value       = module.core.github_deployer_rw_email
  description = "GitHub Applier service account email for core environment"
  sensitive   = false
}

output "github_deployer_ro_core_service_account_email" {
  value       = module.core.github_deployer_ro_email
  description = "GitHub Planner service account email for core environment"
  sensitive   = false
}

output "github_deployer_rw_dev_service_account_email" {
  value       = module.dev.github_deployer_rw_email
  description = "GitHub Applier service account email for dev environment"
  sensitive   = false
}

output "github_deployer_ro_dev_service_account_email" {
  value       = module.dev.github_deployer_ro_email
  description = "GitHub Planner service account email for dev environment"
  sensitive   = false
}

output "github_deployer_rw_staging_service_account_email" {
  value       = module.staging.github_deployer_rw_email
  description = "GitHub Applier service account email for staging environment"
  sensitive   = false
}

output "github_deployer_ro_staging_service_account_email" {
  value       = module.staging.github_deployer_ro_email
  description = "GitHub Planner service account email for staging environment"
  sensitive   = false
}

output "github_deployer_rw_prod_service_account_email" {
  value       = module.prod.github_deployer_rw_email
  description = "GitHub Applier service account email for prod environment"
  sensitive   = false
}

output "github_deployer_ro_prod_service_account_email" {
  value       = module.prod.github_deployer_ro_email
  description = "GitHub Planner service account email for prod environment"
  sensitive   = false
}

# Copy-pastable GitHub Actions configuration guide.
# The Workload Identity provider and deployer service-account emails are
# non-secret configuration, so they are stored as Actions variables. Actions
# secrets are reserved for genuine third-party tokens (CODECOV_TOKEN,
# CLAUDE_API_KEY).
output "github_actions_setup" {
  value       = <<-EOT

    == GitHub Actions Configuration ==

    == Repository-level variables (Settings → Secrets and variables → Actions → Variables): ==

    GCP_RO_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RO_CORE_SERVICE_ACCOUNT_EMAIL = ${module.core.github_deployer_ro_email}
    GCP_RO_DEV_SERVICE_ACCOUNT_EMAIL = ${module.dev.github_deployer_ro_email}
    GCP_RO_STAGING_SERVICE_ACCOUNT_EMAIL = ${module.staging.github_deployer_ro_email}
    GCP_RO_PROD_SERVICE_ACCOUNT_EMAIL = ${module.prod.github_deployer_ro_email}

    == Environment-level variables for 'core' (Settings → Environments → core → Variables): ==

    GCP_RW_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RW_CORE_SERVICE_ACCOUNT_EMAIL = ${module.core.github_deployer_rw_email}

    == Environment-level variables for 'dev' (Settings → Environments → dev → Variables): ==

    GCP_RW_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RW_DEV_SERVICE_ACCOUNT_EMAIL = ${module.dev.github_deployer_rw_email}

    == Environment-level variables for 'staging' (Settings → Environments → staging → Variables): ==

    GCP_RW_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RW_STAGING_SERVICE_ACCOUNT_EMAIL = ${module.staging.github_deployer_rw_email}

    == Environment-level variables for 'prod' (Settings → Environments → prod → Variables): ==

    GCP_RW_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RW_PROD_SERVICE_ACCOUNT_EMAIL = ${module.prod.github_deployer_rw_email}
  EOT
  description = "Copy-pastable guide for setting up GitHub Actions variables"
  sensitive   = false
}
