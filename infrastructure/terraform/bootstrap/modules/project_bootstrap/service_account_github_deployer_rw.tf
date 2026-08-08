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

  permissions = concat([
    "artifactregistry.repositories.create",
    "artifactregistry.repositories.delete",
    "artifactregistry.repositories.downloadArtifacts",
    "artifactregistry.repositories.get",
    "artifactregistry.repositories.list",
    "artifactregistry.repositories.uploadArtifacts",
    "artifactregistry.repositories.update",
    "datastore.databases.create",
    "datastore.databases.delete",
    "datastore.databases.get",
    # The Firestore Admin API checks getMetadata, not get, on databases.get.
    "datastore.databases.getMetadata",
    "datastore.databases.list",
    "datastore.databases.update",
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
    "iam.serviceAccounts.actAs",
    "iam.serviceAccounts.get",
    "iam.serviceAccounts.list",
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
    ], var.enable_cloud_run ? [
    # Terraform owns the domain mapping and the invoker IAM policy; the deploy
    # workflow owns the service itself, so both call paths are covered here.
    # `run.domainmappings.*` is absent from `roles/run.admin` and from
    # `gcloud iam list-testable-permissions`, but is enforced on refresh and is
    # accepted in a custom role.
    "run.configurations.get",
    "run.configurations.list",
    "run.domainmappings.create",
    "run.domainmappings.delete",
    "run.domainmappings.get",
    "run.domainmappings.list",
    "run.locations.list",
    "run.operations.get",
    "run.revisions.delete",
    "run.revisions.get",
    "run.revisions.list",
    "run.routes.get",
    # The deploy workflow mints an ID token to probe the service after rollout.
    "run.routes.invoke",
    "run.routes.list",
    "run.services.create",
    "run.services.get",
    "run.services.getIamPolicy",
    "run.services.list",
    "run.services.setIamPolicy",
    "run.services.update",
  ] : [])

  depends_on = [google_project_service.serviceusage]
}

resource "google_project_iam_member" "github_deployer_rw_applier" {
  project = google_project.env.project_id
  role    = google_project_iam_custom_role.github_deployer_rw_applier.name
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
