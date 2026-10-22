// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';

interface ChipIconProps {
  iconPath: (variant: 'light' | 'dark') => string;
  /** The chip wears a colored fill rather than the page background. */
  onFill: boolean;
}

const SIZE = 'h-3.5 w-3.5';

/**
 * A decorative chip icon. On a colored fill, which the icon's own colors can
 * match, it takes the label's color and so the label's contrast; elsewhere it
 * follows the page theme.
 */
export function ChipIcon({ iconPath, onFill }: ChipIconProps): JSX.Element {
  if (onFill) {
    return <GlyphIcon src={iconPath('light')} />;
  }

  return (
    <ThemedIcon lightSrc={iconPath('light')} darkSrc={iconPath('dark')} alt="" className={SIZE} />
  );
}

/** Paints an icon's silhouette in the current text color. */
function GlyphIcon({ src }: { src: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={`${SIZE} inline-block shrink-0 bg-current mask-contain mask-center mask-no-repeat`}
      // The mask URL varies per icon, which no static utility class can name.
      style={{ maskImage: `url(${src})` }}
    />
  );
}
