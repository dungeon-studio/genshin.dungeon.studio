// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Environment } from './environments.ts';

/**
 * index.html is authored as the production document, and every other
 * environment is derived from it here. That keeps the file readable on its own
 * and makes production the branch that runs no code at all.
 */

/** The origin baked into index.html; every other environment substitutes its own. */
export const PRODUCTION_ORIGIN = 'https://genshin.dungeon.studio';

/** What index.html owes this module. Losing any one of these fails the build. */
const DOCUMENT_TITLE = /(<title>)/;
const OG_TITLE = /(<meta property="og:title" content=")/;
const THEME_COLOR = /(<meta name="theme-color" content=")[^"]*(")/;
const ICON_HREF = /(<link\b[^>]*\brel="icon"[^>]*\bhref="\/[\w-]+)(\.(?:png|ico)")/g;

type Substitution = readonly [pattern: RegExp, replacement: string];

/**
 * A silently unapplied substitution ships an unbadged non-production site,
 * which is the exact confusion this is meant to prevent, so an index.html edit
 * that moves one of these out from under us fails the build instead.
 */
function substitute(html: string, [pattern, replacement]: Substitution): string {
  const branded = html.replace(pattern, replacement);

  if (branded === html) {
    throw new Error(`index.html has no match for ${pattern.source}; environment branding is stale`);
  }

  return branded;
}

/** Absolute Open Graph URLs have to name the origin actually serving the page. */
function brandOrigin(html: string, origin: string): string {
  if (origin === PRODUCTION_ORIGIN) return html;

  return substitute(html, [new RegExp(PRODUCTION_ORIGIN, 'g'), origin]);
}

/** Marks the tab as non-production: badged icons, bracketed titles, own chrome. */
function brandBadge(html: string, environment: Environment): string {
  const { badge } = environment;
  if (badge === null) return html;

  const substitutions: readonly Substitution[] = [
    [DOCUMENT_TITLE, `$1[${badge.label}] `],
    [OG_TITLE, `$1[${badge.label}] `],
    [THEME_COLOR, `$1${environment.themeColor}$2`],
    [ICON_HREF, `$1-${badge.iconSuffix}$2`],
  ];

  return substitutions.reduce(substitute, html);
}

export function brandIndexHtml(html: string, environment: Environment, origin: string): string {
  return brandBadge(brandOrigin(html, origin), environment);
}
