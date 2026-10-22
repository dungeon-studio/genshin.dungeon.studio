// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { screen } from '@testing-library/react';

/**
 * What each decorative icon inside the named button draws: an image reports
 * its source, a glyph its mask. Decorative icons have no accessible role to
 * query by.
 */
export function iconSources(buttonName: string): string[] {
  return [
    ...screen
      .getByRole('button', { name: buttonName })
      .querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
  ].map((icon) => icon.getAttribute('src') ?? icon.style.maskImage);
}
