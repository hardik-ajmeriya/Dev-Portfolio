#!/usr/bin/env python3
"""
Generate the production favicon set from the brand master.

    pip install pillow
    python scripts/generate-icons.py

Source:  branding/favicon-v8-architect-h.png
Output:  app/public/  (and copies of the browser icons into coming-soon/public/)

Everything below is derived from the master image, so re-running this after a
rebrand is the whole update — there are no hand-edited icons to keep in sync.

--------------------------------------------------------------------------
WHY THE TWO ICON FAMILIES DIFFER
--------------------------------------------------------------------------
The mark is a white "H" inside a dark disc, and different platforms want that
delivered in opposite ways.

*Browser tab icons* (favicon.ico, favicon-16, favicon-32) keep the disc and
are transparent outside it. Chrome, Edge, Firefox and Safari all draw the tab
strip light in one theme and near-black in the other; an opaque square would
show as a pale sticker in dark mode.

*Platform icons* (apple-touch-icon, android-chrome-*) are opaque squares with
no disc at all — just the white H on brand ink. iOS ignores alpha entirely and
applies its own rounded-rectangle mask; Android masks manifest icons to a
circle or squircle. Handing either one a disc means a circle masked inside a
circle, with an ugly sliver of background between the two. Giving them a
square lets the platform cut the brand's circle for us.

The master artwork also has a white surround and pure-black (#000) disc, while
the brand ink is #0b0b0d. Pasting the disc onto an ink square left a visible
seam where the two blacks met, so the H is extracted and composited on its own.
"""

from __future__ import annotations

import os
import shutil
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required:  pip install pillow")

try:
    import numpy as np
except ImportError:  # pragma: no cover
    sys.exit("numpy is required:  pip install numpy")


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "branding", "favicon-v8-architect-h.png")
OUT = os.path.join(ROOT, "app", "public")
COMING_SOON = os.path.join(ROOT, "coming-soon", "public")

INK = (11, 11, 13)  # tailwind.config.js -> colors.ink
SS = 8              # supersample factor for the anti-aliased circle edge


def load_mark() -> Image.Image:
    """Crop the master down to the disc, so the disc fills the frame.

    The bounds are measured rather than assumed: the disc is 1059px inside a
    1254px canvas, and hardcoding that would break the moment the artwork is
    re-exported at a different size or padding.
    """
    if not os.path.exists(SRC):
        sys.exit(f"brand master not found: {SRC}")
    src = Image.open(SRC).convert("L")
    dark = np.asarray(src).astype(np.int16) < 200
    ys, xs = np.where(dark)
    if not len(xs):
        sys.exit("no dark pixels found — is the master inverted?")
    return src.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def circle_alpha(size: int) -> Image.Image:
    big = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(big).ellipse([0, 0, size * SS - 1, size * SS - 1], fill=255)
    return big.resize((size, size), Image.LANCZOS)


def transparent_disc(mark: Image.Image, size: int) -> Image.Image:
    """Ink disc + white H, transparent outside. For browser tab strips."""
    g = np.asarray(mark.resize((size, size), Image.LANCZOS)).astype(np.float32) / 255.0
    rgb = np.zeros((size, size, 3), np.float32)
    for c in range(3):
        rgb[:, :, c] = INK[c] + (255 - INK[c]) * g  # lerp ink -> white
    img = Image.fromarray(rgb.astype(np.uint8), "RGB").convert("RGBA")
    img.putalpha(circle_alpha(size))
    return img


def opaque_square(mark: Image.Image, size: int, mark_ratio: float) -> Image.Image:
    """Ink square with only the white H on it. For iOS and Android."""
    inner = max(1, int(round(size * mark_ratio)))
    alpha = np.asarray(mark.resize((inner, inner), Image.LANCZOS)).astype(np.float32)

    # Clip to just inside the disc: the master's white surround is also 255
    # and would otherwise leak in as a bright ring around the letter.
    yy, xx = np.mgrid[0:inner, 0:inner]
    r = (inner - 1) / 2.0
    alpha[((xx - r) ** 2 + (yy - r) ** 2) > (r * 0.985) ** 2] = 0.0

    canvas = Image.new("RGB", (size, size), INK)
    canvas.paste(
        Image.new("RGB", (inner, inner), (255, 255, 255)),
        ((size - inner) // 2, (size - inner) // 2),
        Image.fromarray(alpha.astype(np.uint8), "L"),
    )
    return canvas


def main() -> None:
    mark = load_mark()
    print(f"master disc: {mark.size[0]}px")
    written: list[str] = []

    def save(img: Image.Image, name: str, **kw) -> None:
        path = os.path.join(OUT, name)
        img.save(path, optimize=True, **kw)
        written.append(path)

    # Browser tabs.
    for size in (16, 32):
        save(transparent_disc(mark, size), f"favicon-{size}x{size}.png")

    # 16/32/48 are the sizes Windows and Firefox actually select between.
    save(transparent_disc(mark, 256), "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    # iOS home screen. 0.66 leaves enough margin for the corner rounding.
    save(opaque_square(mark, 180, 0.66), "apple-touch-icon.png")

    # Android manifest icons.
    for size in (192, 512):
        save(opaque_square(mark, size, 0.68), f"android-chrome-{size}x{size}.png")

    # Maskable: Android crops to the central 80%, so the mark must sit well
    # inside that. 0.52 keeps the whole H in the safe zone under every mask
    # shape, including the aggressive circle crop.
    save(opaque_square(mark, 512, 0.52), "maskable-icon-512x512.png")

    # The coming-soon site is a separate Worker with its own public/ directory,
    # so it needs its own copies rather than a shared path.
    for name in ("favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"):
        dst = os.path.join(COMING_SOON, name)
        if os.path.isdir(COMING_SOON):
            shutil.copyfile(os.path.join(OUT, name), dst)
            written.append(dst)

    for path in written:
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        print(f"  {os.path.getsize(path) / 1024:7.1f} KB  {rel}")
    print(f"\n{len(written)} files written.")


if __name__ == "__main__":
    main()
