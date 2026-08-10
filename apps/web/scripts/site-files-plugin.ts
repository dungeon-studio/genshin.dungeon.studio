// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

import { isPublicOrigin, siteFiles } from './site-files';

/**
 * Emits the crawler-facing root files, and marks every origin but the public
 * one `noindex`.
 *
 * The origin arrives as `VITE_SITE_ORIGIN`, which Vite resolves from `.env`
 * files as well as the environment, so it is only readable once the config
 * has been resolved.
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

    // robots.txt keeps compliant crawlers off non-public origins entirely;
    // this catches the ones that fetch anyway, for which a Disallow they
    // ignored is no barrier to listing the page.
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
