// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * The crawler-facing files served from the site root.
 *
 * They name absolute URLs, so they cannot be checked in as static assets:
 * every deployed origin needs its own copy. `site-files-plugin.ts` writes
 * them into the build output.
 */

export interface SiteFile {
  /** Path relative to the site root. */
  readonly name: string;
  readonly contents: string;
}

/**
 * The one origin whose content is meant to be indexed. Every other deployment
 * serves the same routes from a different host, so they tell crawlers to stay
 * out rather than compete with it.
 */
const PUBLIC_ORIGIN = 'https://genshin.dungeon.studio';

export function isPublicOrigin(origin: string): boolean {
  return origin === PUBLIC_ORIGIN;
}

/** Routes `src/app.tsx` renders, minus the catch-all. */
export const PUBLIC_ROUTES: readonly string[] = [
  '/',
  '/characters',
  '/weapons',
  '/privacy',
  '/terms',
];

/**
 * Agents that read the site for a model rather than for a search index. A
 * bare `*` group already binds them; naming each one states the position
 * explicitly, which is what their operators document as the opt-out signal.
 */
const AI_USER_AGENTS: readonly string[] = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Amazonbot',
  'Bytespider',
  'CCBot',
];

function robotsTxt(origin: string): string {
  const rule = isPublicOrigin(origin) ? 'Allow: /' : 'Disallow: /';
  const groups = ['*', ...AI_USER_AGENTS].map((agent) => `User-agent: ${agent}\n${rule}`);

  return [
    '# Generated at build time; edit apps/web/scripts/site-files.ts.',
    '',
    groups.join('\n\n'),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

function sitemapXml(origin: string): string {
  const urls = PUBLIC_ROUTES.map((route) => `  <url>\n    <loc>${origin}${route}</loc>\n  </url>`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** Everything the build has to drop at the root of `origin`. */
export function siteFiles(origin: string): readonly SiteFile[] {
  return [
    { name: 'robots.txt', contents: robotsTxt(origin) },
    { name: 'sitemap.xml', contents: sitemapXml(origin) },
  ];
}
