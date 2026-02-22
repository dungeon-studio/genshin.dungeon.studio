# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Non-sensitive values for staging environment

gcp_staging_project_id = "dungeon-studio-genshin-staging"

common_labels = {
  environment = "staging"
  managed_by  = "terraform"
}
