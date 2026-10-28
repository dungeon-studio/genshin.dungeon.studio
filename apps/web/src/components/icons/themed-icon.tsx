// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/class-names';

export type IconVariant = 'light' | 'dark';

interface ThemedIconProps extends Pick<
  ComponentProps<'img'>,
  'loading' | 'decoding' | 'width' | 'height'
> {
  iconPath: (variant: IconVariant) => string;
  /** An empty string marks the icon decorative. */
  alt: string;
  /** Applied to both variants. */
  className?: string;
}

/** Swaps variants with Tailwind's `dark:` so the browser paints only the active theme's image. */
export function ThemedIcon({
  iconPath,
  alt,
  className,
  ...attributes
}: ThemedIconProps): JSX.Element {
  const decorative = alt === '';

  // a11y lint cannot resolve `alt` through a spread.
  const shared = { ...attributes, 'aria-hidden': decorative || undefined };

  // `hidden` leads the dark variant so `className` can still widen it, while
  // each variant's `dark:` utility trails to win the theme-active conflict.
  return (
    <>
      <img {...shared} alt={alt} src={iconPath('light')} className={cn(className, 'dark:hidden')} />
      <img
        {...shared}
        alt={alt}
        src={iconPath('dark')}
        className={cn('hidden', className, 'dark:block')}
      />
    </>
  );
}
