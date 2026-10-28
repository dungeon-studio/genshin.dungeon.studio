// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Context } from 'hono';

/**
 * The URL a client used to reach this request, for building absolute links.
 *
 * Cloud Run terminates TLS in front of the service, so `c.req.url` always
 * reads `http`. Its front end records the client's scheme in
 * `X-Forwarded-Proto`, and a link built from the bare request URL would send
 * an `https` page to a URL its browser blocks as mixed content.
 *
 * Only an upgrade to `https` is honoured: the header can at worst make a
 * client's own links stricter than its connection.
 */
export function publicUrl(c: Context): URL {
  const url = new URL(c.req.url);
  const forwardedProto = c.req.header('X-Forwarded-Proto')?.split(',')[0]?.trim();
  if (forwardedProto === 'https') {
    url.protocol = 'https:';
  }
  return url;
}
