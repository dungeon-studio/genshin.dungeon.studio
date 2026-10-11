# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

variable "project_id" {
  type        = string
  description = "GCP Project ID for production environment"
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

variable "enable_web_custom_domain" {
  type        = bool
  description = "Whether to attach the custom domain to the web Firebase Hosting site"
  default     = false
}
