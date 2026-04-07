# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# RW service account
resource "google_service_account" "github_deployer_rw" {
  project      = google_project.env.project_id
  account_id   = "github-deployer-rw"
  display_name = "GitHub Applier"
  description  = "GitHub Actions service account with write access for deployments"

  depends_on = [google_project_service.serviceusage]
}

resource "google_project_iam_custom_role" "github_deployer_rw_applier" {
  project     = google_project.env.project_id
  role_id     = "githubDeployerApplier"
  title       = "GitHub Deployer Applier"
  description = "Least-privilege base role for Terraform apply workflows"

  # Keep this role scoped to project-level mutate/read permissions needed by
  # `infrastructure/terraform/environments/*` during `terraform apply`.
  # Prefer adding narrowly scoped permissions here over granting broad roles
  # such as `roles/editor`.

  permissions = [
    "artifactregistry.repositories.create",
    "artifactregistry.repositories.delete",
    "artifactregistry.repositories.downloadArtifacts",
    "artifactregistry.repositories.get",
    "artifactregistry.repositories.list",
    "artifactregistry.repositories.uploadArtifacts",
    "artifactregistry.repositories.update",
    "datastore.databases.get",
    "datastore.databases.list",
    "dns.changes.create",
    "dns.changes.get",
    "dns.changes.list",
    "dns.managedZones.create",
    "dns.managedZones.delete",
    "dns.managedZones.get",
    "dns.managedZones.list",
    "dns.managedZones.update",
    "dns.resourceRecordSets.create",
    "dns.resourceRecordSets.delete",
    "dns.resourceRecordSets.list",
    "dns.resourceRecordSets.update",
    "firebase.clients.create",
    "firebase.clients.delete",
    "firebase.clients.get",
    "firebase.clients.list",
    "firebase.clients.update",
    "firebase.projects.get",
    "firebase.projects.update",
    "firebaseauth.configs.create",
    "firebaseauth.configs.get",
    "firebaseauth.configs.update",
    "firebasehosting.sites.create",
    "firebasehosting.sites.delete",
    "firebasehosting.sites.get",
    "firebasehosting.sites.list",
    "firebasehosting.sites.update",
    "resourcemanager.projects.get",
    "secretmanager.secrets.create",
    "secretmanager.secrets.delete",
    "secretmanager.secrets.get",
    "secretmanager.secrets.list",
    "secretmanager.secrets.update",
    "secretmanager.versions.access",
    "secretmanager.versions.add",
    "secretmanager.versions.destroy",
    "secretmanager.versions.get",
    "secretmanager.versions.list",
    "serviceusage.services.enable",
    "serviceusage.services.get",
    "serviceusage.services.list",
    "serviceusage.services.use",
    "storage.buckets.create",
    "storage.buckets.delete",
    "storage.buckets.get",
    "storage.buckets.getIamPolicy",
    "storage.buckets.list",
    "storage.buckets.setIamPolicy",
    "storage.buckets.update",
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.get",
    "storage.objects.list",
    "storage.objects.update"
  ]

  depends_on = [google_project_service.serviceusage]
}

resource "google_project_iam_member" "github_deployer_rw_applier" {
  project = google_project.env.project_id
  role    = google_project_iam_custom_role.github_deployer_rw_applier.name
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

# Grant permission to create and manage service accounts in this project
# Needed if environment terraform creates application service accounts
resource "google_project_iam_member" "github_deployer_rw_sa_admin" {
  project = google_project.env.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

# Required for Cloud Run deploy to act as the default Compute Engine SA
resource "google_project_iam_member" "github_deployer_rw_sa_user" {
  project = google_project.env.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

# Required for google_firestore_database (datastore.databases.create)
resource "google_project_iam_member" "github_deployer_rw_datastore_owner" {
  project = google_project.env.project_id
  role    = "roles/datastore.owner"
  member  = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_rw_state_bucket" {
  bucket = var.state_bucket_name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_rw_bucket_reader" {
  bucket = var.state_bucket_name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.github_deployer_rw.email}"
}
