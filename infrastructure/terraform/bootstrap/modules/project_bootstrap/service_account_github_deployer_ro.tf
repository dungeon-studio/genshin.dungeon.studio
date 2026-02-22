# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# RO service account
resource "google_service_account" "github_deployer_ro" {
  project      = google_project.env.project_id
  account_id   = "github-deployer-ro"
  display_name = "GitHub Planner"
  description  = "GitHub Actions service account with read-only access for plan runs"

  depends_on = [google_project_service.serviceusage]
}

resource "google_project_iam_custom_role" "github_deployer_ro_planner" {
  project     = google_project.env.project_id
  role_id     = "githubDeployerPlanner"
  title       = "GitHub Deployer Planner"
  description = "Least-privilege read role for Terraform plan workflows"

  # Keep this list limited to read/refresh permissions required by
  # `infrastructure/terraform/environments/*` during `terraform plan`.
  # When adding new environment resources, extend this role only for
  # plan-time read failures and avoid broad predefined project roles.

  permissions = [
    "artifactregistry.repositories.get",
    "artifactregistry.repositories.list",
    "datastore.databases.get",
    "datastore.databases.list",
    "dns.managedZones.get",
    "dns.managedZones.list",
    "dns.resourceRecordSets.list",
    "iam.serviceAccounts.get",
    "iam.serviceAccounts.list",
    "resourcemanager.projects.get",
    "run.domainmappings.get",
    "run.domainmappings.list",
    "run.services.get",
    "run.services.list",
    "serviceusage.services.get",
    "serviceusage.services.list",
    "storage.buckets.get",
    "storage.buckets.getIamPolicy",
    "storage.buckets.list"
  ]

  depends_on = [google_project_service.serviceusage]
}

resource "google_project_iam_member" "github_deployer_ro_planner" {
  project = google_project.env.project_id
  role    = google_project_iam_custom_role.github_deployer_ro_planner.name
  member  = "serviceAccount:${google_service_account.github_deployer_ro.email}"
}

resource "google_project_iam_member" "github_deployer_ro_sa_viewer" {
  project = google_project.env.project_id
  role    = "roles/iam.serviceAccountViewer"
  member  = "serviceAccount:${google_service_account.github_deployer_ro.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_ro_state_bucket" {
  bucket = var.state_bucket_name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_ro_bucket_reader" {
  bucket = var.state_bucket_name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.github_deployer_ro.email}"
}
