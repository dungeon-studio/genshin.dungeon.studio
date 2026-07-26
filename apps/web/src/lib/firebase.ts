// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const DEV_PROJECT_ID = 'demo-dungeon-studio-genshin-dev';

// The Auth emulator validates none of these, so `pnpm dev` needs no .env file.
// Deployed bundles never carry the fallbacks: vite.config.ts fails the build on
// a missing variable.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${DEV_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEV_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${DEV_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

// Safety: In dev mode, force the project ID to match the local Firebase
// Emulators (started at the repository root with --project demo-dungeon-studio-genshin-dev).
// A real project ID in .env.local cannot reach real Firestore from a dev server.
// This mirrors the API's forced project ID in apps/api/src/lib/firebase/app.ts.
// Dead-code-eliminated during production builds.
if (import.meta.env.DEV) {
  firebaseConfig.projectId = DEV_PROJECT_ID;
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
