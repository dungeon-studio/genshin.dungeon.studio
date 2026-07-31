// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { cn } from '@/lib/utils';

interface ThemedIconProps {
  lightSrc: string;
  darkSrc: string;
  /** Description for assistive tech; an empty string marks the icon decorative. */
  alt: string;
  /** Classes shared by both variants (sizing, opacity, ...). */
  className?: string;
}

/**
 * Renders light and dark image variants, swapped by the active theme via
 * Tailwind's `dark:` variant so the browser paints only the matching one.
 */
export function ThemedIcon({ lightSrc, darkSrc, alt, className }: ThemedIconProps): JSX.Element {
  const decorative = alt === '';

  const shared = {
    alt,
    'aria-hidden': decorative || undefined,
    loading: 'lazy',
    decoding: 'async',
  } as const;

  // `hidden` leads the dark variant so `className` can still widen it, while
  // each variant's `dark:` utility trails to win the theme-active conflict.
  return (
    <>
      <img {...shared} src={lightSrc} className={cn(className, 'dark:hidden')} />
      <img {...shared} src={darkSrc} className={cn('hidden', className, 'dark:block')} />
    </>
  );
}
