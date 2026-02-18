# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  api_artifact_repository_name     = "api"
  api_artifact_repository_location = "europe-west1"
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
  location      = local.api_artifact_repository_location
  repository_id = local.api_artifact_repository_name
  format        = "DOCKER"

  labels = var.common_labels

  depends_on = [google_project_service.artifactregistry]
}

# Cloud Run custom domain mapping for API service.
# NOTE: The mapped service route (`api`) is created by CI/CD deploy,
# so this resource has an external ordering dependency on a successful deploy.
# Keep this in `dev` to avoid core->dev state dependencies.
resource "google_cloud_run_domain_mapping" "api" {
  project  = var.gcp_dev_project_id
  location = local.api_artifact_repository_loc
  name     = "api.develop.genshin.dungeon.studio"

  metadata {
    namespace = var.gcp_dev_project_id
  }

  spec {
    route_name       = "api"
    certificate_mode = "AUTOMATIC"
  }

  depends_on = [google_project_service.cloudrun]
}
