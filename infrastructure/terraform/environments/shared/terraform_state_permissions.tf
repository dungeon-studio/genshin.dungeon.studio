# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

resource "google_storage_bucket_iam_member" "github_deployer_ro_shared_state" {
  bucket = "dungeon-studio-genshin-tfstate"
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.github_deployer_ro_shared.email}"
}

resource "google_storage_bucket_iam_member" "github_deployer_ro_dev_state" {
  bucket = "dungeon-studio-genshin-tfstate"
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:github-deployer-ro@${var.gcp_dev_project_id}.iam.gserviceaccount.com"
}
