// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';

// Read version from package.json to maintain single source of truth
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

const app = new Hono();

app.get('/', (c) =>
  c.json({
    message: 'Genshin API',
    version: packageJson.version,
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '8080', 10);
console.log(`Server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
