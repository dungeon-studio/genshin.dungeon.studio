# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "firebase_web_app_config" {
  description = "Firebase Web App SDK config for the frontend build"
  value       = module.application_environment.firebase_web_app_config
  sensitive   = true
}
