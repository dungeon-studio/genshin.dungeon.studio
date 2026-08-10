# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11,<12"]
# ///

"""Derive the committed brand assets from the two source marks in public/.

Run with `uv run apps/web/scripts/generate-brand-assets.py` after changing a
source mark or adding an environment, then commit what it writes.

Python rather than the workspace's own toolchain because the favicon is a
multi-resolution .ico, which Pillow writes directly and the Node imaging
libraries do not.

Keep BADGES and BRAND_TEAL in step with src/lib/environments.ts; the branding
test fails if a variant this script did not write is referenced.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PUBLIC = Path(__file__).resolve().parent.parent / "public"

FONT = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

BRAND_TEAL = "#1f514e"

# Icon sizes inside favicon.ico, smallest last so the 16px entry stays legible.
ICO_SIZES = [(48, 48), (32, 32), (16, 16)]

OG_SIZE = (1200, 630)


@dataclass(frozen=True)
class Badge:
    suffix: str
    glyph: str
    color: str


BADGES = [
    Badge(suffix="alpha", glyph="α", color="#752f93"),
    Badge(suffix="beta", glyph="β", color="#1c5392"),
]


def variant(name: str, suffix: str) -> str:
    """favicon-32x32.png -> favicon-32x32-alpha.png, matching iconSuffix."""
    stem, _, extension = name.rpartition(".")
    return f"{stem}-{suffix}.{extension}"


def apply_badge(mark: Image.Image, badge: Badge) -> Image.Image:
    """Overlay a filled disc in the bottom-right corner, glyph inside it.

    Geometry scales with the mark so one badge reads at 512px as a letter and at
    16px as a colored corner, which is all a browser tab needs it to be.
    """
    badged = mark.convert("RGBA").copy()
    size = badged.width
    diameter = round(size * 0.56)
    left = size - diameter
    top = size - diameter

    draw = ImageDraw.Draw(badged)
    # Punch the disc out of the mark first so the badge never blends with the
    # copper it sits on at small sizes.
    draw.ellipse(
        (left - 1, top - 1, size - 1, size - 1),
        fill=(0, 0, 0, 0),
    )
    draw.ellipse((left, top, size - 1, size - 1), fill=badge.color)

    font = ImageFont.truetype(str(FONT), round(diameter * 0.78))
    draw.text(
        (left + diameter / 2, top + diameter / 2),
        badge.glyph,
        font=font,
        fill="#ffffff",
        anchor="mm",
    )

    return badged


def write_badged_icons() -> None:
    light = Image.open(PUBLIC / "icon-512x512.png")
    dark = Image.open(PUBLIC / "favicon-32x32-dark.png")

    for badge in BADGES:
        badged_light = apply_badge(light, badge)

        badged_light.resize((32, 32), Image.LANCZOS).save(
            PUBLIC / variant("favicon-32x32.png", badge.suffix)
        )
        badged_light.save(
            PUBLIC / variant("favicon.ico", badge.suffix),
            sizes=ICO_SIZES,
        )
        # The dark mark exists only at its display size, so it is badged there.
        apply_badge(dark, badge).save(
            PUBLIC / variant("favicon-32x32-dark.png", badge.suffix)
        )


def fit_font(draw: ImageDraw.ImageDraw, text: str, size: int, max_width: int) -> ImageFont.FreeTypeFont:
    """Shrink until the line fits, so renaming the app cannot overflow the canvas."""
    while size > 8:
        font = ImageFont.truetype(str(FONT), size)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(FONT), size)


def write_og_image() -> None:
    """A link preview is read at thumbnail size, so it carries mark and name only."""
    canvas = Image.new("RGB", OG_SIZE, BRAND_TEAL)
    mark = Image.open(PUBLIC / "icon-512x512.png").convert("RGBA")

    side = 240
    mark = mark.resize((side, side), Image.LANCZOS)
    canvas.paste(mark, ((OG_SIZE[0] - side) // 2, 108), mark)

    draw = ImageDraw.Draw(canvas)
    centre = OG_SIZE[0] / 2
    max_width = OG_SIZE[0] - 200

    title = "Genshin Planner"
    draw.text(
        (centre, 428),
        title,
        font=fit_font(draw, title, 88, max_width),
        fill="#ffffff",
        anchor="mm",
    )

    tagline = "Plan your teams and manage your collection."
    draw.text(
        (centre, 518),
        tagline,
        font=fit_font(draw, tagline, 36, max_width),
        fill="#a8d5d1",
        anchor="mm",
    )

    canvas.save(PUBLIC / "og-image.png")


if __name__ == "__main__":
    if not FONT.exists():
        raise SystemExit(f"{FONT} is missing; install the DejaVu fonts and retry")

    write_badged_icons()
    write_og_image()
