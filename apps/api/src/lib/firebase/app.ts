// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getApp, getApps, initializeApp } from 'firebase-admin/app';

// Initialize with Application Default Credentials (ADC).
// In GCP, credentials are provided automatically.
// Locally, set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
export const app = getApps().length > 0 ? getApp() : initializeApp();
