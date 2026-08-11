// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getApp, getApps, initializeApp } from 'firebase-admin/app';

import { logger } from '@/logger.js';

// Safety: DEV is "true" only when running the local dev server via `pnpm dev`,
// mirroring the web app's `import.meta.env.DEV` pattern. Production builds
// start with `node dist/main.js` where DEV is not set. This block configures
// firebase-admin to talk to the local Firebase Emulators — the env vars must be
// set before any firebase-admin service (Auth, Firestore) is initialised.
//
// The emulator ports are hardcoded to match firebase.json at the repository root.
if (process.env.DEV === 'true') {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8181';
  process.env.GOOGLE_CLOUD_PROJECT = 'demo-dungeon-studio-genshin-dev';
  logger.info(
    { authEmulatorHost: 'localhost:9099', firestoreEmulatorHost: 'localhost:8181' },
    'firebase using local emulators',
  );
}

// `||`, not `??`: a blank `GOOGLE_CLOUD_PROJECT` means unset.
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const projectId = process.env.GOOGLE_CLOUD_PROJECT?.trim() || undefined;

logger.info({ projectId: projectId ?? null }, 'initialising firebase');
// In GCP, credentials are provided automatically.
// Locally with DEV=true, the emulator block above handles configuration.
// Local runs against real GCP still need ADC and a real GOOGLE_CLOUD_PROJECT;
// see docs/how-tos/configure-firestore-credentials.md.
export const app =
  getApps().length > 0 ? getApp() : initializeApp(projectId ? { projectId } : undefined);
