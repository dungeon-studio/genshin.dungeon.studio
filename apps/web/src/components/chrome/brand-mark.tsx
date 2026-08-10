// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { resolveEnvironment } from '@/lib/environments';

/**
 * The app mark, wearing the same badge the browser tab does.
 *
 * Decorative in production, where the wordmark beside it already says
 * everything. A badged mark carries information the wordmark does not, so it
 * takes an accessible name — the environment alone, since repeating the app
 * name would say it twice inside one link.
 */
export function BrandMark(): JSX.Element {
  const { badge } = resolveEnvironment(import.meta.env.VITE_APP_ENV);

  const suffix = badge === null ? '' : `-${badge.iconSuffix}`;
  const name = badge === null ? '' : `${badge.label.toLowerCase()} environment`;
  const decorative = badge === null ? true : undefined;

  return (
    <>
      <img
        src={`/favicon-32x32${suffix}.png`}
        alt={name}
        aria-hidden={decorative}
        width={32}
        height={32}
        className="dark:hidden"
      />
      <img
        src={`/favicon-32x32-dark${suffix}.png`}
        alt={name}
        aria-hidden={decorative}
        width={32}
        height={32}
        className="hidden dark:block"
      />
    </>
  );
}
