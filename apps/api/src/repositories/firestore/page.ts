// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldPath } from 'firebase-admin/firestore';

export interface PageRequest {
  limit: number;
  /** Document ID the page starts after, exclusive. */
  after?: string;
}

export interface Page<T> {
  items: T[];
  /** Document ID the next page starts after; absent on the last page. */
  next?: string;
}

/**
 * Reads one page of a query in document ID order.
 *
 * Document IDs are unique and stable, so a page resumes exactly where the last
 * one ended. Fetching one extra document reveals whether another page exists
 * without a second query.
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
