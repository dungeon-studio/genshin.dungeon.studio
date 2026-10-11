# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow==11.3.0"]
# ///

"""Derive the committed brand assets from the two source marks in public/.

Run with `uv run`, then commit what it writes. See public/icon-source.md.

Python rather than the workspace's own toolchain because the favicon is a
multi-resolution .ico, which Pillow writes directly and the Node imaging
libraries do not.

The brand-assets pre-commit hook reruns this and fails on any asset it rewrites,
so its output must stay byte-reproducible: Pillow is pinned to the version the
hook installs.
"""

from __future__ import annotations

import io
import json
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[3]
WEB = REPO / "apps" / "web"
PUBLIC = WEB / "public"
ENVIRONMENTS = WEB / "src" / "lib" / "environments.json"

FONT = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

BRAND_TEAL = "#1f514e"

# Icon sizes inside favicon.ico, smallest last so the 16px entry stays legible.
ICO_SIZES = [(48, 48), (32, 32), (16, 16)]

OG_SIZE = (1200, 630)
OG_MARGIN = 100
OG_MARK_SIDE = 240
OG_MARK_TOP = 108

FAVICON_SIZE = (32, 32)


@dataclass(frozen=True)
class Badge:
    suffix: str
    glyph: str
    color: str


def load_badges() -> list[Badge]:
    """One badge per environment that announces itself; production has none."""
    environments = json.loads(ENVIRONMENTS.read_text(encoding="utf-8"))
    return [
        Badge(
            suffix=environment["badge"]["iconSuffix"],
            glyph=environment["badge"]["glyph"],
            color=environment["themeColor"],
        )
        for environment in environments.values()
        if environment["badge"] is not None
    ]


def encode(name: str, image: Image.Image, **params: object) -> tuple[str, bytes]:
    """Encode in the format the name's extension implies."""
    buffer = io.BytesIO()
    image.save(buffer, format=Image.registered_extensions()[Path(name).suffix], **params)
    return name, buffer.getvalue()


def committed(name: str) -> bytes | None:
    path = PUBLIC / name
    return path.read_bytes() if path.exists() else None


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

    disc = (left, top, size - 1, size - 1)
    halo = (left - 1, top - 1, size - 1, size - 1)

    draw = ImageDraw.Draw(badged)
    # Clear a halo behind the disc first, so the badge never blends with the
    # copper it sits on at small sizes.
    draw.ellipse(halo, fill=(0, 0, 0, 0))
    draw.ellipse(disc, fill=badge.color)

    font = ImageFont.truetype(str(FONT), round(diameter * 0.78))
    draw.text(
        (left + diameter / 2, top + diameter / 2),
        badge.glyph,
        font=font,
        fill="#ffffff",
        anchor="mm",
    )

    return badged


def badged_icons() -> Iterator[tuple[str, bytes]]:
    light = Image.open(PUBLIC / "icon-512x512.png")
    dark = Image.open(PUBLIC / "favicon-32x32-dark.png")

    for badge in load_badges():
        badged_light = apply_badge(light, badge)

        yield encode(
            variant("favicon-32x32.png", badge.suffix),
            badged_light.resize(FAVICON_SIZE, Image.LANCZOS),
        )
        yield encode(
            variant("favicon.ico", badge.suffix),
            badged_light,
            sizes=ICO_SIZES,
        )
        # The dark mark exists only at its display size, so it is badged there.
        yield encode(
            variant("favicon-32x32-dark.png", badge.suffix),
            apply_badge(dark, badge),
        )


def fit_font(draw: ImageDraw.ImageDraw, text: str, size: int, max_width: int) -> ImageFont.FreeTypeFont:
    """Shrink until the line fits, so renaming the app cannot overflow the canvas."""
    while size > 8:
        font = ImageFont.truetype(str(FONT), size)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(FONT), size)


def draw_centered_line(
    draw: ImageDraw.ImageDraw, text: str, baseline: int, size: int, fill: str
) -> None:
    """Centered and width-fitted, so no line of the preview can overflow it."""
    width = OG_SIZE[0]
    draw.text(
        (width / 2, baseline),
        text,
        font=fit_font(draw, text, size, width - 2 * OG_MARGIN),
        fill=fill,
        anchor="mm",
    )


def og_image() -> tuple[str, bytes]:
    """A link preview is read at thumbnail size, so it carries mark and name only."""
    canvas = Image.new("RGB", OG_SIZE, BRAND_TEAL)

    mark = Image.open(PUBLIC / "icon-512x512.png").convert("RGBA")
    mark = mark.resize((OG_MARK_SIDE, OG_MARK_SIDE), Image.LANCZOS)
    canvas.paste(mark, ((OG_SIZE[0] - OG_MARK_SIDE) // 2, OG_MARK_TOP), mark)

    draw = ImageDraw.Draw(canvas)
    draw_centered_line(draw, "Genshin Planner", 428, 88, "#ffffff")
    draw_centered_line(draw, "Plan your teams and manage your collection.", 518, 36, "#a8d5d1")

    return encode("og-image.png", canvas)


def main() -> None:
    """Rewrite only the assets whose bytes changed and name each one.

    The pre-commit hook fails on any rewrite, so this listing is the message a
    contributor sees when an asset has gone stale.
    """
    if not FONT.exists():
        raise SystemExit(f"{FONT} is missing; install the DejaVu fonts and retry")

    assets = dict([*badged_icons(), og_image()])
    stale = {name: data for name, data in assets.items() if committed(name) != data}

    for name, data in stale.items():
        path = PUBLIC / name
        path.write_bytes(data)
        print(f"{path.relative_to(REPO)} was stale and has been regenerated")

    if stale:
        print(
            "Commit the regenerated assets. To rebuild them locally, run "
            "`uv run apps/web/scripts/generate-brand-assets.py`."
        )


if __name__ == "__main__":
    main()
