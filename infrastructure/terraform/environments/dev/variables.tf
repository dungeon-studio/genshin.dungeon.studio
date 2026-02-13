# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

variable "gcp_dev_project_id" {
  type        = string
  description = "GCP Project ID for development environment"
}

variable "gcp_shared_project_id" {
  type        = string
  description = "GCP Project ID for shared infrastructure (where Workload Identity Pool is created)"
}

variable "common_labels" {
  type        = map(string)
  description = "Common labels applied to all resources in this environment"
}
