# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Workload Identity Federation bindings module
# Creates IAM bindings to allow GitHub Actions to impersonate service accounts via OIDC

variable "service_account_rw_email" {
  type        = string
  description = "Email of the RW service account to bind to WIF"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*@[a-z0-9][a-z0-9-]*\\.iam\\.gserviceaccount\\.com$", var.service_account_rw_email))
    error_message = "Service account email must be in the format: name@project-id.iam.gserviceaccount.com"
  }
}

variable "service_account_ro_email" {
  type        = string
  description = "Email of the RO service account to bind to WIF"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*@[a-z0-9][a-z0-9-]*\\.iam\\.gserviceaccount\\.com$", var.service_account_ro_email))
    error_message = "Service account email must be in the format: name@project-id.iam.gserviceaccount.com"
  }
}

variable "wif_pool_project_number" {
  type        = string
  description = "GCP project number where the Workload Identity Pool is created (numeric string)"

  validation {
    condition     = can(regex("^[0-9]+$", var.wif_pool_project_number))
    error_message = "Project number must be a numeric string (e.g., '123456789012')"
  }
}
