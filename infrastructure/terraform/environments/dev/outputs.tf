# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

output "web_bucket_name" {
  description = "Cloud Storage bucket hosting the web application"
  value       = google_storage_bucket.web.name
}
