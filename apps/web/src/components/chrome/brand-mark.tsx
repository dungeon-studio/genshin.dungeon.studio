// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { resolveEnvironment } from '@/lib/environments';

/** One mark per colour scheme; CSS shows whichever matches, so both are emitted. */
const MARKS = [
  { file: 'favicon-32x32', className: 'dark:hidden' },
  { file: 'favicon-32x32-dark', className: 'hidden dark:block' },
] as const;

const SIZE = 32;

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
      {MARKS.map(({ file, className }) => (
        <img
          key={file}
          src={`/${file}${suffix}.png`}
          alt={name}
          aria-hidden={decorative}
          width={SIZE}
          height={SIZE}
          className={className}
        />
      ))}
    </>
  );
}
