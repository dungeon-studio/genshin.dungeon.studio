// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getApp, getApps, initializeApp } from 'firebase-admin/app';

const projectId = process.env.GOOGLE_CLOUD_PROJECT?.trim() || undefined;

console.log(`Firebase: projectId=${projectId ?? '(not set)'}`);
// In GCP, credentials are provided automatically.
// Locally, run `gcloud auth application-default login` and set GOOGLE_CLOUD_PROJECT.
export const app =
  getApps().length > 0 ? getApp() : initializeApp(projectId ? { projectId } : undefined);
