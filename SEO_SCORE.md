# SEO scorecard

**7 September 2026** · after the implementation pass · 119 tests passing

Scores are against *what is achievable for a one-page personal site*, not
against an agency with 400 pages. Where a score is capped by something code
cannot fix, it says so.

---

## Summary

| Area | Score | One-line reason |
| --- | --- | --- |
| Technical SEO | **96%** | Everything implementable is implemented and tested |
| Entity SEO | **88%** | Complete graph; capped by GitHub contradicting the site |
| AI SEO | **93%** | No technical barrier left; capped by having one source |
| Brand SEO | **84%** | Strong signals, near-zero competition, zero authority yet |
| Core Web Vitals readiness | **90%** | Inputs measured and correct; no field data yet |
| Knowledge Panel readiness | **35%** | Markup ready, notability absent — and that is normal |
| AI Search readiness | **91%** | Crawlable, legible, welcomed; needs corroboration |
| Google Search readiness | **72%** | Ready to be indexed; not yet ready to outrank anything but your own name |
| **Overall** | **81%** | The build is done. The evidence is not. |

---

## Technical SEO — 96%

**What earns it**

- Prerendered to static HTML at build time; 9,667 characters of text before any
  JS runs, with a build that **fails** if the render drops under 500 chars
- Canonical, absolute, matching `og:url` and every `@id` in the graph
- `robots.txt` allows everything and names 14 AI crawlers; points at
  `/llms.txt` and `/humans.txt`
- `sitemap.xml` with both real URLs
- Real 404 with a real status code — was previously a soft 404 returning 200
  with the homepage for every unknown URL
- `www` → apex 301, path and query preserved, 3 tests including two lookalike
  hosts that must *not* redirect
- Self-hosted fonts, 2 preloaded with build-hashed filenames
- All 38 images carry `width`/`height`; all lazy-loaded and `decoding="async"`
- Full favicon set at the site root, `site.webmanifest`, `manifest-src` in CSP
- HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, COOP, and a CSP with no `unsafe-inline` on `script-src`
- Cache: immutable for hashed assets, revalidate for HTML, `no-store` for 404

**The missing 4%**

- Stats render as `0` in the prerendered HTML — the count-up starts at zero, so
  a non-JS crawler reads *"0 Projects built end-to-end"*
- No field Core Web Vitals data, because nothing is live
- `sitemap.xml` `lastmod` needs setting to the launch date

---

## Entity SEO — 88%

**What earns it**

`Person` now carries: `@id`, name, given/family name, url, image, email,
`jobTitle`, description, `address`, `knowsLanguage`, `knowsAbout` (31 topics,
derived from `tech.js`), `hasOccupation` with `occupationLocation`, `worksFor`,
`contactPoint`, `identifier`, `subjectOf` (the CV), `mainEntityOfPage`,
`sameAs`.

Referenced by the FAQ as author, the projects as creator, the business as
founder and employee, the site as publisher. One connected graph, not islands.

Exact-match domain. Name consistent everywhere. Both `sameAs` URLs verified to
resolve — the `x.com/REPLACE-WITH-YOUR-HANDLE` placeholder was removed, because
a 404 in `sameAs` is evidence against an entity, not for it.

**Why not higher**

- **Your GitHub profile describes a different professional.** Bio says "Android
  & DevOps Enthusiast"; pinned repos are an Android app, a SQL exercise and a
  Titanic dataset. `sameAs` points Google at a corroborating source that
  contradicts the claim. **This is the single largest entity deduction and it
  is 20 minutes of work** — `SEO_TODO.md` item 5.
- Three published email addresses (item 6).
- `alumniOf` empty — I will not invent your education (item 7).
- Two profiles is a thin `sameAs`; three or four verified ones would be better.

---

## AI SEO — 93%

**What earns it**

- **Prerendering.** No major AI crawler executes JavaScript. GPTBot, ClaudeBot,
  PerplexityBot and OAI-SearchBot fetch HTML and parse it. Without this they
  would receive `<div id="root"></div>`. Most React portfolios do exactly that.
- 14 AI crawlers named and allowed while much of the web blocks them
- `llms.txt` — comprehensive, and now actually **discoverable**: it was
  referenced from nothing, so only a crawler that guessed the path found it
- 13 linked schema nodes; the FAQ has a named author with a job title and a
  location, which is the expertise signal an answer engine looks for
- 1,415 words of clean semantic HTML: one `h1`, no skipped heading levels,
  proper landmarks, real text beside every technology logo
- Collapsed FAQ answers stay in the DOM so all seven are readable regardless of
  accordion state

**Why not higher**

Nothing technical is left. The cap is that **an AI recommending a developer
wants more than that developer's own website.** One source is one source. The
7% is corroboration, not markup.

| System | Will it understand the site? |
| --- | --- |
| ChatGPT / OAI-SearchBot | Very likely |
| Claude / ClaudeBot | Very likely |
| Perplexity | Very likely |
| Gemini | Likely — depends on Google indexing first |
| Bing Copilot | Likely — **needs Bing Webmaster submission**, TODO item 2 |

---

## Brand SEO — 84%

**What earns it**

- Title leads with the name; `og:site_name`, `WebSite.name` and `alternateName`
  all reinforce it
- Domain is the name, exactly
- H1, About heading, footer, OG card, CV filename and email signature all say
  "Hardik Ajmeriya" without stuffing
- Location, occupation and stack are stated in prose *and* in schema
- **Almost no competition.** Search results for the name are dominated by
  "Ajmera", a different surname. Your LinkedIn already ranks first.

**Why not higher**

Brand search is winnable but not yet won: no indexing history, no authority,
and the second-strongest property in your name (GitHub) currently argues for a
different professional identity.

---

## Core Web Vitals readiness — 90%

**Not a Lighthouse score.** I could not run Lighthouse — Chrome's download host
is unreachable from my sandbox — and I will not invent one. These are the
measured inputs.

| | State |
| --- | --- |
| **LCP** | Fonts self-hosted (was 2 extra origins + a sequential round trip), 2 preloaded. Critical path **23.5 KB gzipped from one origin** |
| **CLS** | All 38 images have intrinsic dimensions; project frames match source aspect ratio |
| **TBT** | three.js dynamically imported, gated off mobile and reduced-motion; tilt cards no longer run rAF while off screen |
| **Deploy** | 2.1 MB, down from 31 MB |

**The missing 10%:** on desktop three.js is still 684 KB to parse, and the hero
renders 150 individual `Mesh` objects where `InstancedMesh` would be one draw
call. Neither touches LCP. And there is no field data until real users arrive.

---

## Knowledge Panel readiness — 35%

**Deliberately the lowest score, and it is not a criticism.**

A panel is generated when Google's Knowledge Graph holds an entity it trusts.
Trust comes from sources you do not control: Wikipedia/Wikidata, press,
established databases, conference listings. **Schema.org markup makes an entity
legible; it does not make it notable.** There is no markup that produces a panel.

**What is ready (the 35%):** a complete, internally consistent `Person` with a
photo, location, occupation, contact point, an identifier, a CV, two verified
profiles and 31 topics — all under a domain that is the person's exact name.
When corroboration appears, Google will already know what to attach it to.

**What is missing (the 65%):** any third-party source. Realistically **12+
months**, and only if you publish, speak, or get written about. The mockup's
panel is a long-term aspiration, not a launch target.

---

## AI Search readiness — 91%

Highest score after Technical, and correctly so — this is where the site is
unusually strong for its size. Prerendered content, named crawlers, a
discoverable `llms.txt`, an authored FAQ, and project nodes typed as
`SoftwareSourceCode` with real repository URLs.

The gap is that **"deployed to production" is currently unverifiable.** Four
projects, no live URL. An AI asked whether this developer ships to production
finds a claim and no evidence.

---

## Google Search readiness — 72%

Ready to be **indexed**: yes, completely. Nothing blocks a crawler.

Ready to **rank**: only for your own name.

- Zero backlinks
- Two indexed URLs
- 1,415 words total
- No indexing history

That is not a flaw in the build — it is what "never launched" looks like. Every
item in `SEO_TODO.md` moves this number; nothing in the codebase does.

---

## Would I launch this to compete for "Hardik Ajmeriya"?

**Yes — for the branded terms specifically.** The name has almost no
competition, you own the exact-match domain, the entity graph is complete and
tested, and LinkedIn already ranks for it. **#1 within 4–8 weeks of indexing is
a realistic expectation**, provided Search Console submission and the GitHub fix
happen (TODO items 1 and 5).

**For everything else, not yet** — and the reason is unchanged from the earlier
audits: four projects, no live URL. It is the one thing that turns the site's
central claim from an assertion into evidence, and no schema can substitute
for it.

**The three highest-return actions, all outside the codebase:**

1. Deploy one project and add the live URL
2. Fix the GitHub profile — 20 minutes, biggest single entity gain available
3. Search Console + Bing on launch day
