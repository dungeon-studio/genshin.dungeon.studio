# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

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

  labels = var.common_labels

  depends_on = [google_project_service.firebase_hosting]
}

# Custom domain for the Firebase Hosting site
resource "google_firebase_hosting_custom_domain" "web" {
  provider      = google-beta
  project       = var.gcp_dev_project_id
  site_id       = google_firebase_hosting_site.web.site_id
  custom_domain = "develop.genshin.dungeon.studio"
}
