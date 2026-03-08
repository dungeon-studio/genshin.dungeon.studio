# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# DNS CNAME record for development web application
# Points to Firebase Hosting site for HTTPS static hosting with automatic SSL
resource "google_dns_record_set" "web_develop" {
  name         = "develop.genshin.dungeon.studio."
  managed_zone = google_dns_managed_zone.genshin_dungeon_studio.name
  type         = "CNAME"
  ttl          = 3600
  project      = var.gcp_core_project_id

  rrdatas = ["dungeon-studio-genshin-dev.web.app."]
}

# DNS CNAME record for development API custom domain.
# Cloud Run domain mappings resolve through ghs.googlehosted.com.
resource "google_dns_record_set" "api_develop" {
  name         = "api.develop.genshin.dungeon.studio."
  managed_zone = google_dns_managed_zone.genshin_dungeon_studio.name
  type         = "CNAME"
  ttl          = 3600
  project      = var.gcp_core_project_id

  rrdatas = ["ghs.googlehosted.com."]
}
