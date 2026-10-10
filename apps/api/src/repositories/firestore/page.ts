// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldPath } from 'firebase-admin/firestore';

import type { Page, PageRequest } from '@/http/page.js';

/**
 * Reads one page of a query in document ID order.
 *
 * Document ID is the sort because it's unique and stable, so a cursor naming
 * the last ID returned resumes exactly where the page ended. Fetching one extra
 * document tells whether another page exists without a second query.
 */
export async function readPage<T>(
  query: Query,
  request: PageRequest,
  parse: (doc: QueryDocumentSnapshot) => T,
): Promise<Page<T>> {
  let ordered = query.orderBy(FieldPath.documentId());

  if (request.after !== undefined) {
    ordered = ordered.startAfter(request.after);
  }

  const snapshot = await ordered.limit(request.limit + 1).get();
  const docs = snapshot.docs.slice(0, request.limit);
  const items = docs.map(parse);

  if (snapshot.docs.length <= request.limit) {
    return { items };
  }

  return { items, next: docs[docs.length - 1].id };
}
