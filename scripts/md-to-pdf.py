#!/usr/bin/env python3
"""
Render a project markdown report as a branded PDF.

    pip install weasyprint markdown fonttools brotli
    python scripts/md-to-pdf.py SEO-AUDIT.md

Output goes next to the source, as <name>.pdf.

WHY WEASYPRINT AND NOT REPORTLAB
--------------------------------
These reports are markdown with a lot of tables and inline code. ReportLab
would mean hand-building every table and re-implementing markdown parsing;
WeasyPrint takes HTML + CSS, so the layout is a stylesheet and the content
stays in the .md file that is already the source of truth. Regenerating after
an edit is one command with no layout work.

FONTS
-----
Pulled from the project's own @fontsource packages and converted woff2 -> ttf,
so the PDF uses the same Bricolage Grotesque / Inter / JetBrains Mono as the
site rather than approximating with system faces. If node_modules is absent
the script falls back to system fonts and says so, rather than failing.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

try:
    import markdown
    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration
except ImportError:
    sys.exit("Missing deps:  pip install weasyprint markdown")

ROOT = Path(__file__).resolve().parent.parent
FONT_SRC = ROOT / "app" / "node_modules" / "@fontsource"

INK = "#0b0b0d"
PAPER = "#ffffff"
MUTED = "#5c5c64"
LINE = "#e2e2dd"
ACCENT = "#3d2ef5"
ACCENT2 = "#007a5c"


# ---------------------------------------------------------------- fonts
def prepare_fonts(workdir: Path) -> bool:
    """Convert the site's woff2 files to ttf so WeasyPrint can embed them."""
    wanted = {
        "Bricolage-800.ttf": "bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2",
        "Bricolage-600.ttf": "bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff2",
        "Inter-400.ttf": "inter/files/inter-latin-400-normal.woff2",
        "Inter-500.ttf": "inter/files/inter-latin-500-normal.woff2",
        "Inter-600.ttf": "inter/files/inter-latin-600-normal.woff2",
        "JetBrainsMono-400.ttf": "jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
    }
    if not FONT_SRC.exists():
        return False
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        return False

    out = workdir / "fonts"
    out.mkdir(exist_ok=True)
    for name, rel in wanted.items():
        src = FONT_SRC / rel
        if not src.exists():
            return False
        f = TTFont(src)
        f.flavor = None
        f.save(out / name)
    return True


def font_face_css(workdir: Path) -> str:
    d = (workdir / "fonts").as_uri()
    return f"""
@font-face {{ font-family:'Bricolage'; src:url('{d}/Bricolage-800.ttf'); font-weight:800; }}
@font-face {{ font-family:'Bricolage'; src:url('{d}/Bricolage-600.ttf'); font-weight:600; }}
@font-face {{ font-family:'InterP'; src:url('{d}/Inter-400.ttf'); font-weight:400; }}
@font-face {{ font-family:'InterP'; src:url('{d}/Inter-500.ttf'); font-weight:500; }}
@font-face {{ font-family:'InterP'; src:url('{d}/Inter-600.ttf'); font-weight:600; }}
@font-face {{ font-family:'MonoP'; src:url('{d}/JetBrainsMono-400.ttf'); font-weight:400; }}
"""


# ---------------------------------------------------------------- mark
def prepare_mark(workdir: Path) -> str | None:
    """The white-H-on-ink square, for the dark cover."""
    for candidate in [
        ROOT / "app" / "public" / "android-chrome-512x512.png",
        ROOT / "app" / "public" / "apple-touch-icon.png",
    ]:
        if candidate.exists():
            dst = workdir / "mark.png"
            shutil.copyfile(candidate, dst)
            return dst.as_uri()
    return None


# ---------------------------------------------------------------- content
def split_front_matter(md: str) -> tuple[str, str, str]:
    """Pull the H1 and the line beneath it out for the cover page."""
    lines = md.split("\n")
    title = ""
    subtitle = ""
    start = 0
    for i, ln in enumerate(lines):
        if ln.startswith("# ") and not title:
            title = ln[2:].strip()
            start = i + 1
            continue
        if title and ln.strip():
            subtitle = ln.strip()
            start = i + 1
            break
    return title, subtitle, "\n".join(lines[start:])


def build_html(md_text: str, title: str, subtitle: str, mark_uri: str | None, source_name: str) -> str:
    body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists", "toc", "attr_list"],
    )

    # Strip markdown emphasis that survived inside table cells as literal text.
    subtitle_html = markdown.markdown(subtitle).replace("<p>", "").replace("</p>", "")

    mark_img = f'<img class="mark" src="{mark_uri}" alt="">' if mark_uri else ""

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>{title}</title></head>
<body>
  <section class="cover">
    {mark_img}
    <div class="cover-body">
      <p class="eyebrow">Implementation audit</p>
      <h1 class="cover-title">{title}</h1>
      <p class="cover-sub">{subtitle_html}</p>
    </div>
    <div class="cover-foot">
      <span>Hardik Ajmeriya</span>
      <span>{date.today().strftime('%d %B %Y')}</span>
    </div>
  </section>
  <main>{body}</main>
</body></html>"""


STYLE = f"""
@page {{
  size: A4;
  margin: 20mm 18mm 18mm;
  @bottom-left {{
    content: "{{doc}}";
    font-family: 'MonoP', monospace; font-size: 7.5pt; color: {MUTED};
  }}
  @bottom-right {{
    content: counter(page) " / " counter(pages);
    font-family: 'MonoP', monospace; font-size: 7.5pt; color: {MUTED};
  }}
}}
/* The cover carries no running header or page number. */
@page :first {{ margin: 0; @bottom-left {{ content: ""; }} @bottom-right {{ content: ""; }} }}

* {{ box-sizing: border-box; }}
body {{ margin:0; font-family:'InterP', system-ui, sans-serif; font-size:9.6pt;
        line-height:1.62; color:{INK}; }}

/* ---------------- cover ---------------- */
.cover {{
  page-break-after: always; break-after: page;
  height: 297mm; padding: 30mm 24mm 22mm;
  background: {INK}; color: #f4f4f1;
  display: flex; flex-direction: column;
}}
.cover .mark {{ width: 46px; height: 46px; border-radius: 10px; }}
.cover-body {{ flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; }}
.eyebrow {{ font-family:'MonoP',monospace; font-size:8pt; letter-spacing:.22em;
            text-transform:uppercase; color:#8b8b95; margin:0 0 14mm; }}
.cover-title {{ font-family:'Bricolage',serif; font-weight:800; font-size:34pt;
                line-height:1.02; letter-spacing:-.03em; margin:0 0 8mm;
                color:#f4f4f1; border:0; padding:0; }}
.cover-sub {{ font-size:11pt; line-height:1.55; color:#a8a8b2; margin:0; max-width:120mm; }}
.cover-sub strong {{ color:#f4f4f1; font-weight:500; }}
.cover-foot {{ display:flex; justify-content:space-between;
               font-family:'MonoP',monospace; font-size:8pt; color:#8b8b95;
               border-top:1px solid #26262b; padding-top:5mm; }}

/* ---------------- headings ---------------- */
h1, h2, h3, h4 {{ font-family:'Bricolage',serif; letter-spacing:-.02em; }}
h1 {{ font-weight:800; font-size:19pt; line-height:1.15; margin:0 0 5mm;
      padding-bottom:3mm; border-bottom:2px solid {INK};
      break-before: page; break-after: avoid; }}
/* The first section heading must NOT start a new page: the short intro
   paragraphs sit above it, so forcing a break there left page 2 nine-tenths
   empty. :first-of-type matches the first h1 among its siblings regardless of
   what precedes it, which :first-child did not. */
main > h1:first-of-type {{ break-before: avoid; }}
h2 {{ font-weight:600; font-size:13pt; margin:9mm 0 3mm; break-after: avoid; }}
h3 {{ font-weight:600; font-size:10.6pt; margin:6mm 0 2mm; break-after: avoid; }}

p {{ margin:0 0 3.2mm; orphans:2; widows:2; }}
/* Column widths for two-column status tables, so a narrow first cell does not
   squeeze the explanation into a ribbon. */
table th:first-child {{ width: 22%; }}
strong {{ font-weight:600; }}
em {{ font-style: italic; color:{MUTED}; }}

/* ---------------- lists ---------------- */
ul, ol {{ margin:0 0 3.5mm; padding-left:5.5mm; }}
li {{ margin-bottom:1.4mm; }}

/* ---------------- tables ---------------- */
table {{ width:100%; border-collapse:collapse; margin:4mm 0 5mm;
         font-size:8.7pt; break-inside:auto; }}
thead {{ display: table-header-group; }}
tr {{ break-inside: avoid; }}
th {{ text-align:left; font-family:'MonoP',monospace; font-weight:400;
      font-size:7.4pt; letter-spacing:.09em; text-transform:uppercase;
      color:{MUTED}; border-bottom:1px solid {INK}; padding:2mm 3mm 1.6mm 0; }}
td {{ padding:2mm 3mm 2mm 0; border-bottom:1px solid {LINE}; vertical-align:top; }}
td:last-child, th:last-child {{ padding-right:0; }}

/* ---------------- code ---------------- */
code {{ font-family:'MonoP',monospace; font-size:8.4pt;
        background:#f2f2ef; padding:.6mm 1.2mm; border-radius:2px; color:{INK}; }}
pre {{ background:#f7f7f5; border:1px solid {LINE}; border-left:2px solid {ACCENT};
       border-radius:3px; padding:3mm 4mm; margin:3mm 0 4mm;
       font-size:8.2pt; line-height:1.5; white-space:pre-wrap;
       break-inside:avoid; }}
pre code {{ background:none; padding:0; font-size:inherit; }}

/* ---------------- rules and quotes ---------------- */
hr {{ border:0; border-top:1px solid {LINE}; margin:7mm 0; }}
blockquote {{ margin:3mm 0 4mm; padding:0 0 0 4mm;
              border-left:2px solid {ACCENT}; color:{MUTED}; }}
blockquote p {{ margin-bottom:1.5mm; }}

a {{ color:{ACCENT}; text-decoration:none; }}
"""


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "SEO-AUDIT.md")
    if not src.is_absolute():
        src = ROOT / src
    if not src.exists():
        sys.exit(f"not found: {src}")

    out = src.with_suffix(".pdf")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        have_fonts = prepare_fonts(work)
        if not have_fonts:
            print("  ! project fonts unavailable (run `npm install` in app/) — using system fonts")
        mark = prepare_mark(work)

        title, subtitle, rest = split_front_matter(src.read_text(encoding="utf-8"))
        html = build_html(rest, title, subtitle, mark, src.name)

        css_text = (font_face_css(work) if have_fonts else "") + STYLE.replace("{doc}", src.name)
        if not have_fonts:
            css_text = css_text.replace("'Bricolage',serif", "Georgia, serif")
            css_text = css_text.replace("'InterP', system-ui, sans-serif", "system-ui, sans-serif")
            css_text = css_text.replace("'MonoP',monospace", "monospace")

        font_config = FontConfiguration()
        HTML(string=html, base_url=str(work)).write_pdf(
            out, stylesheets=[CSS(string=css_text, font_config=font_config)],
            font_config=font_config,
        )

    size_kb = out.stat().st_size / 1024
    print(f"  {out.relative_to(ROOT)}  ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
