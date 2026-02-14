# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Create the project
resource "google_project" "env" {
  name                = var.project_name
  project_id          = var.project_id
  auto_create_network = false
  billing_account     = var.billing_account_id

  labels = {
    environment = var.environment
    created_by  = "bootstrap"
    managed_by  = "terraform"
  }
}

# Enable foundational APIs
resource "google_project_service" "iam" {
  project = google_project.env.project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "serviceusage" {
  project = google_project.env.project_id
  service = "serviceusage.googleapis.com"

  disable_on_destroy = false

  depends_on = [google_project_service.iam]
}

# Create RW service account
resource "google_service_account" "github_deployer_rw" {
  project      = google_project.env.project_id
  account_id   = "github-deployer-rw"
  display_name = "GitHub Applier"
  description  = "GitHub Actions service account with write access for deployments"

  depends_on = [google_project_service.serviceusage]
}

# Grant RW SA editor access to project
resource "google_project_iam_member" "github_deployer_rw_editor" {
  project = google_project.env.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

# Create RO service account
resource "google_service_account" "github_deployer_ro" {
  project      = google_project.env.project_id
  account_id   = "github-deployer-ro"
  display_name = "GitHub Planner"
  description  = "GitHub Actions service account with read-only access for plan runs"

  depends_on = [google_project_service.serviceusage]
}

# Grant RO SA viewer access to project
resource "google_project_iam_member" "github_deployer_ro_viewer" {
  project = google_project.env.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro.email}"
}
