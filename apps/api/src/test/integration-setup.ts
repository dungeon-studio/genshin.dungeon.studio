// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// `firebase emulators:exec` exports this; without it firebase-admin resolves
// credentials and talks to whatever project the ambient environment names. The
// suite writes and deletes documents, so it refuses to run rather than find out
// which project that is.
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    'FIRESTORE_EMULATOR_HOST is unset. Run this suite through `pnpm --filter @genshin/api test:integration`.',
  );
}
