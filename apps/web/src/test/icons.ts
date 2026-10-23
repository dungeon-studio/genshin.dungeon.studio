// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { screen } from '@testing-library/react';

/**
 * Lists what each decorative icon in the named button draws: an image's source
 * or a glyph's mask. Decorative icons have no role to query by.
 */
export function iconSources(buttonName: string): string[] {
  return [
    ...screen
      .getByRole('button', { name: buttonName })
      .querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
  ].map((icon) => icon.getAttribute('src') ?? icon.style.maskImage);
}
