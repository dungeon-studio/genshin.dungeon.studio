# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "github_deployer_dev_service_account_email" {
  value       = google_service_account.github_deployer_dev.email
  description = "Service account email for GitHub Actions deployment in dev"
}
