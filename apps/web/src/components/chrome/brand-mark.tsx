// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';
import { resolveEnvironment } from '@/lib/environments';

const SIZE = 32;

/**
 * The app mark, wearing the same badge the browser tab does.
 *
 * Decorative in production, where the wordmark beside it says everything. A
 * badge is information the wordmark lacks, so it earns an accessible name: the
 * environment only, because the wordmark is already inside the same link.
 */
export function BrandMark(): JSX.Element {
  const { badge } = resolveEnvironment(import.meta.env.VITE_APP_ENV);

  const suffix = badge === null ? '' : `-${badge.iconSuffix}`;
  const name = badge === null ? '' : `${badge.label.toLowerCase()} environment`;

  return (
    <ThemedIcon
      lightSrc={`/favicon-32x32${suffix}.png`}
      darkSrc={`/favicon-32x32-dark${suffix}.png`}
      alt={name}
      width={SIZE}
      height={SIZE}
    />
  );
}
