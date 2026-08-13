// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { logger } from '@/logger.js';

type Repository = 'characters' | 'profile' | 'teams' | 'weapons';

/**
 * The version a raw document is in. Documents written before versioning carry
 * no `schemaVersion`, so its absence means 0; a non-numeric one belongs to no
 * version this entity can route.
 *
 * Every repository routes with this and {@link observeMigration} reads it back,
 * so the version a document is parsed as and the version reported as migrated
 * cannot drift apart.
 */
export function documentVersion(data: unknown): number | null {
  if (typeof data !== 'object' || data === null) return null;
  const version = (data as Record<string, unknown>).schemaVersion;
  return typeof version === 'number' ? version : 0;
}

/**
 * Report that a read migrated a document forward, so the remaining population
 * of a legacy version can be watched until it drains and that version's parse
 * branch can be deleted.
 *
 * Only version numbers are logged; the document itself is the user's.
 *
 * Call after a successful parse — verzod's result carries no source version.
 */
export function observeMigration(
  repository: Repository,
  raw: Record<string, unknown>,
  toVersion: number,
): void {
  const fromVersion = documentVersion(raw);
  if (fromVersion === null || fromVersion >= toVersion) return;

  logger.info({ repository, fromVersion, toVersion }, 'migrated document on read');
}
