# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_project_service" "dns" {
  project = var.gcp_core_project_id
  service = "dns.googleapis.com"

  disable_on_destroy = false
}

resource "google_dns_managed_zone" "genshin_dungeon_studio" {
  name        = "genshin-dungeon-studio"
  dns_name    = "genshin.dungeon.studio."
  description = "DNS zone for genshin.dungeon.studio domain"
  project     = var.gcp_core_project_id

  dnssec_config {
    state = "on"
  }

  visibility = "public"

  labels = {
    managed_by  = "terraform"
    environment = "production"
  }

  depends_on = [google_project_service.dns]
}
