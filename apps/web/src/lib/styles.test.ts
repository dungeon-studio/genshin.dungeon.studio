// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { elementBorderClass } from './elementStyles';

describe('elementBorderClass', () => {
  it('returns a dashed fallback when element is undefined', () => {
    expect(elementBorderClass(undefined)).toBe('border-dashed border-muted-foreground/30');
  });
});
