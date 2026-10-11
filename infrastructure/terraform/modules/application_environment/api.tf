# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  api_artifact_repository_name     = "api"
  api_artifact_repository_location = "europe-west1"
  api_cloud_run_location           = "europe-west1"
  # Cloud Run expects a bare name, unlike the trailing-dot FQDN in `core`'s CNAME.
  api_domain_name = "api.${local.web_domain}"
  api_route_name  = "api"
}

resource "google_project_service" "artifactregistry" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "cloudrun" {
  project = var.project_id
  service = "run.googleapis.com"

  disable_on_destroy = false
}

# The deploy workflow owns the Cloud Run service itself, so application deploys
# never wait on a Terraform apply.

resource "google_artifact_registry_repository" "api" {
  project       = var.project_id
  location      = local.api_artifact_repository_location
  repository_id = local.api_artifact_repository_name
  format        = "DOCKER"

  labels = var.common_labels

  depends_on = [google_project_service.artifactregistry]
}

# Applies only after a deploy has created the `api` route. It lives here, not in
# `core`, so `core` never reads environment state.
resource "google_cloud_run_domain_mapping" "api" {
  count = var.enable_api_domain_mapping ? 1 : 0

  project  = var.project_id
  location = local.api_cloud_run_location
  name     = local.api_domain_name

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name       = local.api_route_name
    certificate_mode = "AUTOMATIC"
  }

  depends_on = [google_project_service.cloudrun]
}

# Applies only after a deploy has created the `api` service.
resource "google_cloud_run_service_iam_member" "api_public_invoker" {
  count = var.enable_api_public_invoker ? 1 : 0

  project  = var.project_id
  location = local.api_cloud_run_location
  service  = local.api_route_name

  role   = "roles/run.invoker"
  member = "allUsers"

  depends_on = [google_project_service.cloudrun]
}
