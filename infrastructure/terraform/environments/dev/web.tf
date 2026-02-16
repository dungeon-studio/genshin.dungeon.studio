# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Enable Cloud Storage API
resource "google_project_service" "storage" {
  project = var.gcp_dev_project_id
  service = "storage.googleapis.com"

  disable_on_destroy = false
}

# Cloud Storage bucket for static web hosting
resource "google_storage_bucket" "web" {
  name          = "develop.genshin.dungeon.studio"
  project       = var.gcp_dev_project_id
  location      = "EU"
  force_destroy = true

  labels = var.common_labels

  # Static website hosting configuration
  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [google_project_service.storage]
}

# Make bucket publicly readable for static website hosting
resource "google_storage_bucket_iam_binding" "public_read" {
  bucket = google_storage_bucket.web.name
  role   = "roles/storage.objectViewer"

  members = [
    "allUsers"
  ]
}
