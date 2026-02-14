# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Workload Identity Federation bindings
# Allows GitHub Actions to impersonate service accounts via OIDC

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Construct the WIF principal for the repository
locals {
  wif_principal = "principalSet://iam.googleapis.com/projects/${var.wif_pool_project_number}/locations/global/workloadIdentityPools/github/attribute.repository/dungeon-studio/genshin.dungeon.studio"
}

# ============================================
# RW Service Account Bindings
# ============================================

# RW: workloadIdentityUser role
resource "google_service_account_iam_binding" "rw_workload_identity" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_rw_email}"
  role               = "roles/iam.workloadIdentityUser"
  members            = [local.wif_principal]
}

# RW: serviceAccountTokenCreator role
resource "google_service_account_iam_binding" "rw_token_creator" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_rw_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  members            = [local.wif_principal]
}

# ============================================
# RO Service Account Bindings
# ============================================

# RO: workloadIdentityUser role
resource "google_service_account_iam_binding" "ro_workload_identity" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_ro_email}"
  role               = "roles/iam.workloadIdentityUser"
  members            = [local.wif_principal]
}

# RO: serviceAccountTokenCreator role
resource "google_service_account_iam_binding" "ro_token_creator" {
  service_account_id = "projects/-/serviceAccounts/${var.service_account_ro_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  members            = [local.wif_principal]
}
