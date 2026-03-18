<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Configure Firestore credentials for the API

This guide is for maintainers and operators with access to the
`dungeon-studio-genshin-*` GCP projects. External contributors don't need
Firestore credentials to work on most features.

## Prerequisites

- Access to a GCP project such as `dungeon-studio-genshin-dev`
- The `gcloud` CLI installed (pre-installed in DevContainers)

## Authenticate with Google Cloud

```bash
gcloud auth application-default login
```

This creates Application Default Credentials that the Firebase Admin SDK
picks up automatically.

## Set required environment variables

```bash
# Required: GCP project ID used by Firebase Admin SDK
export GOOGLE_CLOUD_PROJECT="dungeon-studio-genshin-dev"

# Optional: Firestore database ID (defaults to "(default)")
# export FIRESTORE_DATABASE_ID="(default)"
```

Set these in your shell profile or a local `.env` file. Don't commit the `.env` file.

## Verify connectivity

Start the API and confirm the startup log shows the expected project and
database:

```text
Firebase: projectId=dungeon-studio-genshin-dev
Firestore: database=(default)
```

Check `http://localhost:8080/health` returns `{"status":"ok"}`.

## Environment variable reference

| Variable                | Required | Default     | Description                           |
| ----------------------- | -------- | ----------- | ------------------------------------- |
| `GOOGLE_CLOUD_PROJECT`  | Yes      | —           | GCP project ID for Firebase Admin SDK |
| `FIRESTORE_DATABASE_ID` | No       | `(default)` | Firestore database ID                 |
