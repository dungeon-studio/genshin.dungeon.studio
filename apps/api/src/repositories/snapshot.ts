// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { DocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Deserialize a document that may not be there.
 *
 * `data()` returns undefined exactly when the document does not exist, so
 * absence is the one case `parse` never sees. That keeps a `fromDocument` total
 * over the documents that do exist, free to throw on a malformed one without
 * confusing it for a missing one.
 */
export function readSnapshot<T>(
  snapshot: DocumentSnapshot,
  parse: (data: Record<string, unknown>) => T,
): T | null {
  const data = snapshot.data();

  return data === undefined ? null : parse(data);
}
