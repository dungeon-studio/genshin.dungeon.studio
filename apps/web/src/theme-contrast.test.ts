// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const css = __THEME_CSS__;

/**
 * Custom properties declared under a `:root` or `.dark` selector, keyed without
 * the `--` prefix. The selector appears more than once (`:root` also carries the
 * base typography rule), so every matching block contributes.
 */
function themeTokens(selector: string): Map<string, string> {
  const blocks = [...css.matchAll(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g'))];

  const tokens = new Map(
    blocks.flatMap(([, body]) =>
      [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]): [string, string] => [
        name,
        value.trim(),
      ]),
    ),
  );

  if (tokens.size === 0) throw new Error(`no custom properties under ${selector} in index.css`);

  return tokens;
}

/**
 * Relative luminance per WCAG 2.1 for a space-separated `H S% L%` triple, the
 * shape Tailwind wraps in `hsl(var(--token))`.
 */
function luminance(hsl: string): number {
  const [h, s, l] = hsl.split(/\s+/).map((part) => Number.parseFloat(part));
  if ([h, s, l].some(Number.isNaN)) throw new Error(`unparseable HSL triple: ${hsl}`);

  const chroma = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l / 100 - chroma / 2;

  const sextant = Math.floor(h / 60) % 6;
  const [r, g, b] = (
    [
      [chroma, secondary, 0],
      [secondary, chroma, 0],
      [0, chroma, secondary],
      [0, secondary, chroma],
      [secondary, 0, chroma],
      [chroma, 0, secondary],
    ] as const
  )[sextant].map((channel) => channel + match);

  const linear = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(tokens: Map<string, string>, foreground: string, background: string): number {
  const read = (name: string): string => {
    const value = tokens.get(name);
    if (value === undefined) throw new Error(`missing --${name}`);
    return value;
  };

  const [lighter, darker] = [luminance(read(foreground)), luminance(read(background))].sort(
    (a, b) => b - a,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

/** Surfaces that `--foreground` and `--muted-foreground` are rendered on top of. */
const SURFACES = ['background', 'card', 'popover', 'muted', 'secondary', 'accent'];

/** Roles whose colour is also used as text or as a border on a plain surface. */
const SIGNALS = ['primary', 'destructive', 'success', 'warning'];

describe.each([
  ['light', ':root'],
  ['dark', '\\.dark'],
])('%s theme', (_name, selector) => {
  const tokens = themeTokens(selector);

  // Every `--x-foreground` exists to sit on `--x`; `--foreground` sits on `--background`.
  const pairings = [...tokens.keys()]
    .filter((name) => name.endsWith('foreground'))
    .map((foreground) => ({
      foreground,
      background:
        foreground === 'foreground' ? 'background' : foreground.replace(/-foreground$/, ''),
    }));

  it.each(pairings)('$foreground meets AA on $background', ({ foreground, background }) => {
    expect(contrast(tokens, foreground, background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(SURFACES)('foreground and muted-foreground meet AA on %s', (surface) => {
    expect(contrast(tokens, 'foreground', surface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(tokens, 'muted-foreground', surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(SIGNALS)('%s meets AA as text on background and card', (signal) => {
    expect(contrast(tokens, signal, 'background')).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(tokens, signal, 'card')).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('ring meets the non-text minimum against every surface it focuses', () => {
    for (const surface of ['background', 'card', 'popover']) {
      expect(contrast(tokens, 'ring', surface)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });
});
