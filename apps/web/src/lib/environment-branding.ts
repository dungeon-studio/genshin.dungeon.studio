// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Environment } from './environments';

/**
 * index.html is authored as the production document, and every other
 * environment is derived from it here. That keeps the file readable on its own
 * and makes production the branch that runs no code at all.
 */

/** The origin baked into index.html; every other environment substitutes its own. */
export const PRODUCTION_ORIGIN = 'https://genshin.dungeon.studio';

/**
 * A silently unapplied substitution ships an unbadged non-production site,
 * which is the exact confusion this is meant to prevent, so an index.html edit
 * that moves one of these out from under us fails the build instead.
 */
function substitute(html: string, pattern: RegExp, replacement: string): string {
  const branded = html.replace(pattern, replacement);

  if (branded === html) {
    throw new Error(`index.html has no match for ${pattern.source}; environment branding is stale`);
  }

  return branded;
}

export function brandIndexHtml(html: string, environment: Environment, origin: string): string {
  let branded = html;

  if (origin !== PRODUCTION_ORIGIN) {
    branded = substitute(branded, new RegExp(PRODUCTION_ORIGIN, 'g'), origin);
  }

  const { badge } = environment;
  if (badge === null) return branded;

  branded = substitute(branded, /(<title>)/, `$1[${badge.label}] `);
  branded = substitute(branded, /(<meta property="og:title" content=")/, `$1[${badge.label}] `);
  branded = substitute(
    branded,
    /(<meta name="theme-color" content=")[^"]*(")/,
    `$1${environment.themeColor}$2`,
  );
  branded = substitute(
    branded,
    /(<link\b[^>]*\brel="icon"[^>]*\bhref="\/[\w-]+)(\.(?:png|ico)")/g,
    `$1-${badge.iconSuffix}$2`,
  );

  return branded;
}
