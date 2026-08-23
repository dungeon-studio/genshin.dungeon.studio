// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/**
 * Centers content and constrains it to the app's horizontal gutter
 * (`mx-auto max-w-7xl px-4`). Apply to the inner element of a full-bleed
 * wrapper so backgrounds and borders span the viewport while content stays
 * aligned with the rest of the app. Vertical spacing is left to each call
 * site via `className`.
 */
function Container({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('max-w-7xl px-4 mx-auto', className)} {...props} />;
}

export { Container };
