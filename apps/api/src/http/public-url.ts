// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Context } from 'hono';

/**
 * The URL a client used to reach this request, for building absolute links.
 *
 * Cloud Run terminates TLS, so the request URL reads `http` even for an
 * `https` client, and an `https` page blocks a link built from it as mixed
 * content.
 *
 * Honouring only `https` means a spoofed header can at worst tighten the
 * caller's own links.
 */
export function publicUrl(c: Context): URL {
  const url = new URL(c.req.url);
  const forwardedProto = c.req.header('X-Forwarded-Proto')?.split(',')[0]?.trim();
  if (forwardedProto === 'https') {
    url.protocol = 'https:';
  }
  return url;
}
