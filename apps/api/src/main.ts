// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { readFileSync } from 'node:fs';

// Read version from package.json to maintain single source of truth
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

const app = new Hono();

// Request logging middleware
app.use('*', logger());

// CORS middleware - allow frontend origin
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(
  '*',
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);

// Error handling middleware
app.onError((err, c) => {
  // Handle Hono's HTTPException (intended errors like 404, validation errors, etc.)
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: 'error',
      },
      err.status,
    );
  }

  // Handle unexpected errors - log full details server-side, return generic message
  console.error('Unexpected error:', err);
  return c.json(
    {
      error: 'Internal server error',
      status: 'error',
    },
    500,
  );
});

// 404 handler for unmatched routes
app.notFound((c) =>
  c.json(
    {
      error: 'Not found',
      status: 'error',
    },
    404,
  ),
);

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
