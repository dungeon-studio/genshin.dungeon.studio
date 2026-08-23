// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';

import { jsonSchemaRegistry } from '@/profiles/json-schema/registry.js';

/**
 * Serves the JSON Schema profiles clients negotiate against, one route per
 * registry entry.
 *
 * `$id` is stamped from the request's own origin rather than declared in the
 * schema module, so the same build serves a self-consistent `$id` from every
 * environment it is deployed to.
 */
export const jsonSchemaProfiles = new Hono();

for (const entry of jsonSchemaRegistry) {
  // The router is mounted at '/profiles/json-schema', so strip the prefix for the route pattern.
  const routePath = entry.path.replace(/^\/profiles\/json-schema/, '');

  jsonSchemaProfiles.get(routePath, (c) => {
    const origin = new URL(c.req.url).origin;

    return c.json({ ...entry.schema, $id: `${origin}${entry.path}` }, 200, {
      'Content-Type': 'application/schema+json',
    });
  });
}
