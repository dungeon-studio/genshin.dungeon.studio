// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// `firebase emulators:exec` exports this. Without it firebase-admin resolves
// credentials and writes to whatever project the ambient environment names, so
// the suite refuses to run rather than find out which one that is.
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    'FIRESTORE_EMULATOR_HOST is unset. Run this suite through `pnpm --filter @genshin/api test:integration`.',
  );
}
