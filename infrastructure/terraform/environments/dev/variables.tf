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

variable "common_labels" {
  type        = map(string)
  description = "Common labels applied to all resources"
}

variable "enable_api_domain_mapping" {
  type        = bool
  description = "Whether to create the API Cloud Run custom domain mapping"
  default     = false
}

variable "enable_api_public_invoker" {
  type        = bool
  description = "Whether to grant allUsers the Cloud Run invoker role for API service"
  default     = false
}
