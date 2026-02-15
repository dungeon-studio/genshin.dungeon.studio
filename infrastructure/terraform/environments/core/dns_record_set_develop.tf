# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# DNS A record for development web application
# Points to Cloud Storage's static IP for HTTP hosting
resource "google_dns_record_set" "web_develop" {
  name         = "develop.genshin.dungeon.studio."
  managed_zone = google_dns_managed_zone.genshin_dungeon_studio.name
  type         = "A"
  ttl          = 3600
  project      = var.gcp_core_project_id

  rrdatas = ["199.36.153.8"]
}
