// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import * as contentType from 'content-type';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { ProfileLink } from '@/middleware/profile-link.js';

/**
 * Extract the pathname from a profile URL or path.
 *
 * If the value is already an absolute path (starts with `/`), returns it as-is.
 * If it's a full URL, extracts the pathname.
 */
function profilePath(profileValue: string): string {
  if (profileValue.startsWith('/')) return profileValue;

  try {
    return new URL(profileValue).pathname;
  } catch {
    return profileValue;
  }
}

export type NegotiatedRequestSchemaVariables = {
  /** The schema path that was negotiated from the Content-Type profile parameter. */
  negotiatedSchema: string;
};

/**
 * Picks which version of a request schema to validate against, from the
 * `Content-Type` header's `profile` parameter.
 *
 * - No profile parameter → select the first profile, so list the latest first.
 * - Profile matches a supported path → select that profile.
 * - Profile doesn't match any supported path → 415 Unsupported Media Type.
 * - Malformed `Content-Type` → 400.
 *
 * Sets `negotiatedSchema` on the context, which `validateRequestBody` reads, so
 * register this one first.
 *
 * @throws Error at registration, not per request, when `profiles` is empty.
 */
export function negotiateRequestSchema(profiles: ProfileLink[]): MiddlewareHandler {
  if (profiles.length === 0) {
    throw new Error('negotiateRequestSchema requires at least one profile');
  }

  const paths = profiles.map((p) => p.path);

  return async (c, next) => {
    const profile = parseProfile(c.req.header('Content-Type'));
    c.set('negotiatedSchema', selectSchema(paths, profile));
    await next();
  };
}

function parseProfile(header: string | undefined): string | undefined {
  if (!header) return undefined;

  // parse accepts malformed headers and format rejects them, so the
  // round-trip is the validation.
  try {
    const parsed = contentType.parse(header);
    contentType.format(parsed);
    return parsed.parameters['profile'];
  } catch {
    throw new HTTPException(400, {
      message: 'Malformed Content-Type header',
    });
  }
}

function selectSchema(paths: string[], profile: string | undefined): string {
  if (!profile) return paths[0];

  const path = profilePath(profile);
  if (paths.includes(path)) return path;

  const supported = paths.join(', ');
  throw new HTTPException(415, {
    message: `Unsupported schema version. Supported: ${supported}`,
  });
}
