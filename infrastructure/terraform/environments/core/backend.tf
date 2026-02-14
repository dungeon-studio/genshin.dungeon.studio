# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# State is stored in GCS bucket created during bootstrap
terraform {
  backend "gcs" {
    bucket = "dungeon-studio-genshin-tfstate"
    prefix = "environments/platform"
  }
}
