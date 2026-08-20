# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

variable "project_id" {
  type        = string
  description = "GCP Project ID for core infrastructure"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]*[a-z0-9])?$", var.project_id)) && length(var.project_id) >= 6 && length(var.project_id) <= 30
    error_message = "Project ID must be 6-30 characters, start with lowercase letter, contain only lowercase letters/digits/hyphens, and not end with hyphen."
  }
}
