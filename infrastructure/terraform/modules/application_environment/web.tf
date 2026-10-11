# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.firebase]
}

resource "google_project_service" "firebase_hosting" {
  project = var.project_id
  service = "firebasehosting.googleapis.com"

  disable_on_destroy = false

  depends_on = [google_project_service.firebase]
}

resource "google_firebase_hosting_site" "web" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.project_id

  depends_on = [
    google_firebase_project.default,
    google_project_service.firebase_hosting,
  ]
}

resource "google_firebase_hosting_custom_domain" "web" {
  count = var.enable_web_custom_domain ? 1 : 0

  provider      = google-beta
  project       = var.project_id
  site_id       = google_firebase_hosting_site.web.site_id
  custom_domain = local.web_domain

  cert_preference       = "GROUPED"
  wait_dns_verification = false

  depends_on = [google_firebase_hosting_site.web]
}

resource "google_firebase_web_app" "web" {
  provider     = google-beta
  project      = var.project_id
  display_name = var.web_app_display_name

  depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "web" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.web.app_id
}
