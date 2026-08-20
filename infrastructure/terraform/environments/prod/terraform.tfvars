# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Non-sensitive values for prod environment

project_id = "dungeon-studio-genshin-prod"

common_labels = {
  environment = "prod"
  managed_by  = "terraform"
}

# Enabling a domain ahead of its CNAME leaves verification permanently pending.
# Cutover per name: add the record in `core`, apply `core`, then flip the flag.
enable_api_domain_mapping = false
enable_web_custom_domain  = false

# The invoker binding names a Cloud Run service the deploy workflow creates, so
# it cannot apply before the first deploy.
enable_api_public_invoker = false

firestore_location_id = "eur3"
