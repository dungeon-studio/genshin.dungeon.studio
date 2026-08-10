// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Which deployment the bundle was built for, and how it announces itself.
 *
 * Production carries no markers, so every value here is an addition layered on
 * top of it. A null `badge` is what makes an environment production.
 */

/**
 * The one origin serving the real site. Everything that has to tell production
 * from the rest — the crawler files, the branding rewriter — compares against
 * this rather than carrying its own copy.
 */
export const PRODUCTION_ORIGIN = 'https://genshin.dungeon.studio';

export const ENVIRONMENT_NAMES = ['dev', 'staging', 'prod'] as const;

export type EnvironmentName = (typeof ENVIRONMENT_NAMES)[number];

export interface Badge {
  /** Names the environment in the mark's accessible name and the document title. */
  label: string;
  /** Overlaid on the favicon by the brand-asset generator. */
  glyph: string;
  /** Names the favicon variant: `favicon-32x32.png` -> `favicon-32x32-alpha.png`. */
  iconSuffix: string;
}

export interface Environment {
  name: EnvironmentName;
  /** Mobile browser chrome, as a literal hex: a meta tag cannot read a CSS variable. */
  themeColor: string;
  badge: Badge | null;
}

/**
 * A new environment has to look unmistakably unlike production and unlike its
 * siblings, in a hue the palette does not already give a meaning to.
 */
export const ENVIRONMENTS: Readonly<Record<EnvironmentName, Environment>> = {
  dev: {
    name: 'dev',
    themeColor: '#752f93',
    badge: {
      label: 'Alpha',
      glyph: 'α',
      iconSuffix: 'alpha',
    },
  },
  staging: {
    name: 'staging',
    themeColor: '#1c5392',
    badge: {
      label: 'Beta',
      glyph: 'β',
      iconSuffix: 'beta',
    },
  },
  prod: {
    name: 'prod',
    themeColor: '#1f514e',
    badge: null,
  },
};

export function isEnvironmentName(value: string | undefined): value is EnvironmentName {
  return ENVIRONMENT_NAMES.includes(value as EnvironmentName);
}

/**
 * Falling back to `dev` makes a misconfigured build over-announce itself rather
 * than pass for production. Builds reject an unrecognised value outright before
 * this is reached.
 */
export function resolveEnvironment(value: string | undefined): Environment {
  return isEnvironmentName(value) ? ENVIRONMENTS[value] : ENVIRONMENTS.dev;
}
