// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

/** WCAG 2.1 AA minimums: 1.4.3 for body text, 1.4.11 for interface elements. */
const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

/** Surfaces that arbitrary content sits on top of. */
const SURFACES = ['background', 'card', 'popover', 'muted', 'secondary', 'accent'];

/** Tokens Tailwind exposes as a text colour over any of those surfaces. */
const TEXT_TOKENS = ['foreground', 'muted-foreground'];

/** Roles whose own colour reads as text or as a border rather than as a fill. */
const SIGNALS = ['primary', 'destructive', 'success', 'warning'];

/** Plain surfaces a signal colour or a focus ring lands on. */
const PLAIN_SURFACES = ['background', 'card', 'popover'];

type Hsl = readonly [hue: number, saturation: number, lightness: number];

type Rgb = readonly [red: number, green: number, blue: number];

interface Pairing {
  foreground: string;
  background: string;
  minimum: number;
}

const css = __THEME_CSS__;

/**
 * Custom properties declared under a selector, keyed without the `--` prefix.
 * A selector can appear more than once — `:root` also carries the base
 * typography rule — so every matching block contributes.
 */
function themeTokens(selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blocks = css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g'));

  const tokens = new Map(
    [...blocks].flatMap(([, body]) =>
      [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]): [string, string] => [
        name,
        value.trim(),
      ]),
    ),
  );

  if (tokens.size === 0) throw new Error(`no custom properties under ${selector} in index.css`);

  return tokens;
}

/** Parses the space-separated `H S% L%` triple Tailwind wraps in `hsl(var(--token))`. */
function parseHsl(value: string): Hsl {
  const parts = value.split(/\s+/).map((part) => Number.parseFloat(part));
  if (parts.length !== 3 || !parts.every((part) => Number.isFinite(part))) {
    throw new Error(`expected an "H S% L%" triple, got: ${value}`);
  }

  const [hue, saturation, lightness] = parts;
  return [hue, saturation, lightness];
}

/** HSL to sRGB channels in 0–1, per the CSS Color Module Level 4 conversion. */
function hslToRgb([hue, saturation, lightness]: Hsl): Rgb {
  const level = lightness / 100;
  const chroma = (saturation / 100) * Math.min(level, 1 - level);

  const channel = (offset: number): number => {
    const position = (offset + hue / 30) % 12;
    return level - chroma * Math.max(-1, Math.min(position - 3, 9 - position, 1));
  };

  return [channel(0), channel(8), channel(4)];
}

/** Relative luminance per WCAG 2.1. */
function relativeLuminance([red, green, blue]: Rgb): number {
  const linear = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function tokenValue(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`missing --${name}`);
  return value;
}

function contrast(tokens: Map<string, string>, foreground: string, background: string): number {
  const luminance = (name: string): number =>
    relativeLuminance(hslToRgb(parseHsl(tokenValue(tokens, name))));

  const front = luminance(foreground);
  const back = luminance(background);
  return (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
}

/**
 * Every contrast requirement the palette owes, keyed by pair so that overlapping
 * rules collapse to the strictest minimum rather than to duplicate cases.
 */
function requiredPairings(tokenNames: string[]): Pairing[] {
  // `--x-foreground` exists to sit on `--x`; bare `--foreground` sits on `--background`.
  const ownRole = tokenNames
    .filter((name) => name.endsWith('foreground'))
    .map((foreground) => ({
      foreground,
      background:
        foreground === 'foreground' ? 'background' : foreground.replace(/-foreground$/, ''),
      minimum: AA_TEXT,
    }));

  const bodyText = TEXT_TOKENS.flatMap((foreground) =>
    SURFACES.map((background) => ({ foreground, background, minimum: AA_TEXT })),
  );

  const signals = SIGNALS.flatMap((foreground) =>
    PLAIN_SURFACES.map((background) => ({ foreground, background, minimum: AA_TEXT })),
  );

  const rings = PLAIN_SURFACES.map((background) => ({
    foreground: 'ring',
    background,
    minimum: AA_NON_TEXT,
  }));

  const strictest = new Map<string, Pairing>();
  for (const pairing of [...ownRole, ...bodyText, ...signals, ...rings]) {
    const key = `${pairing.foreground} on ${pairing.background}`;
    const seen = strictest.get(key);
    if (seen === undefined || pairing.minimum > seen.minimum) strictest.set(key, pairing);
  }

  return [...strictest.values()];
}

describe.each([
  { mode: 'light', selector: ':root' },
  { mode: 'dark', selector: '.dark' },
])('$mode theme', ({ selector }) => {
  const tokens = themeTokens(selector);

  it.each(requiredPairings([...tokens.keys()]))(
    '$foreground on $background clears $minimum:1',
    ({ foreground, background, minimum }) => {
      expect(contrast(tokens, foreground, background)).toBeGreaterThanOrEqual(minimum);
    },
  );
});
