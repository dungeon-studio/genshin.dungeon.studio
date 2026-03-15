// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { schemaRegistry } from '@/schemas/registry.js';
import { Hono } from 'hono';

export const schemas = new Hono();

for (const entry of schemaRegistry) {
  // entry.path is e.g. '/schemas/profile/get-response-v1.json'
  // The router is mounted at '/schemas', so strip the prefix for the route pattern.
  const routePath = entry.path.replace(/^\/schemas/, '');

  schemas.get(routePath, (c) => {
    const origin = new URL(c.req.url).origin;

    return c.json({ ...entry.schema, $id: `${origin}${entry.path}` }, 200, {
      'Content-Type': 'application/schema+json',
    });
  });
}
