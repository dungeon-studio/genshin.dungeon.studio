// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { resolveEnvironment } from '@/lib/environments';
import { cn } from '@/lib/utils';

/** Names the deployment on every environment but production, which renders nothing. */
export function EnvironmentBadge(): JSX.Element | null {
  const { badge } = resolveEnvironment(import.meta.env.VITE_APP_ENV);

  if (badge === null) return null;

  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-xs font-semibold tracking-wider',
        badge.pillClassName,
      )}
    >
      {badge.label}
    </span>
  );
}
