# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "web_hosting_site_id" {
  description = "Firebase Hosting site ID for the web application"
  value       = module.application_environment.web_hosting_site_id
  sensitive   = false
}

output "api_artifact_repository_id" {
  description = "Artifact Registry repository used for API container images (full resource ID)"
  value       = module.application_environment.api_artifact_repository_id
  sensitive   = false
}

output "firestore_database_name" {
  description = "Firestore database name for the development environment"
  value       = module.application_environment.firestore_database_name
  sensitive   = false
}

output "firestore_location_id" {
  description = "Firestore location ID for the development environment"
  value       = module.application_environment.firestore_location_id
  sensitive   = false
}

output "firebase_auth_config_name" {
  description = "Identity Platform config resource name for the development environment"
  value       = module.application_environment.firebase_auth_config_name
  sensitive   = false
}

output "firebase_web_app_config" {
  description = "Firebase Web App SDK config for the frontend build"
  value       = module.application_environment.firebase_web_app_config
  sensitive   = true
}
