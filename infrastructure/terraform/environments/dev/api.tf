# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  api_artifact_repository_name = "api"
  api_artifact_repository_loc  = "europe-west1"
}

# Enable APIs required for API image storage and runtime deployment
resource "google_project_service" "artifactregistry" {
  project = var.gcp_dev_project_id
  service = "artifactregistry.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "cloudrun" {
  project = var.gcp_dev_project_id
  service = "run.googleapis.com"

  disable_on_destroy = false
}

# Artifact Registry repository for API container images
resource "google_artifact_registry_repository" "api" {
  project       = var.gcp_dev_project_id
  location      = local.api_artifact_repository_loc
  repository_id = local.api_artifact_repository_name
  format        = "DOCKER"

  labels = var.common_labels

  depends_on = [google_project_service.artifactregistry]
}
