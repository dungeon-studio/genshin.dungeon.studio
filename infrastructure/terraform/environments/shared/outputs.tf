# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Workload Identity Provider resource name for GitHub Actions (shared across all environments)"
}

output "github_deployer_rw_shared_service_account_email" {
  value       = data.google_service_account.github_deployer_rw_shared.email
  description = "GitHub Applier service account email for shared environment"
}

output "github_deployer_ro_shared_service_account_email" {
  value       = data.google_service_account.github_deployer_ro_shared.email
  description = "GitHub Planner service account email for shared environment"
}
