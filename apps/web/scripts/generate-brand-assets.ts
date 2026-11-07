// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Derives the badged favicons and link preview from the source marks in
// public/. To run it, see docs/how-tos/regenerate-brand-assets.md.
//
// Each asset is drawn as SVG and rasterized by resvg's WebAssembly build, which
// encodes the same bytes on every platform; a native renderer can differ by
// architecture and fail the hook on unchanged inputs. The font comes from a
// file rather than the host's font configuration for the same reason.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initWasm, Resvg } from '@resvg/resvg-wasm';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const ENVIRONMENTS = fileURLToPath(new URL('../src/lib/environments.json', import.meta.url));

const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_FAMILY = 'DejaVu Sans';

const BRAND_TEAL = '#1f514e';

const ICO_SIZES = [16, 32, 48];

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_MARGIN = 100;
const OG_MARK_SIDE = 240;
const OG_MARK_TOP = 108;

const FAVICON_SIDE = 32;
const LIGHT_SIDE = 512;

interface Badge {
  suffix: string;
  glyph: string;
  color: string;
}

interface Environment {
  themeColor: string;
  badge: { iconSuffix: string; glyph: string } | null;
}

function loadBadges(): Badge[] {
  const environments = JSON.parse(readFileSync(ENVIRONMENTS, 'utf8')) as Record<
    string,
    Environment
  >;
  return Object.values(environments).flatMap(({ badge, themeColor }) =>
    badge === null ? [] : [{ suffix: badge.iconSuffix, glyph: badge.glyph, color: themeColor }],
  );
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => `&#${String(c.codePointAt(0))};`);
}

function pngHref(name: string): string {
  return `data:image/png;base64,${readFileSync(PUBLIC + name).toString('base64')}`;
}

let fontBuffer: Uint8Array;

function render(svg: string): Uint8Array {
  const resvg = new Resvg(svg, {
    font: { fontBuffers: [fontBuffer], defaultFontFamily: FONT_FAMILY },
  });
  try {
    return resvg.render().asPng();
  } finally {
    resvg.free();
  }
}

/**
 * resvg samples an image drawn far below its size without filtering, which
 * aliases the mark's thin lines, so this halves until one last step remains.
 */
function downscale(png: Uint8Array, from: number, to: number): Uint8Array {
  let image = png;
  let side = from;
  while (side > to) {
    const next = side > 2 * to ? side / 2 : to;
    const href = `data:image/png;base64,${Buffer.from(image).toString('base64')}`;
    image = render(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${String(next)}" height="${String(next)}">` +
        `<image href="${href}" width="${String(next)}" height="${String(next)}"/></svg>`,
    );
    side = next;
  }
  return image;
}

interface Text {
  content: string;
  x: number;
  y: number;
  size: number;
  fill: string;
}

function text({ content, x, y, size, fill }: Text): string {
  return (
    `<text x="${String(x)}" y="${String(y)}" font-family="${FONT_FAMILY}" font-weight="bold" ` +
    `font-size="${String(size)}" fill="${fill}" text-anchor="middle" ` +
    `dominant-baseline="central">${escapeXml(content)}</text>`
  );
}

/** Inserts the environment's `iconSuffix` before the extension. */
function variant(name: string, suffix: string): string {
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot)}-${suffix}${name.slice(dot)}`;
}

/**
 * Overlays a filled disc in the bottom-right corner, glyph inside it.
 *
 * Geometry scales with the mark so one badge reads at 512px as a letter and at
 * 16px as a colored corner, which is all a browser tab needs it to be.
 */
function badgedSvg(markHref: string, side: number, badge: Badge): string {
  const radius = Math.round(side * 0.56) / 2;
  const center = side - radius;
  // The halo cut out behind the disc keeps the badge from blending with the
  // copper it sits on at small sizes.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(side)}" height="${String(side)}">` +
    `<mask id="halo"><rect width="100%" height="100%" fill="#fff"/>` +
    `<circle cx="${String(center)}" cy="${String(center)}" r="${String(radius + 1)}" fill="#000"/></mask>` +
    `<image href="${markHref}" width="${String(side)}" height="${String(side)}" mask="url(#halo)"/>` +
    `<circle cx="${String(center)}" cy="${String(center)}" r="${String(radius)}" fill="${badge.color}"/>` +
    text({
      content: badge.glyph,
      x: center,
      y: center,
      size: Math.round(radius * 2 * 0.78),
      fill: '#ffffff',
    }) +
    `</svg>`
  );
}

/** A 6-byte header, then a 16-byte directory entry per PNG, then the PNGs. */
function ico(images: { side: number; png: Uint8Array }[]): Uint8Array {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ side, png }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(side % 256, entry);
    header.writeUInt8(side % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

function* badgedIcons(): Generator<[string, Uint8Array]> {
  const light = pngHref('icon-512x512.png');
  const dark = pngHref('favicon-32x32-dark.png');

  for (const badge of loadBadges()) {
    const badgedLight = render(badgedSvg(light, LIGHT_SIDE, badge));

    yield [
      variant('favicon-32x32.png', badge.suffix),
      downscale(badgedLight, LIGHT_SIDE, FAVICON_SIDE),
    ];
    yield [
      variant('favicon.ico', badge.suffix),
      ico(ICO_SIZES.map((side) => ({ side, png: downscale(badgedLight, LIGHT_SIDE, side) }))),
    ];
    // The dark mark exists only at its display size, so it is badged there.
    yield [
      variant('favicon-32x32-dark.png', badge.suffix),
      render(badgedSvg(dark, FAVICON_SIDE, badge)),
    ];
  }
}

function textWidth(content: string, size: number): number {
  const resvg = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(OG_WIDTH)}" height="${String(OG_HEIGHT)}">` +
      text({ content, x: OG_WIDTH / 2, y: OG_HEIGHT / 2, size, fill: '#000' }) +
      `</svg>`,
    { font: { fontBuffers: [fontBuffer], defaultFontFamily: FONT_FAMILY } },
  );
  try {
    return resvg.getBBox()?.width ?? 0;
  } finally {
    resvg.free();
  }
}

/** Shrinks until the line fits, so renaming the app cannot overflow the canvas. */
function fitFontSize(content: string, size: number, maxWidth: number): number {
  let fitted = size;
  while (fitted > 8 && textWidth(content, fitted) > maxWidth) {
    fitted -= 2;
  }
  return fitted;
}

function centeredLine(content: string, baseline: number, size: number, fill: string): string {
  return text({
    content,
    x: OG_WIDTH / 2,
    y: baseline,
    size: fitFontSize(content, size, OG_WIDTH - 2 * OG_MARGIN),
    fill,
  });
}

/** A link preview is read at thumbnail size, so it carries mark and name only. */
function ogImage(): [string, Uint8Array] {
  const markLeft = (OG_WIDTH - OG_MARK_SIDE) / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(OG_WIDTH)}" height="${String(OG_HEIGHT)}">` +
    `<rect width="100%" height="100%" fill="${BRAND_TEAL}"/>` +
    `<image href="${pngHref('icon-512x512.png')}" x="${String(markLeft)}" y="${String(OG_MARK_TOP)}" ` +
    `width="${String(OG_MARK_SIDE)}" height="${String(OG_MARK_SIDE)}"/>` +
    centeredLine('Genshin Planner', 428, 88, '#ffffff') +
    centeredLine('Plan your teams and manage your collection.', 518, 36, '#a8d5d1') +
    `</svg>`;
  return ['og-image.png', render(svg)];
}

function committed(name: string): Buffer | null {
  const path = PUBLIC + name;
  return existsSync(path) ? readFileSync(path) : null;
}

/** The hook fails on any rewrite, so this listing is what a contributor sees. */
async function main(): Promise<void> {
  if (!existsSync(FONT)) {
    process.stderr.write(`${FONT} is missing; install the DejaVu fonts and retry\n`);
    process.exit(1);
  }
  fontBuffer = readFileSync(FONT);
  const require = createRequire(import.meta.url);
  await initWasm(readFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm')));

  const stale = [...badgedIcons(), ogImage()].filter(
    ([name, data]) => !committed(name)?.equals(data),
  );

  for (const [name, data] of stale) {
    writeFileSync(PUBLIC + name, data);
    process.stdout.write(`${relative(REPO, PUBLIC + name)} was stale and has been regenerated\n`);
  }

  if (stale.length > 0) {
    process.stdout.write(
      'Commit the regenerated assets. To rebuild them locally, run ' +
        '`pnpm --filter @genshin/web brand-assets`.\n',
    );
  }
}

await main();
