#!/usr/bin/env python3
"""
Turn raw screenshots into web-ready .webp files.

    pip install pillow
    python scripts/optimise-images.py <file-or-folder> [...]

    # typical use: drop new screenshots anywhere, then
    python scripts/optimise-images.py ~/Desktop/cureneed-admin.png

Writes the .webp into app/public/images/ and keeps the original in
assets-original/ (gitignored, never deployed).

WHY THIS EXISTS
---------------
A screenshot straight from a Mac or Windows capture is a 2-4 MB PNG. Four
projects with four screenshots each is 30-60 MB, and everything in
app/public/ is copied verbatim into the deploy.

This repo has already made that mistake once: app/public/images held 29 MB of
PNG and JPG originals that nothing on the site referenced, shipping on every
deploy. The whole build is 2.1 MB today. One careless drag-and-drop puts it
back to 30.

WHAT IT DOES
------------
- Resizes to 1536px wide, which is what the existing screenshots are and what
  the 3:2 frame renders at on a 2x display. Anything larger is invisible.
- Crops to 3:2 from the top. Every screenshot in a project's gallery MUST
  share a ratio or the frame resizes as you click between them, and the top
  is the part of a page worth keeping.
- Encodes webp at quality 82, which is the point where these screenshots stop
  improving visibly.
- Refuses to overwrite an existing file unless --force, so re-running cannot
  silently destroy a hand-tuned image.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "public" / "images"
KEEP = ROOT / "assets-original"

TARGET_WIDTH = 1536
ASPECT = 3 / 2
QUALITY = 82
SOURCES = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def slugify(name: str) -> str:
    out = []
    for ch in name.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in " _-.":
            out.append("-")
    slug = "".join(out).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "image"


def convert(src: Path, force: bool) -> tuple[Path | None, str]:
    dst = OUT / (slugify(src.stem) + ".webp")
    if dst.exists() and not force:
        return None, f"exists, skipped (use --force to replace): {dst.name}"

    im = Image.open(src)
    im = im.convert("RGB")
    before = src.stat().st_size

    # Crop to 3:2 from the top, then resize.
    w, h = im.size
    want_h = round(w / ASPECT)
    if want_h <= h:
        im = im.crop((0, 0, w, want_h))
    else:
        want_w = round(h * ASPECT)
        left = (w - want_w) // 2
        im = im.crop((left, 0, left + want_w, h))

    if im.width > TARGET_WIDTH:
        im = im.resize((TARGET_WIDTH, round(TARGET_WIDTH / ASPECT)), Image.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    im.save(dst, "WEBP", quality=QUALITY, method=6)
    after = dst.stat().st_size

    # Keep the original outside public/ so it is never deployed but can be
    # re-exported later at a different size.
    KEEP.mkdir(parents=True, exist_ok=True)
    kept = KEEP / src.name
    if not kept.exists() and src.resolve() != kept.resolve():
        shutil.copyfile(src, kept)

    pct = 100 - (after / before * 100) if before else 0
    return dst, f"{before/1024/1024:5.2f} MB -> {after/1024:6.1f} KB  ({pct:.1f}% smaller)  {dst.name}"


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--force"]
    force = "--force" in sys.argv
    if not args:
        sys.exit(__doc__.strip().split("\n\n")[1])

    files: list[Path] = []
    for a in args:
        p = Path(a).expanduser()
        if p.is_dir():
            files += [f for f in sorted(p.iterdir()) if f.suffix.lower() in SOURCES]
        elif p.is_file() and p.suffix.lower() in SOURCES:
            files.append(p)
        else:
            print(f"  skipped (not an image): {a}")

    if not files:
        sys.exit("  nothing to do")

    done = []
    for f in files:
        dst, msg = convert(f, force)
        print("  " + msg)
        if dst:
            done.append(dst)

    if done:
        print("\n  Add to app/src/data/projects.js:\n")
        for d in done:
            print(f"      {{ src: '/images/{d.name}', caption: '' }},")
        print("\n  Fill in each caption — two or three words describing the screen.")
        print("  It becomes the screen-reader label and the image's alt text.\n")

    total = sum(f.stat().st_size for f in OUT.glob("*") if f.is_file())
    print(f"  app/public/images is now {total/1024/1024:.2f} MB")
    if total > 3 * 1024 * 1024:
        print("  WARNING: over 3 MB. The whole deploy was 2.1 MB before images grew.")


if __name__ == "__main__":
    main()
