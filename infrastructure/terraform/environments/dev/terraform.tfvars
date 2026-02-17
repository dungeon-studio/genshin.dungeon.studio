# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Non-sensitive values for dev environment

gcp_dev_project_id      = "dungeon-studio-genshin-dev"
gcp_dev_bucket_location = "EU"

common_labels = {
  environment = "dev"
  managed_by  = "terraform"
}
