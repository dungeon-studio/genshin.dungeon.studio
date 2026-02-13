# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

data "google_project" "shared" {
  project_id = var.gcp_shared_project_id
}

resource "google_project_service" "dev_iam" {
  project = var.gcp_dev_project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
}

resource "google_service_account" "github_deployer_dev" {
  project      = var.gcp_dev_project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions deployments"
}

# Security: Bind service account to shared Workload Identity Pool
# This allows GitHub Actions to impersonate this service account via Workload Identity
resource "google_service_account_iam_binding" "github_deployer_dev_workload_identity" {
  service_account_id = google_service_account.github_deployer_dev.name
  role               = "roles/iam.workloadIdentityUser"

  # References the Workload Identity Pool created in the shared environment
  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.actor/dungeon-studio/genshin.dungeon.studio",
  ]
}
