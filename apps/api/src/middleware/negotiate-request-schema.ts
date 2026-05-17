// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ProfileLink } from '@/middleware/profile-link.js';
import contentType from 'content-type';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

const MEDIA_TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

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
 * Request schema negotiation middleware.
 *
 * Parses the `Content-Type` header's `profile` parameter to select the
 * appropriate schema version from the provided profiles.
 *
 * - No profile parameter → select the first (latest) profile.
 * - Profile matches a supported path → select that profile.
 * - Profile doesn't match any supported path → 415 Unsupported Media Type.
 *
 * Sets `negotiatedSchema` on the context.
 */
export function negotiateRequestSchema(profiles: ProfileLink[]): MiddlewareHandler {
  if (profiles.length === 0) {
    throw new Error('negotiateRequestSchema requires at least one profile');
  }

  const paths = profiles.map((p) => p.path);

  return async (c, next) => {
    const header = c.req.header('Content-Type');
    let profile: string | undefined;

    if (header) {
      // contentType.parse is lenient and does not throw on malformed input,
      // so reject anything that isn't a well-formed RFC 9110 media-type here.
      let parsed: ReturnType<typeof contentType.parse>;
      try {
        parsed = contentType.parse(header);
      } catch {
        throw new HTTPException(400, {
          message: 'Malformed Content-Type header',
        });
      }

      if (!MEDIA_TYPE_REGEXP.test(parsed.type)) {
        throw new HTTPException(400, {
          message: 'Malformed Content-Type header',
        });
      }

      profile = parsed.parameters['profile'];
    }

    let matched: string;

    if (!profile) {
      matched = paths[0];
    } else {
      const path = profilePath(profile);
      const found = paths.find((p) => p === path);

      if (!found) {
        const supported = paths.join(', ');
        throw new HTTPException(415, {
          message: `Unsupported schema version. Supported: ${supported}`,
        });
      }

      matched = found;
    }

    c.set('negotiatedSchema', matched);
    await next();
  };
}
