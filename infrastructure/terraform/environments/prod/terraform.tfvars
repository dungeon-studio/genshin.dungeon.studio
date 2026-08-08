# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
# Non-sensitive values for prod environment

project_id = "dungeon-studio-genshin-prod"

common_labels = {
  environment = "prod"
  managed_by  = "terraform"
}

# NOTE: The domain flags stay off until the matching records exist in `core`,
# which today publishes only the `develop` names; enabling a domain resource
# ahead of its CNAME leaves a permanently pending verification. Cutover order
# per name: add the record in `core`, apply `core`, then flip the flag here.
enable_api_domain_mapping = false
enable_web_custom_domain  = false

# The invoker binding names the Cloud Run service the deploy workflow creates,
# so it stays off until production has been deployed at least once.
enable_api_public_invoker = false

firestore_location_id = "eur3"
