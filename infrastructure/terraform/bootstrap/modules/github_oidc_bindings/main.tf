# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Workload Identity Federation bindings
# Allows GitHub Actions to impersonate service accounts via OIDC

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.43.0"
    }
  }
}

locals {
  wif_pool = "iam.googleapis.com/projects/${var.wif_pool_project_number}/locations/global/workloadIdentityPools/github"

  # The RW deployer is assumed only by jobs inside a GitHub environment (deploy,
  # terraform-apply), so its trust is scoped to that environment claim: a
  # workflow outside the environment cannot impersonate it, even from this
  # repository.
  rw_principal = "principalSet://${local.wif_pool}/attribute.environment/${var.github_environment}"

  # The RO planner is assumed by terraform-plan on pull_request, which carries no
  # environment claim, so its trust stays scoped to the repository.
  ro_principal = "principalSet://${local.wif_pool}/attribute.repository/dungeon-studio/genshin.dungeon.studio"
}

# ============================================
# RW Service Account Bindings
# ============================================

# RW: workloadIdentityUser role
resource "google_service_account_iam_binding" "rw_workload_identity" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_rw_email}"
  role               = "roles/iam.workloadIdentityUser"
  members            = [local.rw_principal]
}

# RW: serviceAccountTokenCreator role
resource "google_service_account_iam_binding" "rw_token_creator" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_rw_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  members            = [local.rw_principal]
}

# ============================================
# RO Service Account Bindings
# ============================================

# RO: workloadIdentityUser role
resource "google_service_account_iam_binding" "ro_workload_identity" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_ro_email}"
  role               = "roles/iam.workloadIdentityUser"
  members            = [local.ro_principal]
}

# RO: serviceAccountTokenCreator role
resource "google_service_account_iam_binding" "ro_token_creator" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_ro_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  members            = [local.ro_principal]
}
