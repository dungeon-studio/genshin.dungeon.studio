# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

variable "gcp_core_project_id" {
  type        = string
  description = "GCP Project ID for core infrastructure"

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?$", var.gcp_core_project_id)) && length(var.gcp_core_project_id) >= 6 && length(var.gcp_core_project_id) <= 30
    error_message = "Project ID must be 6-30 characters, lowercase alphanumeric with hyphens, starting and ending with alphanumeric characters."
  }
}
