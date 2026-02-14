# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Dev environment RO service account (created by bootstrap), set up Workload Identity bindings

data "google_service_account" "github_deployer_ro_dev" {
  project    = var.gcp_dev_project_id
  account_id = "github-deployer-ro"
}

# Bind dev RO SA to Workload Identity
resource "google_service_account_iam_binding" "github_deployer_ro_dev_workload_identity" {
  service_account_id = data.google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]

  depends_on = [google_iam_workload_identity_pool_provider.github]
}

# Grant token creator to dev RO SA
resource "google_service_account_iam_binding" "github_deployer_ro_dev_token_creator" {
  service_account_id = data.google_service_account.github_deployer_ro_dev.name
  role               = "roles/iam.serviceAccountTokenCreator"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.shared.number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio",
  ]
}
