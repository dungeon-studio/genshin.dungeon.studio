# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

locals {
  web_bucket_name     = "develop.genshin.dungeon.studio"
  web_bucket_location = "EU"
}

# Enable Cloud Storage API
resource "google_project_service" "storage" {
  project = var.gcp_dev_project_id
  service = "storage.googleapis.com"

  disable_on_destroy = false
}

# Cloud Storage bucket for static web hosting
resource "google_storage_bucket" "web" {
  name          = local.web_bucket_name
  project       = var.gcp_dev_project_id
  location      = local.web_bucket_location
  force_destroy = false

  labels = var.common_labels

  # Static website hosting configuration
  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.storage]
}

# Make bucket publicly readable for static website hosting.
# NOTE: This bucket is intended to serve only non-sensitive, public static web
# assets (e.g., HTML, CSS, JS, images). Granting `roles/storage.objectViewer`
# to `allUsers` is required so that browsers can access these assets directly
# from GCS without authentication. Do not store confidential data in this
# bucket; if requirements change, tighten these permissions accordingly.
resource "google_storage_bucket_iam_binding" "public_read" {
  bucket = google_storage_bucket.web.name
  role   = "roles/storage.objectViewer"

  members = [
    "allUsers"
  ]
}
