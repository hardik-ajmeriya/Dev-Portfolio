#!/usr/bin/env python3
"""
Build Upwork / marketplace portfolio thumbnails from the project screenshots.

    pip install pillow fonttools brotli
    python scripts/make-thumbnails.py            # all projects
    python scripts/make-thumbnails.py aurora-fitness neuralis-ai

Output: thumbnails/<id>-a.png and <id>-b.png, 1200x900 (4:3).

WHY THESE CHOICES
-----------------
Everything here follows one constraint that overrides taste: **a thumbnail is
first seen small.** Upwork shows portfolio items in a grid, and since 2026 any
item can be the first thing a client sees. If it does not read at ~300px wide
it does not work, however good it looks at full size.

That rules out the three things most freelancers do:

  - Raw screenshot with no frame. The site's own headline is set for a 1440px
    viewport; shrunk to a grid tile it is an unreadable grey smear, and the
    tile reads as "a website" rather than "this website".
  - A collage of four screens. Four unreadable things instead of one.
  - A stock laptop-on-a-desk PSD. Signals "I downloaded a mockup", and the
    screen ends up occupying a third of the frame.

So: one screen, large, in a plain frame, with a caption bar that is legible
at any size because it is set in a single large weight.

4:3 rather than the source 3:2 — Upwork's own guidance — so the caption bar
has room without shrinking the screenshot.

PNG rather than WebP because Upwork's guidance is explicit that WebP does not
render consistently in portfolios. The site keeps WebP; these exports do not.

THE PART THAT IS ACTUALLY DIFFERENTIATING
-----------------------------------------
Not the frame. It is that all nine tiles share ONE system — same frame, same
bar, same type, same palette — while the screenshots inside them are wildly
different. A client scanning the grid reads that as a studio with range, not
as a person who happened to build nine unrelated things.

The LIVE marker says "you can click this", which is the one claim most
portfolios on the platform cannot make. It is a dot and a word, not a domain:
printing `aurora.fit` would be printing a domain that does not resolve.
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
IMAGES = ROOT / "app" / "public" / "images"
PROJECTS = ROOT / "app" / "src" / "data" / "projects.js"
OUT = ROOT / "thumbnails"
FONT_SRC = ROOT / "app" / "node_modules" / "@fontsource"

W, H = 1200, 900
PAD = 44
PAPER = (244, 244, 241)
INK = (11, 11, 13)
MUTED = (92, 92, 100)
LINE = (226, 226, 221)
ACCENT = (61, 46, 245)
LIVE = (0, 122, 92)


def fonts(work: Path):
    """Convert the site's woff2 to ttf so the thumbnails use the real brand type."""
    want = {
        "b8": "bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2",
        "b6": "bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff2",
        "i4": "inter/files/inter-latin-400-normal.woff2",
        "i5": "inter/files/inter-latin-500-normal.woff2",
        "m4": "jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
    }
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        return None
    if not FONT_SRC.exists():
        return None
    out = {}
    for key, rel in want.items():
        src = FONT_SRC / rel
        if not src.exists():
            return None
        dst = work / f"{key}.ttf"
        f = TTFont(src)
        f.flavor = None
        f.save(dst)
        out[key] = dst
    return out


def parse_projects() -> list[dict]:
    """Read id, title and liveUrl straight from projects.js.

    Deliberately not a JS parser — a few regexes over a file whose shape this
    repo controls. If the shape changes the script prints nothing rather than
    inventing entries.
    """
    src = PROJECTS.read_text(encoding="utf-8")
    body = src.split("export const projects", 1)[-1]
    out = []
    for block in re.split(r"\n  \{\n", body)[1:]:
        pid = re.search(r"id:\s*'([^']+)'", block)
        title = re.search(r"title:\s*\n?\s*'([^']+)'", block) or re.search(r'title:\s*"([^"]+)"', block)
        img = re.search(r"src:\s*'/images/([^']+)'", block)
        live = re.search(r"liveUrl:\s*'([^']*)'", block)
        pres = re.search(r"presentation:\s*true", block)
        if pid and img:
            out.append({
                "id": pid.group(1),
                "title": title.group(1) if title else pid.group(1),
                "image": img.group(1),
                "live": bool(live and live.group(1)),
                # Some screenshots are finished presentation mockups that already
                # carry their own browser chrome. Adding mine nested a browser
                # inside a browser, which looked like a mistake because it was one.
                "presentation": bool(pres),
            })
    return out


def split_title(title: str) -> tuple[str, str]:
    """'Aurora — Strength & Movement Studio' -> ('Aurora', 'Strength & Movement Studio')"""
    for sep in (" — ", " – ", " - "):
        if sep in title:
            a, b = title.split(sep, 1)
            return a.strip(), b.strip()
    return title.strip(), ""


def rounded(img: Image.Image, r: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], r, fill=255)
    out = Image.new("RGBA", img.size)
    out.paste(img, (0, 0), mask)
    return out


def fit_top(path: Path, w: int, h: int) -> Image.Image:
    """Scale to width, crop from the TOP.

    The hero is the part worth keeping; cropping centred would cut the
    headline in half, which is the one thing on these screenshots that has to
    survive.
    """
    im = Image.open(path).convert("RGB")
    scale = w / im.width
    im = im.resize((w, round(im.height * scale)), Image.LANCZOS)
    return im.crop((0, 0, w, min(h, im.height)))


def build(project: dict, F, variant: str) -> Image.Image:
    card = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(card)

    name, sub = split_title(project["title"])
    shot_w = W - PAD * 2
    chrome_h = 0 if project.get("presentation") else 38
    bar_h = 176 if variant == "a" else 146
    shot_h = H - PAD * 2 - bar_h - chrome_h

    # ---- browser frame -------------------------------------------------
    frame = Image.new("RGB", (shot_w, chrome_h + shot_h), (255, 255, 255))
    if chrome_h:
        fd = ImageDraw.Draw(frame)
        fd.rectangle([0, 0, shot_w, chrome_h], fill=(251, 251, 250))
        fd.line([0, chrome_h, shot_w, chrome_h], fill=(233, 233, 229))
        for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
            fd.ellipse([20 + i * 19, chrome_h // 2 - 5, 30 + i * 19, chrome_h // 2 + 5], fill=c)

    frame.paste(fit_top(IMAGES / project["image"], shot_w, shot_h), (0, chrome_h))
    card.paste(rounded(frame, 14), (PAD, PAD), rounded(frame, 14))

    # hairline around the frame so a white-topped screenshot does not bleed
    d.rounded_rectangle([PAD, PAD, PAD + shot_w - 1, PAD + chrome_h + shot_h - 1],
                        14, outline=(222, 222, 217), width=1)

    # ---- caption bar ---------------------------------------------------
    y = PAD + chrome_h + shot_h + (58 if variant == "a" else 50)

    if variant == "a":
        d.text((PAD, y), name, font=F["name"], fill=INK)
        if sub:
            d.text((PAD, y + 54), sub, font=F["sub"], fill=MUTED)
    else:
        label = name if not sub else f"{name} — {sub}"
        d.text((PAD, y), label, font=F["nameB"], fill=INK)

    # LIVE, in the caption bar rather than inside the browser chrome.
    # In the chrome it was a green speck that vanished at grid size; here it
    # sits on the baseline the eye is already reading, and it is the one claim
    # most portfolios on the platform cannot make.
    if project["live"]:
        tw = d.textlength("LIVE  ·  CLICKABLE", font=F["mono13"])
        px, py = PAD, y - 34
        d.rounded_rectangle([px, py, px + tw + 34, py + 26], 13,
                            fill=(232, 243, 239), outline=(200, 226, 216))
        d.ellipse([px + 12, py + 9, px + 20, py + 17], fill=LIVE)
        d.text((px + 28, py + 6), "LIVE  ·  CLICKABLE", font=F["mono13"], fill=(0, 92, 70))

    # brand mark, bottom right
    mark = IMAGES.parent / "android-chrome-512x512.png"
    if mark.exists():
        m = Image.open(mark).convert("RGB").resize((54, 54), Image.LANCZOS)
        card.paste(rounded(m, 27), (W - PAD - 54, H - PAD - 54), rounded(m, 27))

    return card


def main() -> None:
    wanted = set(sys.argv[1:])
    projects = parse_projects()
    if not projects:
        sys.exit("could not read any projects from projects.js")
    if wanted:
        projects = [p for p in projects if p["id"] in wanted]

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        ttf = fonts(work)
        if not ttf:
            sys.exit("brand fonts unavailable — run `npm install` inside app/ first")
        F = {
            "name": ImageFont.truetype(str(ttf["b8"]), 44),
            "nameB": ImageFont.truetype(str(ttf["b6"]), 34),
            "sub": ImageFont.truetype(str(ttf["i4"]), 25),
            "mono13": ImageFont.truetype(str(ttf["m4"]), 13),
        }

        OUT.mkdir(exist_ok=True)
        for p in projects:
            if not (IMAGES / p["image"]).exists():
                print(f"  skip {p['id']}: {p['image']} not found")
                continue
            for v in ("a", "b"):
                path = OUT / f"{p['id']}-{v}.png"
                build(p, F, v).save(path, optimize=True)
            print(f"  {p['id']:20} {'LIVE' if p['live'] else '    '}  -> {p['id']}-a.png, -b.png")

    print(f"\n  {OUT.relative_to(ROOT)}/ — PNG, 1200x900 (4:3), ready to upload")


if __name__ == "__main__":
    main()
