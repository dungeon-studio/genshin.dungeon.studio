# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "shared_project_id" {
  value       = module.shared.project_id
  description = "Shared project ID"
}

output "dev_project_id" {
  value       = module.dev.project_id
  description = "Dev project ID"
}

output "github_deployer_rw_dev_service_account_email" {
  value       = module.dev.github_deployer_rw_email
  description = "GitHub Applier service account email for dev environment"
}

output "github_deployer_ro_dev_service_account_email" {
  value       = module.dev.github_deployer_ro_email
  description = "GitHub Planner service account email for dev environment"
}
