#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT
set -euo pipefail
set -x

BUCKET_NAME="${BUCKET_NAME:-dungeon-studio-genshin-tfstate}"
PROJECT_ID="${PROJECT_ID:-dungeon-studio-genshin-shared}"
LOCATION="${LOCATION:-europe-west1}"

# Create project if it doesn't exist
if gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Project ${PROJECT_ID} already exists."
else
  echo "Creating project ${PROJECT_ID}..."
  gcloud projects create "${PROJECT_ID}" --set-as-default=false

  # Optionally associate a billing account if provided
  if [[ -n "${BILLING_ACCOUNT_ID:-}" ]]; then
    echo "Linking billing account ${BILLING_ACCOUNT_ID} to project ${PROJECT_ID}..."
    gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT_ID}"
  fi
fi

# Create bucket if it doesn't exist
if gcloud storage buckets describe "gs://${BUCKET_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Bucket gs://${BUCKET_NAME} already exists in project ${PROJECT_ID}."
else
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project "${PROJECT_ID}" \
    --location "${LOCATION}" \
    --public-access-prevention=ENFORCED \
    --uniform-bucket-level-access
fi

# Configure bucket: uniform bucket-level access (security) and versioning (state protection)
gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --project "${PROJECT_ID}" \
  --versioning
