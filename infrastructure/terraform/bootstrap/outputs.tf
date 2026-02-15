# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "shared_project_id" {
  value       = module.shared.project_id
  description = "Shared project ID (OIDC + state bucket, bootstrap-managed only)"
}

output "core_project_id" {
  value       = module.core.project_id
  description = "Core project ID (common resources across environments)"
}

output "dev_project_id" {
  value       = module.dev.project_id
  description = "Dev project ID"
}

output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Workload Identity Provider resource name for GitHub Actions"
}

output "github_deployer_rw_core_service_account_email" {
  value       = module.core.github_deployer_rw_email
  description = "GitHub Applier service account email for core environment"
}

output "github_deployer_ro_core_service_account_email" {
  value       = module.core.github_deployer_ro_email
  description = "GitHub Planner service account email for core environment"
}

output "github_deployer_rw_dev_service_account_email" {
  value       = module.dev.github_deployer_rw_email
  description = "GitHub Applier service account email for dev environment"
}

output "github_deployer_ro_dev_service_account_email" {
  value       = module.dev.github_deployer_ro_email
  description = "GitHub Planner service account email for dev environment"
}

# Copy-pastable GitHub secrets configuration
output "github_secrets_setup" {
  value       = <<-EOT

    == GitHub Secrets Configuration ==

    == Repository-level secrets (Settings → Secrets → Actions): ==

    GCP_RO_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RO_CORE_SERVICE_ACCOUNT_EMAIL = ${module.core.github_deployer_ro_email}
    GCP_RO_DEV_SERVICE_ACCOUNT_EMAIL = ${module.dev.github_deployer_ro_email}

    == Dependabot secrets (Settings → Secrets and variables → Dependabot): ==

    GCP_RO_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RO_CORE_SERVICE_ACCOUNT_EMAIL = ${module.core.github_deployer_ro_email}
    GCP_RO_DEV_SERVICE_ACCOUNT_EMAIL = ${module.dev.github_deployer_ro_email}

    == Environment-level secrets for 'core' (Settings → Environments → core → Secrets): ==

    GCP_RW_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RW_CORE_SERVICE_ACCOUNT_EMAIL = ${module.core.github_deployer_rw_email}

    == Environment-level secrets for 'dev' (Settings → Environments → dev → Secrets): ==

    GCP_RW_WORKLOAD_IDENTITY_PROVIDER = ${google_iam_workload_identity_pool_provider.github.name}
    GCP_RW_DEV_SERVICE_ACCOUNT_EMAIL = ${module.dev.github_deployer_rw_email}
  EOT
  description = "Copy-pastable guide for setting up GitHub secrets"
}
