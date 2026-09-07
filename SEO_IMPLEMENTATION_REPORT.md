# SEO implementation report

**Date:** 7 September 2026 · **Scope:** everything implementable in code
**Tests:** 119 passing · **eslint:** clean · **Build:** verified

---

## First, about the screenshot

The image you shared is a **mockup, not a live result.** Tells: the site is not
indexed yet, the meta description shown is not the one in your code, and it
credits your GitHub with 200+ followers where the real profile has 3. That is
fine — it is a clear statement of the goal, and I have used it as the target.

But two things in it **cannot be produced by code**, and no amount of markup
will change that. Saying so now so the rest of this report is read correctly:

**The knowledge panel.** Panels come from Google's Knowledge Graph, which is
built from corroborating sources Google trusts — Wikipedia/Wikidata, major
press, established databases. Schema.org markup makes an entity *legible*; it
does not make it *notable*. There is no `<script>` that produces a panel. What
markup does is make sure that when corroboration eventually exists, Google
already knows which entity to attach it to. That part is now done.

**The five sitelinks.** Google builds a sitelink block from **indexed URLs**.
Your site had exactly one. `#work` and `#about` are fragments, not URLs — they
cannot become sitelinks. This is the single most actionable finding in the
whole exercise and it is architectural, not a markup gap. See §Sitelinks below.

---

## What changed

### 1. The CV was invisible — now it is a real URL

**Found:** `app/public/DevOps_V1.2.pdf` shipped on every deploy and was linked
from **nowhere**. No `href` anywhere in the source, absent from the sitemap,
absent from `llms.txt`. An asset nothing points at is not crawlable. The
filename also said nothing about whose CV it is, which matters because it is
the file a recruiter saves to their desktop.

**Changed:**

- Renamed to `hardik-ajmeriya-resume.pdf`.
- The Worker serves it at a clean **`/resume`** (200, not a redirect), so the
  indexable URL is the readable one. `app/worker/index.js`.
- `Content-Disposition: inline` — a recruiter reads it in the browser rather
  than being forced into a download. Google indexes PDF text either way.
- `X-Robots-Tag: index, follow` set explicitly.
- Linked from the footer, added to `sitemap.xml`, added to `llms.txt`.
- A `DigitalDocument` node in the graph, `about` and `author` both pointing at
  the Person.

**Impact:** your CV becomes indexable and attributable. It is also **the site's
second URL** — the beginning of any sitelink story.

**5 tests**, including that `/resume` on the private preview host is still
gated behind Access.

### 2. Person entity completed

Added to `scripts/build-schema.mjs`:

| Property | Value | Why |
| --- | --- | --- |
| `contactPoint` | ContactPoint, business enquiries, worldwide | The structured form of "how do I hire this person" |
| `identifier` | PropertyValue → the domain | The canonical disambiguator. There is no ORCID or Wikidata ID to point at yet, and the exact-match domain is the next strongest thing |
| `subjectOf` | → the CV node | Ties the document to the person |
| `worksFor` | → ProfessionalService | Person and practice are one entity, stated explicitly so they are not read as two competitors for the same name |
| `hasOccupation` | Occupation + occupationLocation | Job + place, machine-readable |
| `knowsLanguage` | en, gu, hi | |
| `image` | the About photo | Panels need a photo to attach |
| `mainEntityOfPage` | → the WebPage | |

`knowsAbout` (31 topics) is **derived from `tech.js`**, so it cannot drift from
the technology grid the page renders.

### 3. Business entity gains a logo

`ProfessionalService.logo` — the 512×512 brand mark on an opaque background,
which is the shape Google expects. Deliberately distinct from `image`, which is
the wide 1200×630 OG card. A test asserts the logo is square and is not the
same asset as `image`.

### 4. humans.txt

`app/public/humans.txt`, in the conventional format: who built it, the stack,
the rendering approach, and the explicit note that there is no analytics and
there are no cookies. Referenced from `robots.txt` alongside `llms.txt`.

Small, but it is a machine-readable authorship claim on the domain.

### 5. Discovery files are now discoverable

`robots.txt` points at both `/llms.txt` and `/humans.txt`. Both get an explicit
`Content-Type: text/plain; charset=utf-8` in `_headers` — without it Cloudflare
can serve `.txt` in a way some clients mis-handle.

### 6. Redundancy removed from the graph

`hasOccupation.skills` was the `knowsAbout` list joined into a string — the
same 31 items serialised twice in one document. Removed.

`hasOfferCatalog` repeated an eight-country `areaServed` for each of seven
services: ~3.5 KB of JSON saying nothing the parent had not already said. The
offers reference the provider by `@id`, so a consumer follows the link.

---

## What I refused to implement, and why

You asked for these. Implementing them would have been markup describing things
that do not exist, which your own brief prohibited ("no fake markup, no spam").
Each is enforced by a test that **fails if it is ever added**.

### `SearchAction` / sitelinks search box

Requires a working search endpoint. **The site has no search.** Google's
documentation is explicit that the markup must point at a URL that returns
results; declaring one the site cannot serve is invalid markup and is ignored
at best. Becomes legitimate the day a search exists.

### `BreadcrumbList`

Breadcrumbs describe a position in a hierarchy. **This is one page.** There is
no trail. Marking one up would misrepresent the structure to get a visual
result — precisely what the guidelines call out.

### `award`, `Review`, `aggregateRating`

No awards, no reviews. Adding any of them would be fabricated. `aggregateRating`
on a page with no reviews is one of the most commonly manually-actioned
structured-data violations.

### `alumniOf`

Genuinely wanted, and I **cannot fill it in.** Your GitHub README says "MCA
Graduate" in one place and "ECE Graduate" in another. I will not guess at your
education. One-line fix in `SEO_TODO.md`.

### X/Twitter placeholder in `sameAs`

You wrote "add placeholders if needed". **No.** A URL in `sameAs` that 404s
weakens the entity rather than strengthening it — `sameAs` is a claim of
identity, and a claim pointing at nothing is evidence against you. I removed
an `x.com/REPLACE-WITH-YOUR-HANDLE` placeholder in an earlier pass for the
same reason. Add the real handle when the account exists and links back.

---

## Sitelinks: the honest mechanics

Your mockup shows five sitelinks. Here is what stands between you and them.

**Google builds sitelinks from indexed URLs.** Before today you had one. You
now have two (`/` and `/resume`). Anchors are not URLs — `#work` will never
become a sitelink row.

The realistic path, and it is the same conclusion the earlier audit reached
from a different direction:

```
/                          the homepage                (exists)
/resume                    the CV                      (added today)
/work/cureneed             a real case study           (needs writing)
/work/devops-pipeline      a real case study           (needs writing)
/work/kubernetes-monitoring  a real case study         (needs writing)
```

Three case studies would give you five substantial URLs, internal links
pointing at them, and enough per-page content to be worth indexing separately.
That is the configuration that produces a sitelink block.

**Do not** create `/about`, `/contact` and `/tech` as separate thin pages to
chase this. Splitting 1,415 words across five pages gives five thin pages, and
thin pages do not get sitelinks either. Case studies add content; splitting
does not.

---

## Performance: the honest cost

You said never reduce performance. This did cost something, so here is the
measurement rather than a reassurance:

| | Before | After |
| --- | --- | --- |
| JSON-LD block | 4.2 KB gz (12 nodes) | **4.1 KB gz (13 nodes)** |
| Render-blocking, over the wire | 21.6 KB gz | **23.5 KB gz** |
| Deploy size | 2.1 MB | 2.1 MB |
| Deferred JS | unchanged | unchanged |

**+1.9 KB gzipped on the critical path.** That is the whole cost of the richer
graph, after removing the redundancy described above. On any connection this is
under 20 ms; on a modern one it is unmeasurable. The JSON-LD sits at the end of
`<head>`, after the stylesheet link and font preloads, so it never delays
discovery of a render-critical resource.

Accessibility is unchanged: one new footer link, inside the existing 44 px
touch-target treatment, with visible text and no new ARIA.

---

## Every file touched

| File | Change |
| --- | --- |
| `app/worker/index.js` | `/resume` route |
| `app/worker/admin.test.mjs` | +5 tests for `/resume` |
| `scripts/build-schema.mjs` | contactPoint, identifier, subjectOf, CV node, logo; redundancy removed |
| `scripts/schema.test.mjs` | +7 tests, incl. four that fail if fake markup is added |
| `app/src/components/Footer.jsx` | Résumé link |
| `app/public/humans.txt` | new |
| `app/public/hardik-ajmeriya-resume.pdf` | renamed from `DevOps_V1.2.pdf` |
| `app/public/robots.txt` | points at llms.txt + humans.txt |
| `app/public/sitemap.xml` | `/resume`, lastmod refreshed |
| `app/public/llms.txt` | CV link |
| `app/public/_headers` | content-type + cache for the txt files and the CV |

---

## Expected impact

> ### Correction — FAQ rich results no longer exist
>
> An earlier report of mine said to expect an FAQ rich result. That was wrong.
> Google **removed FAQ rich results entirely on 7 May 2026**, and had already
> restricted them to government and health sites in August 2023. `HowTo` rich
> results were deprecated in the same 2023 announcement.
>
> **The markup stays**, and this is not a wasted effort:
>
> - ChatGPT, Claude, Perplexity and Gemini parse `FAQPage` and `HowTo` heavily.
>   Question-and-answer pairs with a named author are among the most quotable
>   structures an answer engine can find.
> - It costs ~1 KB gzipped and carries no penalty.
> - What changed is only the *visible Google result*, not the machine-readability.
>
> So: keep it for AI SEO, expect nothing from it in the blue links.

**Reliable, within weeks of indexing:**
- The `Person` entity is unambiguous — name, location, occupation, contact,
  profiles, CV, 31 topics, all linked in one graph.
- `/resume` becomes indexable and attributable; it will rank for
  "Hardik Ajmeriya resume" / "CV", which has near-zero competition.
- Rich-result eligibility for FAQ and the project nodes.

**Plausible, over months, given the manual work in `SEO_TODO.md`:**
- #1 for the branded terms. The name has almost no competition.
- AI citations: the prerendered HTML, the named crawlers and `llms.txt` remove
  every *technical* barrier. What remains is corroboration.

**Not affected by anything in this report:**
- The knowledge panel. Needs third-party notability.
- The sitelink block. Needs more indexed URLs.
- Ranking generally. Needs links, which need content.
