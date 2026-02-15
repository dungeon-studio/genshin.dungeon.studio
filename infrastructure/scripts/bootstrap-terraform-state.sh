#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
set -euo pipefail
set -x

BUCKET_NAME="${BUCKET_NAME:-dungeon-studio-genshin-tfstate}"
PROJECT_ID="${PROJECT_ID:-dungeon-studio-genshin-shared}"
LOCATION="${LOCATION:-europe-west1}"
ENABLE_VERSIONING="${ENABLE_VERSIONING:-true}"

# Create project if it doesn't exist
if gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Project ${PROJECT_ID} already exists."
else
  echo "Creating project ${PROJECT_ID}..."
  gcloud projects create "${PROJECT_ID}"
fi

# Create bucket if it doesn't exist
if gcloud storage buckets describe "gs://${BUCKET_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Bucket gs://${BUCKET_NAME} already exists in project ${PROJECT_ID}."
else
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project "${PROJECT_ID}" \
    --location "${LOCATION}"
fi

if [[ "${ENABLE_VERSIONING}" == "true" ]]; then
  gcloud storage buckets update "gs://${BUCKET_NAME}" --project "${PROJECT_ID}" --versioning
fi
