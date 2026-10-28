// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { ThemedIcon } from '@/components/icons/themed-icon';

interface ChipIconProps {
  iconPath: (variant: 'light' | 'dark') => string;
  onFill: boolean;
}

const SIZE = 'h-3.5 w-3.5';

/**
 * Decorative. On a colored fill the icon takes the label's color, because its
 * own colors can match the fill.
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
      // Tailwind generates only classes written out in source, not per-icon URLs.
      style={{ maskImage: `url(${src})` }}
    />
  );
}
