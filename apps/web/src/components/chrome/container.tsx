// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Centers content and constrains it to the app's horizontal gutter
 * (`mx-auto max-w-7xl px-4`). Apply to the inner element of a full-bleed
 * wrapper so backgrounds and borders span the viewport while content stays
 * aligned with the rest of the app. Vertical spacing is left to each call
 * site via `className`.
 */
const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mx-auto max-w-7xl px-4', className)} {...props} />
  ),
);
Container.displayName = 'Container';

export { Container };
