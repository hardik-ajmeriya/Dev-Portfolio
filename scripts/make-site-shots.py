#!/usr/bin/env python3
"""
Turn raw screenshots of hardikajmeriya.com into Upwork-ready portfolio images.

    1. Capture into  captures/   (see CAPTURE LIST below)
    2. python scripts/make-site-shots.py
    3. Upload from  site-shots/

Naming drives the caption. Sort order drives upload order:

    captures/01-homepage-hero.png      -> "Homepage hero"
    captures/02-selected-work.png      -> "Selected work"
    captures/03-services.png           -> "Services"
    captures/04-contact-form.png       -> "Contact form"
    captures/05-mobile.png             -> "Mobile"          (portrait -> phone frame)
    captures/06-admin-dashboard.png    -> "Admin dashboard"

CAPTURE LIST — what to actually screenshot
------------------------------------------
Six images, in this order. The order matters more than people expect: a client
scans the first two or three and decides.

  1. Homepage hero            the one that has to work as the cover
  2. Selected work            shows range without a word of copy
  3. Services                 what you actually sell
  4. Contact form             proves this is an application, not a brochure
  5. Mobile                   most portfolios skip it, so it reads as care
  6. Admin dashboard          the one that separates you from "makes nice sites"

  On 6: seed it first — `npm run seed:local` — and capture the local one.
  Never photograph real enquiries. Those are other people's contact details.

HOW TO CAPTURE (Chrome)
-----------------------
  Desktop:  F12 -> device toolbar (Ctrl+Shift+M) -> "Responsive", set 1440 x 900
            -> Ctrl+Shift+P -> type "capture screenshot" -> Enter
  Mobile:   same, pick iPhone 14 Pro -> same capture command
  DO NOT use "Capture full size screenshot". This site is ~20,000px tall, so
  at 2x device pixel ratio that returns a 2880x40000 file — and Upwork rejects
  anything over 4000x4000. One screenful reads in a portfolio grid; a whole
  page shrinks to an unreadable ribbon anyway.

  If you do capture one, this script no longer breaks on it: it detects the
  strip, crops to the top screenful and says so. The output is always 1200x900,
  which is comfortably inside every platform's cap.

  Set the browser zoom to 100% first. At 110% the text renders soft and it is
  visible once the image is scaled.

WHY THE OUTPUT LOOKS LIKE THIS
------------------------------
Same system as scripts/make-thumbnails.py: 1200x900 (4:3, Upwork's guidance),
PNG not WebP (their guidance is explicit that WebP renders inconsistently in
portfolios), one screen large in a plain frame, caption set big enough to
survive being shrunk to a grid tile.
"""

from __future__ import annotations

import re
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow required:  pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
IN = ROOT / "captures"
OUT = ROOT / "site-shots"
FONT_SRC = ROOT / "app" / "node_modules" / "@fontsource"
MARK = ROOT / "app" / "public" / "android-chrome-512x512.png"

W, H = 1200, 900
PAD = 44
PAPER = (244, 244, 241)
INK = (11, 11, 13)
MUTED = (92, 92, 100)
LIVE = (0, 122, 92)

SITE = "hardikajmeriya.com"


def fonts(work: Path):
    want = {
        "b8": "bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2",
        "i4": "inter/files/inter-latin-400-normal.woff2",
        "m4": "jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
    }
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        return None
    if not FONT_SRC.exists():
        return None
    out = {}
    for k, rel in want.items():
        src = FONT_SRC / rel
        if not src.exists():
            return None
        dst = work / f"{k}.ttf"
        f = TTFont(src)
        f.flavor = None
        f.save(dst)
        out[k] = dst
    return out


def caption_from(path: Path) -> str:
    """01-homepage-hero.png -> 'Homepage hero'"""
    stem = re.sub(r"^\d+[-_\s]*", "", path.stem)
    return stem.replace("-", " ").replace("_", " ").strip().capitalize() or path.stem


def rounded(img: Image.Image, r: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], r, fill=255)
    out = Image.new("RGBA", img.size)
    out.paste(img, (0, 0), mask)
    return out


def chrome_bar(w: int, h: int, url: str, F) -> Image.Image:
    bar = Image.new("RGB", (w, h), (251, 251, 250))
    d = ImageDraw.Draw(bar)
    d.line([0, h - 1, w, h - 1], fill=(233, 233, 229))
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse([20 + i * 19, h // 2 - 5, 30 + i * 19, h // 2 + 5], fill=c)
    # The real domain, printed. Unlike the client demos, this one resolves —
    # so showing it is proof rather than decoration.
    pill_w = int(d.textlength(url, font=F["m4"])) + 30
    x = (w - pill_w) // 2
    d.rounded_rectangle([x, h // 2 - 12, x + pill_w, h // 2 + 12], 7, fill=(240, 240, 237))
    d.text((x + 15, h // 2 - 8), url, font=F["m4"], fill=(110, 110, 119))
    return bar


def build(src: Path, F) -> Image.Image:
    card = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(card)
    im = Image.open(src).convert("RGB")

    # Phone or long page?
    #
    # The first version asked `height > width`, which is true of a phone
    # capture AND of a full-page desktop capture. This site is ~20,000px tall,
    # so a "Capture full size screenshot" comes back at 2880x40000 — and the
    # phone branch scaled it to fit the frame HEIGHT, rendering it 48px wide.
    # A sliver, not an image.
    #
    # Phone screens land around 0.46 (393x852). Anything outside this band is
    # either a normal screenshot or a full-page strip; both are handled by
    # scaling to width and cropping from the top.
    ratio = im.width / im.height
    portrait = 0.35 <= ratio <= 0.70

    bar_h = 150
    area_w = W - PAD * 2
    area_h = H - PAD * 2 - bar_h

    if portrait:
        # A phone capture is ~0.46 ratio; stretching it to fill a 4:3 frame
        # would distort it, so it sits at its own size, centred, on paper.
        scale = area_h / im.height
        pw, ph = round(im.width * scale), area_h
        phone = rounded(im.resize((pw, ph), Image.LANCZOS), 26)
        card.paste(phone, (PAD + (area_w - pw) // 2, PAD), phone)
        d.rounded_rectangle([PAD + (area_w - pw) // 2, PAD,
                             PAD + (area_w - pw) // 2 + pw - 1, PAD + ph - 1],
                            26, outline=(214, 214, 209), width=1)
    else:
        ch = 38
        shot_h = area_h - ch
        scale = area_w / im.width
        scaled = im.resize((area_w, round(im.height * scale)), Image.LANCZOS)
        shot = scaled.crop((0, 0, area_w, min(shot_h, scaled.height)))

        frame = Image.new("RGB", (area_w, ch + shot.height), (255, 255, 255))
        frame.paste(chrome_bar(area_w, ch, SITE, F), (0, 0))
        frame.paste(shot, (0, ch))
        card.paste(rounded(frame, 14), (PAD, PAD), rounded(frame, 14))
        d.rounded_rectangle([PAD, PAD, PAD + area_w - 1, PAD + ch + shot.height - 1],
                            14, outline=(222, 222, 217), width=1)

    # ---- caption bar ---------------------------------------------------
    y = H - bar_h + 34
    pill = "LIVE  ·  hardikajmeriya.com"
    tw = d.textlength(pill, font=F["m4"])
    d.rounded_rectangle([PAD, y - 34, PAD + tw + 34, y - 8], 13,
                        fill=(232, 243, 239), outline=(200, 226, 216))
    d.ellipse([PAD + 12, y - 25, PAD + 20, y - 17], fill=LIVE)
    d.text((PAD + 28, y - 28), pill, font=F["m4"], fill=(0, 92, 70))

    d.text((PAD, y + 6), caption_from(src), font=F["b8"], fill=INK)
    d.text((PAD, y + 62), "React · Cloudflare Workers · D1 · Prerendered",
           font=F["i4"], fill=MUTED)

    if MARK.exists():
        m = Image.open(MARK).convert("RGB").resize((54, 54), Image.LANCZOS)
        card.paste(rounded(m, 27), (W - PAD - 54, H - PAD - 54), rounded(m, 27))

    return card


def main() -> None:
    if not IN.exists():
        IN.mkdir()
        sys.exit(
            f"\n  Created {IN.relative_to(ROOT)}/ — it is empty.\n"
            "  Put your screenshots in it, named 01-..., 02-... etc,\n"
            "  then run this again. See the CAPTURE LIST at the top of this file.\n"
        )

    shots = sorted(p for p in IN.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    if not shots:
        sys.exit(f"  {IN.relative_to(ROOT)}/ is empty — nothing to build")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        ttf = fonts(work)
        if not ttf:
            sys.exit("  brand fonts unavailable — run `npm install` inside app/ first")
        F = {
            "b8": ImageFont.truetype(str(ttf["b8"]), 44),
            "i4": ImageFont.truetype(str(ttf["i4"]), 24),
            "m4": ImageFont.truetype(str(ttf["m4"]), 14),
        }

        OUT.mkdir(exist_ok=True)
        for s in shots:
            src_im = Image.open(s)
            sw, sh = src_im.size
            r = sw / sh
            kind = "phone" if 0.35 <= r <= 0.70 else ("long page" if sh > sw * 1.6 else "desktop")

            # Upwork rejects anything over 4000x4000. The output is always
            # 1200x900 so it can never trip that, but a 40,000px input is a
            # sign the capture was "full size" rather than one screenful, and
            # only the top of it will survive the crop.
            note = ""
            if max(sw, sh) > 4000:
                note = f"   (input {sw}x{sh} — full-page capture, cropping to the top screenful)"

            dst = OUT / f"{s.stem}.png"
            build(s, F).save(dst, optimize=True)
            print(f"  {kind:10} {caption_from(s):24} -> {dst.name}{note}")

            out_im = Image.open(dst)
            if max(out_im.size) > 4000:
                print(f"    WARNING: output is {out_im.size[0]}x{out_im.size[1]}, over the 4000px platform cap")

    print(f"\n  {OUT.relative_to(ROOT)}/ — 1200x900 PNG, upload in filename order")


if __name__ == "__main__":
    main()
