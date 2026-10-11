# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# State addresses from before the resources moved into the shared module.

moved {
  from = google_project_service.artifactregistry
  to   = module.application_environment.google_project_service.artifactregistry
}

moved {
  from = google_project_service.cloudrun
  to   = module.application_environment.google_project_service.cloudrun
}

moved {
  from = google_artifact_registry_repository.api
  to   = module.application_environment.google_artifact_registry_repository.api
}

moved {
  from = google_cloud_run_domain_mapping.api
  to   = module.application_environment.google_cloud_run_domain_mapping.api
}

moved {
  from = google_cloud_run_service_iam_member.api_public_invoker
  to   = module.application_environment.google_cloud_run_service_iam_member.api_public_invoker
}

moved {
  from = google_project_service.firebase
  to   = module.application_environment.google_project_service.firebase
}

moved {
  from = google_project_service.identitytoolkit
  to   = module.application_environment.google_project_service.identitytoolkit
}

moved {
  from = google_identity_platform_config.default
  to   = module.application_environment.google_identity_platform_config.default
}

moved {
  from = google_identity_platform_default_supported_idp_config.google
  to   = module.application_environment.google_identity_platform_default_supported_idp_config.google
}

moved {
  from = google_project_service.firestore
  to   = module.application_environment.google_project_service.firestore
}

moved {
  from = google_project_service.secretmanager
  to   = module.application_environment.google_project_service.secretmanager
}

moved {
  from = google_secret_manager_secret.firebase_auth_google_client_id
  to   = module.application_environment.google_secret_manager_secret.firebase_auth_google["client-id"]
}

moved {
  from = google_secret_manager_secret.firebase_auth_google_client_secret
  to   = module.application_environment.google_secret_manager_secret.firebase_auth_google["client-secret"]
}

moved {
  from = google_firebase_project.default
  to   = module.application_environment.google_firebase_project.default
}

moved {
  from = google_project_service.firebase_hosting
  to   = module.application_environment.google_project_service.firebase_hosting
}

moved {
  from = google_firebase_hosting_site.web
  to   = module.application_environment.google_firebase_hosting_site.web
}

moved {
  from = google_firebase_web_app.web
  to   = module.application_environment.google_firebase_web_app.web
}

moved {
  from = google_firestore_database.default
  to   = module.application_environment.google_firestore_database.unprotected[0]
}

moved {
  from = google_firebase_hosting_custom_domain.web
  to   = module.application_environment.google_firebase_hosting_custom_domain.web[0]
}

moved {
  from = terraform_data.firebase_auth_google_client_secret_version
  to   = module.application_environment.terraform_data.firebase_auth_google_client_secret_version
}
