# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "project_id" {
  description = "The created GCP project ID"
  value       = google_project.env.project_id
  sensitive   = false
}

output "project_number" {
  description = "The created GCP project number"
  value       = google_project.env.number
  sensitive   = false
}

output "github_deployer_rw_email" {
  description = "Email of the RW service account"
  value       = google_service_account.github_deployer_rw.email
  sensitive   = false
}

output "github_deployer_ro_email" {
  description = "Email of the RO service account"
  value       = google_service_account.github_deployer_ro.email
  sensitive   = false
}
