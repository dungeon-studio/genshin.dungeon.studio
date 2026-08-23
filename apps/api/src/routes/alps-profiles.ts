// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';

import { alpsRegistry } from '@/profiles/alps/registry.js';

/**
 * Serves the ALPS profiles that describe what each resource's fields mean, one
 * route per registry entry.
 *
 * Where a JSON Schema profile constrains a representation's shape, these
 * describe its semantics, so a client follows both for the same resource.
 */
export const alpsProfiles = new Hono();

for (const entry of alpsRegistry) {
  // entry.path is e.g. '/profiles/alps/character/item-v1.json'
  // The router is mounted at '/profiles/alps', so strip the prefix for the route pattern.
  const routePath = entry.path.replace(/^\/profiles\/alps/, '');

  alpsProfiles.get(routePath, (c) => {
    return c.json(entry.profile, 200, {
      'Content-Type': 'application/alps+json',
    });
  });
}
