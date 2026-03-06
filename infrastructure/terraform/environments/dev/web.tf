# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# TODO: Remove after successful apply — only kept to let Terraform destroy the
# non-empty bucket (force_destroy was previously false).
resource "google_storage_bucket" "web" {
  name          = "develop.genshin.dungeon.studio"
  project       = var.gcp_dev_project_id
  location      = "EU"
  force_destroy = true
}

# Enable Firebase Hosting API
resource "google_project_service" "firebase_hosting" {
  project = var.gcp_dev_project_id
  service = "firebasehosting.googleapis.com"

  disable_on_destroy = false

  depends_on = [google_project_service.firebase]
}

# Firebase Hosting site for the web application
resource "google_firebase_hosting_site" "web" {
  provider = google-beta
  project  = var.gcp_dev_project_id
  site_id  = "dungeon-studio-genshin-dev"

  depends_on = [google_project_service.firebase_hosting]
}

# Custom domain for the Firebase Hosting site
resource "google_firebase_hosting_custom_domain" "web" {
  provider      = google-beta
  project       = var.gcp_dev_project_id
  site_id       = google_firebase_hosting_site.web.site_id
  custom_domain = "develop.genshin.dungeon.studio"

  cert_preference       = "GROUPED"
  wait_dns_verification = false

  depends_on = [google_firebase_hosting_site.web]
}
