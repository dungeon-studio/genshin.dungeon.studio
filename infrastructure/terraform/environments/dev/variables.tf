# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

variable "gcp_dev_project_id" {
  type        = string
  description = "GCP Project ID for development environment"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]*[a-z0-9])?$", var.gcp_dev_project_id)) && length(var.gcp_dev_project_id) >= 6 && length(var.gcp_dev_project_id) <= 30
    error_message = "Project ID must be 6-30 characters, start with lowercase letter, contain only lowercase letters/digits/hyphens, and not end with hyphen."
  }
}

variable "gcp_shared_project_id" {
  type        = string
  description = "GCP Project ID for shared infrastructure (where Workload Identity Pool is created)"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]*[a-z0-9])?$", var.gcp_shared_project_id)) && length(var.gcp_shared_project_id) >= 6 && length(var.gcp_shared_project_id) <= 30
    error_message = "Project ID must be 6-30 characters, start with lowercase letter, contain only lowercase letters/digits/hyphens, and not end with hyphen."
  }
}

variable "gcp_shared_project_number" {
  type        = string
  description = "GCP Project number for shared infrastructure (needed for Workload Identity Pool reference)"

  validation {
    condition     = can(regex("^\\d{12}$", var.gcp_shared_project_number))
    error_message = "Project number must be exactly 12 digits."
  }
}
