// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { serve } from '@hono/node-server';

import { app } from '@/app.js';

// `||`, not `??`: an empty `PORT` means unset, and `parseInt('')` is `NaN`.
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const port = parseInt(process.env.PORT || '8080', 10);
console.log(`Server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
