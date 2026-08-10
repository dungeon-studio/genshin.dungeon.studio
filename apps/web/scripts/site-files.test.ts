// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PUBLIC_ROUTES, robotsTxt, sitemapXml } from './site-files';

const PUBLIC_ORIGIN = 'https://genshin.dungeon.studio';
const PREVIEW_ORIGIN = 'https://develop.genshin.dungeon.studio';

function agentRules(robots: string): Record<string, string> {
  return Object.fromEntries(
    robots
      .split('\n\n')
      .map((group) => group.split('\n').filter((line) => !line.startsWith('#')))
      .filter((lines) => lines[0]?.startsWith('User-agent: '))
      .map((lines) => [lines[0].replace('User-agent: ', ''), lines[1]]),
  );
}

describe('robotsTxt', () => {
  it('opens the public origin to crawlers', () => {
    const rules = agentRules(robotsTxt(PUBLIC_ORIGIN));

    expect(rules['*']).toBe('Allow: /');
    expect(rules['GPTBot']).toBe('Allow: /');
    expect(rules['ClaudeBot']).toBe('Allow: /');
  });

  it('closes every other origin, so preview deployments stay unindexed', () => {
    const rules = agentRules(robotsTxt(PREVIEW_ORIGIN));

    expect(rules['*']).toBe('Disallow: /');
    expect(rules['GPTBot']).toBe('Disallow: /');
    expect(rules['ClaudeBot']).toBe('Disallow: /');
  });

  it('points at the sitemap on its own origin', () => {
    expect(robotsTxt(PREVIEW_ORIGIN)).toContain(`Sitemap: ${PREVIEW_ORIGIN}/sitemap.xml`);
  });
});

describe('sitemapXml', () => {
  it('lists every public route against the origin it is served from', () => {
    const sitemap = sitemapXml(PREVIEW_ORIGIN);

    for (const route of PUBLIC_ROUTES) {
      expect(sitemap).toContain(`<loc>${PREVIEW_ORIGIN}${route}</loc>`);
    }
  });
});

describe('PUBLIC_ROUTES', () => {
  // The router is the source of truth; this list is a hand-kept copy of it,
  // so a route added there without a sitemap entry fails here.
  it('covers every route the router declares', () => {
    const app = readFileSync('src/app.tsx', 'utf8');
    const declared = [...app.matchAll(/<Route path="([^"]+)"/g)]
      .map(([, path]) => path)
      .filter((path) => path !== '*');

    expect(declared).not.toHaveLength(0);
    expect([...PUBLIC_ROUTES].sort()).toEqual(declared.sort());
  });
});
