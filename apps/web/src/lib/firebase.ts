// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Safety: In dev mode, force the project ID to match the local Firebase
// Emulators (started at the repository root with --project demo-dungeon-studio-genshin-dev).
// This mirrors the API's forced project ID in apps/api/src/lib/firebase/app.ts.
// Dead-code-eliminated during production builds.
if (import.meta.env.DEV) {
  firebaseConfig.projectId = 'demo-dungeon-studio-genshin-dev';
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Safety: `import.meta.env.DEV` is a compile-time constant that is `true` only when running
// the local Vite dev server. During `vite build` (used for all deployed environments), it is
// replaced with `false` and this entire block is removed from the bundle — the emulator code
// cannot ship to any deployed environment regardless of environment variables.
//
// The emulator URL is hardcoded to match the port in firebase.json at the repository root.
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
