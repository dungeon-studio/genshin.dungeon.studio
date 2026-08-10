// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { brandIndexHtml } from './environment-branding';
import { ENVIRONMENT_NAMES, ENVIRONMENTS, PRODUCTION_ORIGIN } from '../src/lib/environments';

// The real document, so an index.html edit that moves a branded element out
// from under the substitutions fails here rather than on a deployed site.
const INDEX_HTML = __INDEX_HTML__;

const DEV_ORIGIN = 'https://develop.genshin.dungeon.studio';

describe('brandIndexHtml', () => {
  it('leaves the production document untouched', () => {
    expect(brandIndexHtml(INDEX_HTML, ENVIRONMENTS.prod, PRODUCTION_ORIGIN)).toBe(INDEX_HTML);
  });

  it('announces the environment in the tab title', () => {
    const branded = brandIndexHtml(INDEX_HTML, ENVIRONMENTS.dev, DEV_ORIGIN);

    expect(branded).toContain('<title>Alpha · ');
  });

  it('points the tab icons at the badged variant', () => {
    const branded = brandIndexHtml(INDEX_HTML, ENVIRONMENTS.staging, DEV_ORIGIN);

    expect(branded).toContain('href="/favicon-beta.ico"');
    expect(branded).toContain('href="/favicon-32x32-beta.png"');
    expect(branded).toContain('href="/favicon-32x32-dark-beta.png"');
  });

  it('recolors the mobile browser chrome', () => {
    const branded = brandIndexHtml(INDEX_HTML, ENVIRONMENTS.dev, DEV_ORIGIN);

    expect(branded).toContain(`content="${ENVIRONMENTS.dev.themeColor}"`);
    expect(branded).not.toContain(`content="${ENVIRONMENTS.prod.themeColor}"`);
  });

  it('rewrites shared links to the environment that serves them', () => {
    const branded = brandIndexHtml(INDEX_HTML, ENVIRONMENTS.dev, DEV_ORIGIN);

    expect(branded).toContain(`content="${DEV_ORIGIN}/og-image.png"`);
    expect(branded).not.toContain(PRODUCTION_ORIGIN);
  });

  it.each(ENVIRONMENT_NAMES)('serves %s only assets that exist', (name) => {
    const branded = brandIndexHtml(INDEX_HTML, ENVIRONMENTS[name], PRODUCTION_ORIGIN);
    const assets = [...branded.matchAll(/(?:href|content)="[^"]*\/([\w-]+\.(?:png|ico))"/g)];

    expect(assets.length).toBeGreaterThan(0);
    for (const [, file] of assets) {
      expect(__PUBLIC_FILES__).toContain(file);
    }
  });

  it('refuses to brand a document it no longer recognises', () => {
    const withoutTitle = INDEX_HTML.replace('<title>', '<h1>');

    expect(() => brandIndexHtml(withoutTitle, ENVIRONMENTS.dev, DEV_ORIGIN)).toThrow(
      /environment branding is stale/,
    );
  });
});
