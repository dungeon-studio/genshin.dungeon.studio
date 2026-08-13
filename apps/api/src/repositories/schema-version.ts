// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ParseResult } from 'verzod';

import { logger } from '@/logger.js';

type Repository = 'characters' | 'profile' | 'teams' | 'weapons';

/** verzod's own entity type cannot be named without `any` in its generics. */
interface VersionedDocument<T> {
  safeParse(data: unknown): ParseResult<T>;
}

/**
 * The version a raw document is in. Documents written before versioning carry
 * no `schemaVersion`, so its absence means 0; a non-numeric one belongs to no
 * version an entity can route.
 *
 * Routing and {@link parseDocument} both take a version from here, so the
 * version a document parses as and the version reported as migrated agree.
 */
export function documentVersion(data: unknown): number | null {
  if (typeof data !== 'object' || data === null) return null;
  const version = (data as Record<string, unknown>).schemaVersion;
  return typeof version === 'number' ? version : 0;
}

/**
 * Parse a stored document, migrating it to `toVersion`.
 *
 * A migration logs its version pair, so the documents left on a legacy version
 * can be watched until none remain and that version's parse branch can go. The
 * line carries no document content; that belongs to the user.
 *
 * @throws TypeError when no known version's schema accepts the document.
 */
export function parseDocument<T>(
  repository: Repository,
  entity: VersionedDocument<T>,
  raw: Record<string, unknown>,
  toVersion: number,
): T {
  const result = entity.safeParse(raw);
  if (result.type !== 'ok') {
    throw new TypeError(`Invalid ${repository} document: ${result.error.type}`);
  }

  // The parse result reports no source version, so it is taken again here.
  // A document carrying none failed the routing above and never reaches this.
  const fromVersion = documentVersion(raw);
  if (fromVersion !== null && fromVersion < toVersion) {
    logger.info({ repository, fromVersion, toVersion }, 'migrated document on read');
  }

  return result.value;
}
