import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

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
