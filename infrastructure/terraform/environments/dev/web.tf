# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Initialize Firebase on the GCP project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.gcp_dev_project_id

  depends_on = [google_project_service.firebase]
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

  depends_on = [
    google_firebase_project.default,
    google_project_service.firebase_hosting,
  ]
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

# Register a Firebase Web App for the frontend.
# The SDK config (API key, auth domain, etc.) is derived from this resource.
resource "google_firebase_web_app" "web" {
  provider     = google-beta
  project      = var.gcp_dev_project_id
  display_name = "Genshin Planner (dev)"

  depends_on = [google_firebase_project.default]
}

# Read the SDK config for the registered web app.
data "google_firebase_web_app_config" "web" {
  provider   = google-beta
  project    = var.gcp_dev_project_id
  web_app_id = google_firebase_web_app.web.app_id
}
