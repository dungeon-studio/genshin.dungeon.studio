# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "web_bucket_name" {
  description = "Cloud Storage bucket hosting the web application"
  value       = google_storage_bucket.web.name
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
