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

const FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_FAMILY = 'DejaVu Sans';

const BRAND_TEAL = '#1f514e';

const ICO_SIDES = [16, 32, 48];
const FAVICON_SIDE = 32;
const LIGHT_MARK_SIDE = 512;

const BADGE_DIAMETER_RATIO = 0.56;
const BADGE_GLYPH_RATIO = 0.78;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_MARGIN = 100;
const OG_MARK_SIDE = 240;
const OG_MARK_TOP = 108;
const OG_MIN_FONT_SIZE = 8;
const OG_FONT_SIZE_STEP = 2;

interface Asset {
  name: string;
  data: Uint8Array;
}

interface Badge {
  suffix: string;
  glyph: string;
  color: string;
}

interface Environment {
  themeColor: string;
  badge: { iconSuffix: string; glyph: string } | null;
}

interface Text {
  content: string;
  x: number;
  y: number;
  size: number;
  fill: string;
}

interface Line {
  content: string;
  y: number;
  size: number;
  fill: string;
}

function readFont(): Uint8Array {
  if (!existsSync(FONT_PATH)) {
    process.stderr.write(`${FONT_PATH} is missing; install the DejaVu fonts and retry\n`);
    process.exit(1);
  }
  return readFileSync(FONT_PATH);
}

const FONT = { fontBuffers: [readFont()], defaultFontFamily: FONT_FAMILY };

function loadBadges(): Badge[] {
  const environments = JSON.parse(readFileSync(ENVIRONMENTS, 'utf8')) as Record<
    string,
    Environment
  >;
  return Object.values(environments).flatMap(({ badge, themeColor }) =>
    badge === null ? [] : [{ suffix: badge.iconSuffix, glyph: badge.glyph, color: themeColor }],
  );
}

function publicPath(name: string): string {
  return PUBLIC + name;
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => `&#${String(c.codePointAt(0))};`);
}

function dataUri(png: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

function svg(width: number, height: number, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">` +
    `${body}</svg>`
  );
}

function text({ content, x, y, size, fill }: Text): string {
  return (
    `<text x="${String(x)}" y="${String(y)}" font-family="${FONT_FAMILY}" font-weight="bold" ` +
    `font-size="${String(size)}" fill="${fill}" text-anchor="middle" ` +
    `dominant-baseline="central">${escapeXml(content)}</text>`
  );
}

function withResvg<T>(source: string, apply: (resvg: InstanceType<typeof Resvg>) => T): T {
  const resvg = new Resvg(source, { font: FONT });
  try {
    return apply(resvg);
  } finally {
    resvg.free();
  }
}

function render(source: string): Uint8Array {
  return withResvg(source, (resvg) => resvg.render().asPng());
}

/**
 * resvg samples an image drawn far below its size without filtering, which
 * aliases the mark's thin lines, so this halves until one last step remains.
 */
function downscale(png: Uint8Array, from: number, to: number): Uint8Array {
  let image = png;
  for (let side = from; side > to;) {
    side = side > 2 * to ? side / 2 : to;
    const href = dataUri(image);
    image = render(
      svg(side, side, `<image href="${href}" width="${String(side)}" height="${String(side)}"/>`),
    );
  }
  return image;
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
function badgedMark(markHref: string, side: number, badge: Badge): Uint8Array {
  const diameter = Math.round(side * BADGE_DIAMETER_RATIO);
  const radius = diameter / 2;
  const center = String(side - radius);
  // The halo cut out behind the disc keeps the badge from blending with the
  // copper it sits on at small sizes.
  return render(
    svg(
      side,
      side,
      `<mask id="halo"><rect width="100%" height="100%" fill="#fff"/>` +
        `<circle cx="${center}" cy="${center}" r="${String(radius + 1)}" fill="#000"/></mask>` +
        `<image href="${markHref}" width="${String(side)}" height="${String(side)}" mask="url(#halo)"/>` +
        `<circle cx="${center}" cy="${center}" r="${String(radius)}" fill="${badge.color}"/>` +
        text({
          content: badge.glyph,
          x: side - radius,
          y: side - radius,
          size: Math.round(diameter * BADGE_GLYPH_RATIO),
          fill: '#ffffff',
        }),
    ),
  );
}

function icoEntry(side: number, size: number, offset: number): Buffer {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(side % 256, 0);
  entry.writeUInt8(side % 256, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(size, 8);
  entry.writeUInt32LE(offset, 12);
  return entry;
}

/** A 6-byte header, then a 16-byte directory entry per PNG, then the PNGs. */
function ico(images: { side: number; png: Uint8Array }[]): Uint8Array {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = header.length + 16 * images.length;
  const entries = images.map(({ side, png }) => {
    const entry = icoEntry(side, png.length, offset);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

function* badgedIcons(): Generator<Asset> {
  const lightMark = dataUri(readFileSync(publicPath('icon-512x512.png')));
  const darkMark = dataUri(readFileSync(publicPath('favicon-32x32-dark.png')));

  for (const badge of loadBadges()) {
    const badgedLight = badgedMark(lightMark, LIGHT_MARK_SIDE, badge);

    yield {
      name: variant('favicon-32x32.png', badge.suffix),
      data: downscale(badgedLight, LIGHT_MARK_SIDE, FAVICON_SIDE),
    };
    yield {
      name: variant('favicon.ico', badge.suffix),
      data: ico(
        ICO_SIDES.map((side) => ({ side, png: downscale(badgedLight, LIGHT_MARK_SIDE, side) })),
      ),
    };
    // The dark mark exists only at its display size, so it is badged there.
    yield {
      name: variant('favicon-32x32-dark.png', badge.suffix),
      data: badgedMark(darkMark, FAVICON_SIDE, badge),
    };
  }
}

function textWidth(content: string, size: number): number {
  const source = svg(
    OG_WIDTH,
    OG_HEIGHT,
    text({ content, x: OG_WIDTH / 2, y: OG_HEIGHT / 2, size, fill: '#000' }),
  );
  return withResvg(source, (resvg) => resvg.getBBox()?.width ?? 0);
}

/** Shrinks until the line fits, so renaming the app cannot overflow the canvas. */
function fitFontSize(content: string, size: number): number {
  const maxWidth = OG_WIDTH - 2 * OG_MARGIN;
  let fitted = size;
  while (fitted > OG_MIN_FONT_SIZE && textWidth(content, fitted) > maxWidth) {
    fitted -= OG_FONT_SIZE_STEP;
  }
  return fitted;
}

function centeredLine({ content, y, size, fill }: Line): string {
  return text({ content, x: OG_WIDTH / 2, y, size: fitFontSize(content, size), fill });
}

/** A link preview is read at thumbnail size, so it carries mark and name only. */
function ogImage(): Asset {
  const mark = dataUri(readFileSync(publicPath('icon-512x512.png')));
  const markLeft = (OG_WIDTH - OG_MARK_SIDE) / 2;
  const source = svg(
    OG_WIDTH,
    OG_HEIGHT,
    `<rect width="100%" height="100%" fill="${BRAND_TEAL}"/>` +
      `<image href="${mark}" x="${String(markLeft)}" y="${String(OG_MARK_TOP)}" ` +
      `width="${String(OG_MARK_SIDE)}" height="${String(OG_MARK_SIDE)}"/>` +
      centeredLine({ content: 'Genshin Planner', y: 428, size: 88, fill: '#ffffff' }) +
      centeredLine({
        content: 'Plan your teams and manage your collection.',
        y: 518,
        size: 36,
        fill: '#a8d5d1',
      }),
  );
  return { name: 'og-image.png', data: render(source) };
}

function isStale({ name, data }: Asset): boolean {
  const path = publicPath(name);
  return !existsSync(path) || !readFileSync(path).equals(data);
}

/** The hook fails on any rewrite, so this listing is what a contributor sees. */
async function main(): Promise<void> {
  const require = createRequire(import.meta.url);
  await initWasm(readFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm')));

  const stale = [...badgedIcons(), ogImage()].filter(isStale);

  for (const { name, data } of stale) {
    writeFileSync(publicPath(name), data);
    process.stdout.write(
      `${relative(REPO, publicPath(name))} was stale and has been regenerated\n`,
    );
  }

  if (stale.length > 0) {
    process.stdout.write(
      'Commit the regenerated assets. To rebuild them locally, run ' +
        '`pnpm --filter @genshin/web brand-assets`.\n',
    );
  }
}

await main();
