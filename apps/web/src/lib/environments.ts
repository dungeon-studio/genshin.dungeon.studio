// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Which deployment the bundle was built for, and how it announces itself.
 *
 * Production carries no markers, so every value here is an addition layered on
 * top of it. A null `badge` is what makes an environment production.
 */

export const ENVIRONMENT_NAMES = ['dev', 'staging', 'prod'] as const;

export type EnvironmentName = (typeof ENVIRONMENT_NAMES)[number];

export interface Badge {
  /** Shown in the header pill and prefixed, bracketed, to the document title. */
  label: string;
  /** Overlaid on the favicon by the brand-asset generator. */
  glyph: string;
  /** Names the favicon variant: `favicon-32x32.png` -> `favicon-32x32-alpha.png`. */
  iconSuffix: string;
  /** Tailwind fill and text for the header pill. */
  pillClassName: string;
}

export interface Environment {
  name: EnvironmentName;
  /** Mobile browser chrome, as a literal hex: a meta tag cannot read a CSS variable. */
  themeColor: string;
  badge: Badge | null;
}

/**
 * Environment identity owns the `--env-*` tokens and shares them with no other
 * role, so a new environment has to stay clear of the rest of the palette and
 * of its siblings. Each `themeColor` repeats the light-mode value of its token.
 */
export const ENVIRONMENTS: Readonly<Record<EnvironmentName, Environment>> = {
  dev: {
    name: 'dev',
    themeColor: '#752f93',
    badge: {
      label: 'ALPHA',
      glyph: 'α',
      iconSuffix: 'alpha',
      pillClassName: 'bg-env-dev text-env-dev-foreground',
    },
  },
  staging: {
    name: 'staging',
    themeColor: '#1c5392',
    badge: {
      label: 'BETA',
      glyph: 'β',
      iconSuffix: 'beta',
      pillClassName: 'bg-env-staging text-env-staging-foreground',
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
