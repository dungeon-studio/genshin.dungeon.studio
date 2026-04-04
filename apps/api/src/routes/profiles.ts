// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { alpsRegistry } from '@/profiles/alps/registry.js';
import { Hono } from 'hono';

export const profiles = new Hono();

for (const entry of alpsRegistry) {
  // entry.path is e.g. '/profiles/character/item-v1.json'
  // The router is mounted at '/profiles', so strip the prefix for the route pattern.
  const routePath = entry.path.replace(/^\/profiles/, '');

  profiles.get(routePath, (c) => {
    return c.json(entry.profile, 200, {
      'Content-Type': 'application/alps+json',
    });
  });
}
