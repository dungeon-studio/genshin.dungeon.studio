#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Read the Firebase web app config from terraform output in the current
# working directory and emit GitHub Actions output lines for each field.
# Assumes terraform init has already run.

set -euo pipefail

if [ -z "${GITHUB_OUTPUT:-}" ]; then
  echo "GITHUB_OUTPUT is not set; this script is meant to run under GitHub Actions" >&2
  exit 1
fi

CFG=$(terraform output -json firebase_web_app_config)

{
  echo "VITE_FIREBASE_API_KEY=$(echo "$CFG" | jq -er .api_key)"
  echo "VITE_FIREBASE_AUTH_DOMAIN=$(echo "$CFG" | jq -er .auth_domain)"
  echo "VITE_FIREBASE_PROJECT_ID=$(echo "$CFG" | jq -er .project_id)"
  echo "VITE_FIREBASE_STORAGE_BUCKET=$(echo "$CFG" | jq -er .storage_bucket)"
  echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$(echo "$CFG" | jq -er .messaging_sender_id)"
  echo "VITE_FIREBASE_APP_ID=$(echo "$CFG" | jq -er .app_id)"
} >> "$GITHUB_OUTPUT"
