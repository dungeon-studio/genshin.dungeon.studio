# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "web_hosting_site_id" {
  description = "Firebase Hosting site ID for the web application"
  value       = google_firebase_hosting_site.web.site_id
  sensitive   = false
}

output "api_artifact_repository_id" {
  description = "Artifact Registry repository used for API container images (full resource ID)"
  value       = google_artifact_registry_repository.api.id
  sensitive   = false
}

output "firestore_database_name" {
  description = "Firestore database name for the development environment"
  value       = google_firestore_database.default.name
  sensitive   = false
}

output "firestore_location_id" {
  description = "Firestore location ID for the development environment"
  value       = google_firestore_database.default.location_id
  sensitive   = false
}

output "firebase_auth_config_name" {
  description = "Identity Platform config resource name for the development environment"
  value       = google_identity_platform_config.default.name
  sensitive   = false
}
