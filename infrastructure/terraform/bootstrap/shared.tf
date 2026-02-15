# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Shared project: OIDC + state bucket (manual management only)

# Bootstrap shared infrastructure first (OIDC + state bucket, manual management only)
module "shared" {
  source = "./modules/project_bootstrap"

  environment        = "production"
  project_id         = "dungeon-studio-genshin-shared"
  project_name       = "DS Genshin Shared"
  billing_account_id = var.billing_account_id
  state_bucket_name  = data.google_storage_bucket.state.name
}
