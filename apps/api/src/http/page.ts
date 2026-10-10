// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Link } from '@genshin/collection-json';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Page, PageRequest } from '@/repositories/firestore/page.js';

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

/**
 * The page a list request asks for.
 *
 * Clients follow the `next` link rather than build a cursor, so its encoding
 * can change freely. A cursor that doesn't decode to a document ID is a 400,
 * not an empty page.
 */
export function parsePageRequest(c: Context): PageRequest {
  const rawLimit = c.req.query('limit');
  const rawCursor = c.req.query('cursor');

  const limit = rawLimit === undefined ? DEFAULT_PAGE_LIMIT : parseLimit(rawLimit);

  if (rawCursor === undefined) {
    return { limit };
  }

  return { limit, after: decodeCursor(rawCursor) };
}

function parseLimit(raw: string): number {
  const limit = Number(raw);

  if (!/^[1-9][0-9]*$/.test(raw) || limit > MAX_PAGE_LIMIT) {
    throw new HTTPException(400, {
      message: `limit must be an integer from 1 to ${MAX_PAGE_LIMIT}`,
    });
  }

  return limit;
}

function decodeCursor(raw: string): string {
  const decoded = Buffer.from(raw, 'base64url').toString('utf8');

  // Firestore document IDs are non-empty and never contain a slash.
  if (decoded === '' || decoded.includes('/') || encodeCursor(decoded) !== raw) {
    throw new HTTPException(400, { message: 'cursor is not one this server issued' });
  }

  return decoded;
}

function encodeCursor(after: string): string {
  return Buffer.from(after, 'utf8').toString('base64url');
}

/**
 * The collection's `next` link, or none on the last page.
 *
 * Built from the request URL, so filters and an explicit `limit` carry over.
 */
export function pageLinks(c: Context, page: Page<unknown>): Link[] {
  if (page.next === undefined) {
    return [];
  }

  const url = new URL(c.req.url);
  url.searchParams.set('cursor', encodeCursor(page.next));

  return [{ rel: 'next', href: url.href }];
}
