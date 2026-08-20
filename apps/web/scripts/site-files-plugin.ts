// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

import { isPublicOrigin, siteFiles } from './site-files';

/**
 * Emits the site files and marks non-public origins `noindex`.
 *
 * `VITE_SITE_ORIGIN` comes from `.env` files as well as the environment, so
 * the origin is only readable once Vite has resolved the config.
 */
export function siteFilesPlugin(): Plugin {
  let origin: string | undefined;
  let outDir: string;

  return {
    name: 'generate-site-files',

    configResolved(config) {
      const env = config.env as Record<string, string | undefined>;
      origin = env.VITE_SITE_ORIGIN;
      outDir = path.resolve(config.root, config.build.outDir);
    },

    closeBundle() {
      if (origin === undefined) return;

      for (const file of siteFiles(origin)) {
        fs.writeFileSync(path.join(outDir, file.name), file.contents);
      }
    },

    // robots.txt already turns compliant crawlers away. This catches the ones
    // that fetch anyway, for which an ignored Disallow is no barrier to
    // listing the page.
    transformIndexHtml(html) {
      if (origin === undefined || isPublicOrigin(origin)) return html;

      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { name: 'robots', content: 'noindex, nofollow' },
            injectTo: 'head',
          },
        ],
      };
    },
  };
}
