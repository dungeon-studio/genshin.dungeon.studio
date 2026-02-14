# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Bootstrap module: creates a GCP project with foundational setup and service accounts

variable "environment" {
  type        = string
  description = "Environment name"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

variable "project_id" {
  type        = string
  description = "GCP Project ID to create"

  validation {
    condition     = length(var.project_id) >= 6 && length(var.project_id) <= 30 && can(regex("^[a-z]([a-z0-9-]*[a-z0-9])?$", var.project_id))
    error_message = "Project ID must be 6-30 characters, start with lowercase letter, contain only lowercase letters/digits/hyphens, and not end with hyphen"
  }
}

variable "project_name" {
  type        = string
  description = "Display name for the project"

  validation {
    condition     = length(var.project_name) >= 4 && length(var.project_name) <= 30
    error_message = "Project name must be 4-30 characters"
  }
}

variable "billing_account_id" {
  type        = string
  description = "Billing account ID to attach to the project"

  validation {
    condition     = can(regex("^[0-9A-Z]{6}-[0-9A-Z]{6}-[0-9A-Z]{6}$", var.billing_account_id))
    error_message = "Billing account ID must be 18 characters: XXXXXX-XXXXXX-XXXXXX (6 alphanumeric, hyphen, 6 alphanumeric, hyphen, 6 alphanumeric)"
  }
}

variable "state_bucket_name" {
  type        = string
  description = "Name of the GCS bucket for Terraform state storage"

  validation {
    condition = (
      length(var.state_bucket_name) >= 3 &&
      length(var.state_bucket_name) <= 63 &&
      can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.state_bucket_name)) &&
      !can(regex("\\.\\.", var.state_bucket_name)) &&
      !can(regex("^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$", var.state_bucket_name))
    )
    error_message = "State bucket name must be 3-63 characters, use lowercase letters, numbers, dots, or hyphens, start/end with a letter or number, not contain '..', and not be an IP address."
  }
}
