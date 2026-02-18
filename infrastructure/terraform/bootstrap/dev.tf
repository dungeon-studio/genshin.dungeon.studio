# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Dev project: development environment

# Bootstrap dev environment
module "dev" {
  source = "./modules/project_bootstrap"

  environment        = "dev"
  project_id         = "dungeon-studio-genshin-dev"
  project_name       = "DS Genshin Development"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name

  depends_on = [module.shared, module.core]
}

# Create WIF bindings for dev service accounts
module "github_oidc_bindings_dev" {
  source = "./modules/github_oidc_bindings"

  service_account_rw_email = module.dev.github_deployer_rw_email
  service_account_ro_email = module.dev.github_deployer_ro_email
  wif_pool_project_number  = module.shared.project_number

  depends_on = [google_iam_workload_identity_pool_provider.github, module.dev]
}

# Cross-project: Grant dev RO SA permission to read core resources
# Allows dev terraform to use data sources for core resources (DNS zones, etc.)
resource "google_project_iam_custom_role" "dev_ro_core_reader" {
  project     = module.core.project_id
  role_id     = "terraformDevCoreReader"
  title       = "Terraform Dev Core Reader"
  description = "Read-only access to selected core project resources needed by dev Terraform"

  # TODO: Refine this list to only the permissions required by dev Terraform data sources.
  permissions = [
    "resourcemanager.projects.get",
    "dns.managedZones.list",
    "dns.managedZones.get",
    "dns.resourceRecordSets.list"
  ]

  depends_on = [module.core]
}

resource "google_project_iam_member" "dev_ro_viewer_core" {
  project = module.core.project_id
  role    = google_project_iam_custom_role.dev_ro_core_reader.name
  member  = "serviceAccount:${module.dev.github_deployer_ro_email}"

  depends_on = [module.dev, module.core, google_project_iam_custom_role.dev_ro_core_reader]
}

# Cross-project: Grant dev RW SA permission to read core resources
# Needed during apply to access the same data sources used in plan
resource "google_project_iam_custom_role" "dev_rw_viewer_core" {
  project     = module.core.project_id
  role_id     = "devRwCoreReader"
  title       = "Dev RW Core Read-only"
  description = "Read-only access to core project resources required by the dev RW Terraform service account"

  permissions = [
    # Core project metadata
    "resourcemanager.projects.get",
    "resourcemanager.projects.getIamPolicy",

    # Common read access likely required by Terraform data sources.
    # Add or remove permissions here as usage is refined.
    "compute.projects.get",
    "compute.regions.list",
    "compute.zones.list",
    "compute.networks.get",
    "compute.networks.list",
    "compute.subnetworks.get",
    "compute.subnetworks.list",

    "dns.managedZones.get",
    "dns.managedZones.list",
    "dns.resourceRecordSets.list",

    "storage.buckets.get",
    "storage.buckets.list"
  ]

  depends_on = [module.core]
}

resource "google_project_iam_member" "dev_rw_viewer_core" {
  project = module.core.project_id
  role    = google_project_iam_custom_role.dev_rw_viewer_core.name
  member  = "serviceAccount:${module.dev.github_deployer_rw_email}"

  depends_on = [module.dev, module.core, google_project_iam_custom_role.dev_rw_viewer_core]
}

# In-project: Minimal read-only permission for bucket IAM policy refresh during plan.
resource "google_project_iam_custom_role" "dev_ro_bucket_iam_policy_reader" {
  project     = module.dev.project_id
  role_id     = "terraformPlanBucketIamReader"
  title       = "Terraform Plan Bucket IAM Reader"
  description = "Read Cloud Storage bucket IAM policies for Terraform plan refresh"

  permissions = [
    "storage.buckets.getIamPolicy"
  ]

  depends_on = [module.dev]
}

resource "google_project_iam_member" "dev_ro_bucket_iam_policy_reader" {
  project = module.dev.project_id
  role    = google_project_iam_custom_role.dev_ro_bucket_iam_policy_reader.name
  member  = "serviceAccount:${module.dev.github_deployer_ro_email}"

  condition {
    title       = "LimitToStateBucket"
    description = "Restrict bucket IAM policy read to the Terraform state bucket only"
    expression  = "resource.name == \"projects/_/buckets/${data.google_storage_bucket.state.name}\""
  }

  depends_on = [module.dev, google_project_iam_custom_role.dev_ro_bucket_iam_policy_reader]
}
