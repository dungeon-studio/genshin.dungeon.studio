import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import packageJson from '../package.json' with { type: 'json' };

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
