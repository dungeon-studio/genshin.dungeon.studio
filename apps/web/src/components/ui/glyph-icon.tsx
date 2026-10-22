// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { cn } from '@/lib/utils';

interface GlyphIconProps {
  src: string;
  className?: string;
}

/**
 * Paints an icon's silhouette in the current text color, so it keeps the
 * label's contrast on a fill the icon's own colors would vanish into.
 * Always decorative.
 */
export function GlyphIcon({ src, className }: GlyphIconProps): JSX.Element {
  // The mask URL varies per icon, which no static utility class can name.
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0 bg-current mask-contain mask-center mask-no-repeat',
        className,
      )}
      style={{ maskImage: `url(${src})` }}
    />
  );
}
