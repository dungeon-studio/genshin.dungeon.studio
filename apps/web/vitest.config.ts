// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Vitest stubs `.css` imports to an empty string, `?raw` included, so the
// contrast test takes the stylesheet as injected text.
const themeCss = readFileSync(fileURLToPath(new URL('./src/index.css', import.meta.url)), 'utf8');

// jsdom leaves `import.meta.url` on a non-file scheme, so the branding test
// cannot otherwise read the document it brands.
const indexHtml = readFileSync(fileURLToPath(new URL('./index.html', import.meta.url)), 'utf8');

// Lets the branding test hold every environment's asset URLs to a file that
// exists.
const publicFiles = readdirSync(fileURLToPath(new URL('./public', import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8080'),
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
    __BUILD_SHA__: JSON.stringify('testsha'),
    __THEME_CSS__: JSON.stringify(themeCss),
    __INDEX_HTML__: JSON.stringify(indexHtml),
    __PUBLIC_FILES__: JSON.stringify(publicFiles),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
