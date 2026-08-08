// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { cn } from '@/lib/utils';

interface ThemedIconProps {
  lightSrc: string;
  darkSrc: string;
  /** An empty string marks the icon decorative, mirrored to `aria-hidden`. */
  alt: string;
  /** Applied to both variants. */
  className?: string;
}

/** Swaps variants with Tailwind's `dark:` so the browser paints only the active theme's image. */
export function ThemedIcon({ lightSrc, darkSrc, alt, className }: ThemedIconProps): JSX.Element {
  const decorative = alt === '';

  // a11y lint cannot resolve `alt` through a spread.
  const shared = {
    'aria-hidden': decorative || undefined,
    loading: 'lazy',
    decoding: 'async',
  } as const;

  // `hidden` leads the dark variant so `className` can still widen it, while
  // each variant's `dark:` utility trails to win the theme-active conflict.
  return (
    <>
      <img {...shared} alt={alt} src={lightSrc} className={cn(className, 'dark:hidden')} />
      <img {...shared} alt={alt} src={darkSrc} className={cn('hidden', className, 'dark:block')} />
    </>
  );
}
