// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { V1TransferEnvelope } from './v1.js';
import { V1TransferEnvelopeSchema } from './v1.js';

// The version stamped into every file this app writes. Bump it and add a
// `schemas/v{n}.ts` whenever the envelope shape changes; the compatibility gate
// (apps/api/scripts/check-schema-compat.ts) then forces the change to only
// widen, so files written by older builds keep importing.
export const CURRENT_VERSION = 1 as const;

const SUPPORTED_VERSIONS: readonly number[] = [1];

export type ParseEnvelopeResult =
  { ok: true; envelope: V1TransferEnvelope } | { ok: false; message: string };

/**
 * Validate an untrusted file as a collection export.
 *
 * Version is checked before shape so a file from a newer build reports what it
 * actually is rather than a list of field errors the user can do nothing about.
 */
export function parseTransferEnvelope(raw: unknown): ParseEnvelopeResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'This file is not a collection export.' };
  }

  const { version } = raw as { version?: unknown };

  if (typeof version !== 'number') {
    return {
      ok: false,
      message: 'This file is not a collection export: it carries no version.',
    };
  }

  if (!SUPPORTED_VERSIONS.includes(version)) {
    return {
      ok: false,
      message: `This export is version ${String(version)}, which this version of the app cannot read.`,
    };
  }

  const parsed = V1TransferEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: 'This collection export is malformed.' };
  }

  return { ok: true, envelope: parsed.data };
}
