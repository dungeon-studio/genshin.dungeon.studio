// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ParseResult } from 'verzod';

import { logger } from '@/logger.js';

type Repository = 'characters' | 'profile' | 'teams' | 'weapons';

/** The part of a versioned entity a repository reads a stored document through. */
interface VersionedDocument<T> {
  safeParse(data: unknown): ParseResult<T>;
}

/**
 * The version a raw document is in. Documents written before versioning carry
 * no `schemaVersion`, so its absence means 0; a non-numeric one belongs to no
 * version an entity can route.
 *
 * Every repository routes with this and {@link parseDocument} reads it back, so
 * the version a document is parsed as and the version reported as migrated
 * cannot drift apart.
 */
export function documentVersion(data: unknown): number | null {
  if (typeof data !== 'object' || data === null) return null;
  const version = (data as Record<string, unknown>).schemaVersion;
  return typeof version === 'number' ? version : 0;
}

/**
 * Parse a stored document, migrating it to `toVersion`, and record a migration
 * that had to happen — so the population still on a legacy version can be
 * watched until it drains and that version's parse branch can be deleted.
 *
 * Only version numbers are logged; the document itself is the user's.
 *
 * @throws TypeError when the document matches no version this entity knows.
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

  // verzod routed on `documentVersion`, so a document without one is already
  // out through the throw above. The result itself carries no source version.
  const fromVersion = documentVersion(raw);
  if (fromVersion !== null && fromVersion < toVersion) {
    logger.info({ repository, fromVersion, toVersion }, 'migrated document on read');
  }

  return result.value;
}
