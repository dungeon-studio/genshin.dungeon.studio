// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { jsonSchemaRegistry } from '@/profiles/json-schema/registry.js';
import { Hono } from 'hono';

export const jsonSchemaProfiles = new Hono();

for (const entry of jsonSchemaRegistry) {
  // entry.path is e.g. '/profiles/json-schema/profile/get-response-v1.json'
  // The router is mounted at '/profiles/json-schema', so strip the prefix for the route pattern.
  const routePath = entry.path.replace(/^\/profiles\/json-schema/, '');

  jsonSchemaProfiles.get(routePath, (c) => {
    const origin = new URL(c.req.url).origin;

    return c.json({ ...entry.schema, $id: `${origin}${entry.path}` }, 200, {
      'Content-Type': 'application/schema+json',
    });
  });
}
