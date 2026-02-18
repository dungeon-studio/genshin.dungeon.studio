# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "dns_zone_nameservers" {
  value       = google_dns_managed_zone.genshin_dungeon_studio.name_servers
  description = "Cloud DNS nameservers for genshin.dungeon.studio zone - update these at your domain registrar"
  sensitive   = false
}
