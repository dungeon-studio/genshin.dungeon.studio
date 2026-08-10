// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Which deployment the bundle was built for, and how it announces itself.
 *
 * Production carries no markers, so every environment-specific value here is an
 * addition layered onto the production document rather than a substitution for
 * something it already had. A null `badge` is what makes an environment
 * production.
 */

export const ENVIRONMENT_NAMES = ['dev', 'staging', 'prod'] as const;

export type EnvironmentName = (typeof ENVIRONMENT_NAMES)[number];

export interface EnvironmentBadge {
  /** Shown in the header pill and prefixed, bracketed, to the document title. */
  label: string;
  /** Overlaid on the favicon by scripts/generate-icons.ts. */
  glyph: string;
  /** Names the favicon variant: `favicon-32x32.png` -> `favicon-32x32-alpha.png`. */
  iconSuffix: string;
  /** Carries the same signal as `themeColor`, which cannot read a CSS variable. */
  pillClassName: string;
}

export interface Environment {
  name: EnvironmentName;
  /** Mobile browser chrome. A literal hex because meta tags cannot read CSS variables. */
  themeColor: string;
  badge: EnvironmentBadge | null;
}

/**
 * Severity, not brand: the further an environment sits from production, the
 * louder it looks, so nobody has to learn a color key to read a tab. The
 * non-production hexes are the light-mode `--destructive` and `--warning` of
 * index.css; production keeps the brand teal derived from the app icon.
 */
export const ENVIRONMENTS: Readonly<Record<EnvironmentName, Environment>> = {
  dev: {
    name: 'dev',
    themeColor: '#b81e1e',
    badge: {
      label: 'ALPHA',
      glyph: 'α',
      iconSuffix: 'alpha',
      pillClassName: 'bg-destructive text-destructive-foreground',
    },
  },
  staging: {
    name: 'staging',
    themeColor: '#8f5614',
    badge: {
      label: 'BETA',
      glyph: 'β',
      iconSuffix: 'beta',
      pillClassName: 'bg-warning text-warning-foreground',
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
 * Unset and unrecognised both resolve to `dev`, so the failure mode of a
 * misconfigured build is an environment that over-announces itself rather than
 * one that passes for production. Builds reject an unrecognised value outright;
 * see the validate-env plugin in vite.config.ts.
 */
export function resolveEnvironment(value: string | undefined): Environment {
  return isEnvironmentName(value) ? ENVIRONMENTS[value] : ENVIRONMENTS.dev;
}
