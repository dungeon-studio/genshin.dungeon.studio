# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

variable "project_id" {
  type        = string
  description = "GCP project ID; also the Firebase Hosting site ID"
}

variable "common_labels" {
  type        = map(string)
  description = "Common labels applied to all resources"
}

variable "web_subdomain" {
  type        = string
  description = "Label prefixed to the base domain for the web hostname; null serves the apex"
  default     = null
}

variable "web_app_display_name" {
  type        = string
  description = "Display name of the Firebase Web App registration"
}

variable "enable_api_domain_mapping" {
  type        = bool
  description = "Whether to create the API Cloud Run custom domain mapping"
}

variable "enable_api_public_invoker" {
  type        = bool
  description = "Whether to grant allUsers the Cloud Run invoker role for API service"
}

variable "enable_web_custom_domain" {
  type        = bool
  description = "Whether to attach the custom domain to the web Firebase Hosting site"
}

variable "firestore_delete_protection" {
  type        = bool
  description = "Whether the Firestore database refuses deletion, both in GCP and in Terraform"
}
