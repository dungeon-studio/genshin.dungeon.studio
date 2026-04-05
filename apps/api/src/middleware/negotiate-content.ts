// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ProfileLink } from '@/middleware/profile-link.js';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import Negotiator from 'negotiator';

export type { ProfileLink } from '@/middleware/profile-link.js';

/**
 * A representation the endpoint can produce.
 *
 * @example
 * // JSON with a profile link (e.g. a JSON Schema or ALPS document)
 * { mediaType: 'application/json', profile: profileGetResponseV1 }
 *
 * // Plain JSON without a profile
 * { mediaType: 'application/json' }
 */
export interface SupportedRepresentation {
  mediaType: string;
  /** Profile link whose path becomes the `profile` parameter in the media type. */
  profile?: ProfileLink;
}

export type NegotiatedContentVariables = {
  negotiatedMediaType: string;
};

/**
 * Build the full media type string for negotiation, including the profile
 * parameter when declared.
 */
export function toMediaTypeString(representation: SupportedRepresentation, origin: string): string {
  if (!representation.profile) return representation.mediaType;
  return `${representation.mediaType}; profile="${origin}${representation.profile.path}"`;
}

/**
 * Content negotiation middleware.
 *
 * Declare the representations the endpoint can produce. The middleware uses
 * negotiator to match the client's Accept header (including quality values,
 * wildcards, and extension parameters like profile) against the supported list.
 *
 * - No Accept header → pass through (serve first representation).
 * - Accept matches a supported media type (with or without profile) → pass through.
 * - Accept doesn't match any supported representation → 406.
 *
 * Sets `negotiatedMediaType` on the context — the full media type string
 * (including profile parameter when present) that the handler should use for
 * `Content-Type`.
 */
export function negotiateContent(supported: SupportedRepresentation[]): MiddlewareHandler {
  return async (c, next) => {
    const origin = new URL(c.req.url).origin;
    const available = supported.map((s) => toMediaTypeString(s, origin));
    const acceptHeader = c.req.header('Accept');

    // No Accept header = accept anything (RFC 9110 §12.5.1), serve first
    if (!acceptHeader) {
      c.set('negotiatedMediaType', available[0]);
      await next();
      return;
    }

    const negotiator = new Negotiator({ headers: { accept: acceptHeader } });
    const preferred = negotiator.mediaTypes(available);

    if (preferred.length === 0) {
      const types = available.join(', ');
      throw new HTTPException(406, {
        message: `This endpoint only serves: ${types}`,
      });
    }

    c.set('negotiatedMediaType', preferred[0]);
    await next();
  };
}
