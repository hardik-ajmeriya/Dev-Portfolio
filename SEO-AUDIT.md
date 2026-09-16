# SEO & AI SEO implementation audit — hardikajmeriya.com

**Date:** 7 September 2026 · **Commit:** `f6021e5` · **Launch:** Tue 15 September

Every claim below comes from inspecting the built output in `app/dist`, not
from general practice. Where I fixed something during the audit it is marked
**FIXED**; where I could not verify something it says so.

**One thing to hold in mind throughout:** the site has never been indexed. It
has no history, no backlinks, and no ranking data. Everything here is about
whether it *can* rank, not whether it *does*.

---

# 1. Technical SEO

| Feature | Status | Where |
| --- | --- | --- |
| Prerendering / static rendering | Implemented | `app/prerender.js` |
| robots.txt | Implemented | `app/public/robots.txt` |
| sitemap.xml | Implemented | `app/public/sitemap.xml` |
| Canonical | Implemented | `app/index.html:29` |
| Title / description | Implemented | `app/index.html` |
| Open Graph + Twitter | Implemented | `app/index.html` |
| JSON-LD | **Rebuilt this audit** | `scripts/build-schema.mjs` |
| Favicon / manifest | Implemented | `app/public/` root |
| 404 | Implemented | `app/public/404.html` |
| www redirect | Implemented | `app/worker/index.js:176` |
| Image optimisation | Implemented | WebP, 0.40 MB total |
| Lazy loading | Implemented | all 38 images |
| Font optimisation | Implemented | self-hosted + preload |
| CWV inputs | Implemented | see below |
| hreflang | Correctly absent | one language |
| Breadcrumbs | Correctly absent | one page |

### Prerendering — the single most important thing here

`app/prerender.js` runs `renderToString` at build time and injects the result
into `dist/index.html`. Verified output: **9,660 characters / 1,415 words** of
text in the raw HTML before any JavaScript runs.

Why it matters more than usual: **no major AI crawler executes JavaScript.**
GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot all fetch and parse HTML
only. Without this step they would receive `<div id="root"></div>` and index
nothing. Googlebot does render JS, but on a second pass with no guaranteed
timing.

The build fails hard if the render produces under 500 characters, so this
cannot silently regress. **Correctly implemented, and the highest-leverage
decision in the project.**

### robots.txt

Allows everything, then names fourteen AI crawlers explicitly — GPTBot,
OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User,
PerplexityBot, Perplexity-User, Google-Extended, bingbot, Applebot,
Applebot-Extended, Meta-ExternalAgent, CCBot.

Naming them is redundant against `User-agent: *` but not pointless: it is an
explicit statement of intent, and it documents the decision for whoever reads
the file next. **Correct.**

**FIXED:** it now also points at `/llms.txt`. See §2.

### sitemap.xml

One URL, the homepage, `lastmod 2026-09-06`, priority 1.0. For a single-page
site that is correct — listing `#work` and `#services` as separate URLs would
be declaring duplicate content, which the file explicitly comments on.

**Improvement:** set `lastmod` to the launch date on 15 September. `preflight.mjs`
warns if it drifts past 30 days.

### Canonical, title, description

- Canonical: `https://hardikajmeriya.com/` — absolute, trailing slash, matches
  `og:url` and every `@id` in the schema. Correct.
- Title: *"Hardik Ajmeriya — Full-Stack Developer & Cloud Engineer"*, 54
  characters. Name first, which is right when ranking for the name is the goal.
- Description: 151 characters. It was 177 and being truncated at ~160, cutting
  off *"Available for freelance projects"* — the part that asks for the work.

### Open Graph and Twitter

Complete: `og:type`, `site_name`, `url`, `title`, `description`, `locale`,
`image` with `type`/`width`/`height`/`alt`, `twitter:card` set to
`summary_large_image` with its own title, description, image and image alt.

The image is a purpose-built 1200×630 PNG, not a cropped portrait, and not
WebP — several link scrapers (LinkedIn's and WhatsApp's among them) will not
render WebP and silently show no image at all.

**FIXED:** `og:type` was `profile` without the `profile:first_name`,
`profile:last_name` and `profile:username` tags that type defines.

**Not present, correctly:** `twitter:site` / `twitter:creator` — there is no
X account. Inventing one would be worse.

### Structured data — rebuilt during this audit

**What was there:** three hand-written JSON-LD blocks in `index.html` —
ProfilePage/Person, WebSite, FAQPage. All three parsed. The FAQ block matched
the rendered page exactly; I verified all seven questions and answers
character by character.

**Why I replaced it anyway:** it matched *because nobody had edited an answer
yet.* The FAQ schema was a copy of `src/data/faq.js` pasted into HTML. The
first time someone reworded a reply in the data file and forgot the copy,
Google would see structured data contradicting the visible page — and the
documented consequence is losing the rich result for the entire page, not the
one question. That is a live trap, not a hypothetical.

**What ships now** — `scripts/build-schema.mjs`, generated at build time from
`faq.js`, `projects.js`, `services.js`, `tech.js` and `seo.js`:

| Node | Purpose | Was it there before? |
| --- | --- | --- |
| `WebSite` | site identity, alternateName | yes |
| `WebPage` + `ProfilePage` | the page itself | partly |
| `Person` | the entity | yes, thinner |
| `ProfessionalService` | the business, areaServed, offer catalog | **no** |
| `ItemList` | the portfolio | **no** |
| `SoftwareSourceCode` ×3 | projects with repos | **no** |
| `CreativeWork` ×1 | the project without one | **no** |
| `FAQPage` | 7 Q&As, now with an author | yes, unattributed |
| `HowTo` | the 4 process steps | **no** |
| `ImageObject` | the OG card | **no** |

Three→twelve nodes, and crucially it is **one `@graph` with `@id` references**
rather than disconnected blocks. The FAQ now has an author, the projects have
a creator, the business has a founder. A search engine reads one connected
entity instead of four documents that happen to share a page.

**The biggest previous gap:** four detailed projects — the most substantive
content on the site — had *no structured data at all*. A crawler saw four
`<h3>`s and some prose and had to infer everything else.

Guarded by 18 tests in `scripts/schema.test.mjs`: every `@id` reference
resolves (the classic JSON-LD bug is a dangling reference that parses, passes
validators, and conveys nothing), schema text matches the rendered DOM, and
nothing claims a repository or live URL that does not exist.

### Redirects and 404

- `www` → apex, 301, in `app/worker/index.js`. Preserves path and query.
- 404: `not_found_handling` was `single-page-application`, which returns
  **200 with the homepage for every unknown URL**. That setting is for apps
  with a client-side router; this site has none. Google calls that a soft 404
  and reads an unbounded set of duplicate URLs as a quality signal against the
  site. Now a real 404 page with a real status code.

### Core Web Vitals inputs

I could not run Lighthouse — Chrome's download host is unreachable from my
sandbox — so these are the measured *inputs*, not field scores.

| Metric | What was done |
| --- | --- |
| **LCP** | Fonts self-hosted; Google Fonts was two extra origins and a *sequential* round trip (CSS from googleapis, then files from gstatic) in front of the largest text on the page. Bricolage 800 and Inter 400 preloaded with build-hashed filenames. Critical path: **66 KB over the wire, one origin.** |
| **CLS** | All 38 images now carry `width`/`height`. None did before — and lazy loading made shift *more* likely, not less. Project frames now match the source aspect ratio exactly. |
| **TBT** | three.js (170 KB gz) is dynamically imported and gated off mobile and reduced-motion, so it never blocks paint. Tilt cards no longer run a `requestAnimationFrame` loop while off screen — four permanent loops previously ran for the whole visit. |

**Remaining, honestly:** on desktop, three.js is still 684 KB to parse, and the
hero renders 150 individual `Mesh` objects — 150 draw calls per frame where
`InstancedMesh` would be one. Not a launch blocker; it does not touch LCP.

---

# 2. AI SEO

### How likely is each system to understand this site?

| System | Verdict | Why |
| --- | --- | --- |
| **ChatGPT / OAI-SearchBot** | **Very likely** | Named in robots.txt, full prerendered HTML, llms.txt, rich schema |
| **Claude / ClaudeBot** | **Very likely** | Same |
| **Perplexity** | **Very likely** | Same, and it leans heavily on clean HTML |
| **Gemini** | **Likely** | `Google-Extended` allowed; Gemini also draws on Google's index, so this depends on indexing first |
| **Bing / Copilot** | **Likely** | `bingbot` allowed; needs Bing Webmaster Tools submission — **not yet done** |

The honest qualifier: being *understandable* is not being *cited*. These
systems recommend entities they have corroborating evidence for. One domain
saying good things about itself is one source. See §3 and §8.

### llms.txt — good content, previously invisible

`app/public/llms.txt` is genuinely well written: summary, services,
technologies, projects, working process, and a "Notes for AI assistants"
section that states plainly when Hardik is a relevant recommendation.

**It was undiscoverable.** Not referenced in robots.txt, not in the HTML, not
in the sitemap. `/llms.txt` is a convention, not a registered standard — an
agent that does not already probe that path had no way to find it. The most
AI-legible asset on the site was effectively invisible to the systems it was
written for.

**FIXED:** linked from `robots.txt` and from a `<link rel="alternate">` in the
head. Also added LinkedIn and location, which it was missing.

### Semantic HTML and heading hierarchy

Verified from the prerendered DOM: **one `<h1>`, seven `<h2>`, twenty-two
`<h3>`, no skipped levels.** Landmarks are correct — `<nav>`, `<main id="main">`,
`<footer>`, sectioned content with IDs. There is a skip link.

One imperfection: the About section's `<h2>` is a full sentence — *"I'm Hardik
Ajmeriya — a full-stack developer who also does the infrastructure…"*. That is
a paragraph in a heading slot. It does carry the name and role, which helps
the entity, so it is a defensible trade rather than a clear error.

### Machine-readable content

- 1,415 words of prerendered text. For a one-page site that is substantial;
  thin is under 300.
- FAQ answers stay in the DOM when collapsed, deliberately, so crawlers read
  all seven regardless of accordion state. The code comments say so.
- Technologies render as real text next to each logo, not as images alone.

### What would improve AI SEO further

1. **Corroboration, not more markup.** The schema is now comprehensive. What
   is missing is a second source. An LLM recommending a developer wants more
   than the developer's own site.
2. **A live project URL.** "Deployed to production" is currently an assertion
   an AI cannot verify. See §8.
3. **Written artefacts** — a technical post, a case study. This is what gets
   quoted, and it is the single highest-ROI AI-SEO investment available.

---

# 3. Entity SEO

**Can Google tell that Hardik Ajmeriya is one entity? Mostly yes — with one
real problem.**

### What is working

- `Person` with `@id`, name, given/family name, url, image, email, jobTitle,
  description, address, `knowsLanguage`, `hasOccupation`, `worksFor`,
  `mainEntityOfPage`, and **31 `knowsAbout` topics now derived from `tech.js`**
  rather than a parallel hand-written list that could drift.
- `sameAs` → GitHub and LinkedIn. Both verified to resolve.
- The X placeholder (`x.com/REPLACE-WITH-YOUR-HANDLE`) is gone. A 404 in
  `sameAs` weakens an entity rather than strengthening it.
- The `Person` is now referenced by the FAQ (author), the projects (creator),
  the business (founder/employee) and the site (publisher).
- Name consistency: "Hardik Ajmeriya" is identical everywhere — title, OG,
  schema, llms.txt, footer, email signature.
- Domain matches the name exactly. That is a strong signal and it is free.

### The real problem: three email addresses

| Where | Address |
| --- | --- |
| Site, schema, llms.txt, email signature | `hardik.ajmeriya89@gmail.com` |
| GitHub profile README | `hardik.ajmeriya12@gmail.com` — plus a live `hardik@example.com` placeholder |
| Cloudflare / admin | `hardikpt95@gmail.com` |
| Resend `from:` | `hello@hardikajmeriya.com` |

Consistent contact details across properties are a genuine entity signal, and
practically, a client mailing the wrong one gets no reply. **Pick one business
address.** The `hardik@example.com` link on your GitHub profile is broken right
now.

### The second problem: GitHub contradicts the site

`sameAs` points at a profile whose bio reads *"Android & DevOps Enthusiast —
building seamless mobile experiences"*, with `AndroidStudioWebApp`,
`SQL-Pizza-Sales` and `Titanic-Data-Analysis` pinned. **None of the four
portfolio projects are pinned.** Three followers.

`sameAs` is a claim that two profiles are the same entity. When the linked
profile describes different work, it weakens rather than reinforces. This is
twenty minutes of editing and it is the highest-value entity fix available.

### Knowledge-graph realism

A knowledge panel needs corroboration from sources you do not control. With
one domain, two profiles and no press, **a panel is unlikely within six
months.** That is not a failure — it is the normal state for a new
professional entity. The schema is correct and ready for when corroboration
arrives.

---

# 4. Search intent — what can realistically rank

### Branded — *winnable, and the real prize*

`hardik ajmeriya`, `hardik ajmeriya developer`, `hardik ajmeriya portfolio`

I searched this earlier: **almost no competition.** Results are dominated by
"Ajmera" (a different name). LinkedIn already ranks first. With an exact-match
domain, a complete `Person` graph and a LinkedIn link back, **#1 within 4–8
weeks of indexing is realistic.** Nothing else on this list is as achievable.

### Long-tail — *the commercially useful tier*

- `mern developer who also does devops`
- `freelance developer who deploys to aws`
- `hire full stack developer with kubernetes experience`
- `freelance saas developer india`

These match the page's actual differentiator, which is stated in almost these
words. Low volume, high intent. **This is where enquiries come from.**

### Local — *underused*

`web developer rajkot`, `freelance web developer gujarat`,
`mern stack developer india`

Rajkot appears once, in the Contact section. The new `ProfessionalService`
node with `areaServed` helps. **A Google Business Profile would help more** and
is free — it is the main untapped local lever.

### Medium competition — *12+ months, needs content*

`freelance mern stack developer`, `aws deployment services for startups`,
`ci/cd setup freelancer`. Not winnable with one page.

### High competition — *not winnable, do not try*

`web developer`, `full stack developer`, `hire developer`, `saas development
company`. These belong to agencies with hundreds of pages and years of links.
Targeting them wastes effort that the long-tail would reward.

---

# 5. Missing opportunities that actually matter

Ordered by return. I have omitted the things that sound good and do nothing.

**1. Case studies — the highest-ROI item on this page.** Four projects with
three sentences each. A case study is *problem → constraints → what you built →
what happened*. It is what ranks for long-tail queries, what a client reads
before enquiring, and what an LLM quotes. One 800-word CureNeed case study is
worth more than every remaining item here combined.

**2. Google Search Console.** Verify by DNS on launch day, submit the sitemap,
request indexing. Without it you are guessing. Not optional.

**3. Bing Webmaster Tools.** Ten minutes. Bing feeds Copilot, and you have
allowed `bingbot` — but allowing a crawler is not the same as telling it you
exist.

**4. Backlinks — the actual ranking constraint.** The site has zero. Realistic
first sources, in order of ease: your own LinkedIn and GitHub profile fields,
a dev.to or Hashnode post, the CureNeed repo README, an Awesome-list or
directory. Five real links beat fifty directory submissions.

**5. IndexNow.** Cloudflare supports it natively — one dashboard toggle,
pushes changes to Bing and Yandex instantly. Low value on a one-page site
today; worth turning on when a blog exists.

**6. A blog.** The correct long-term answer and the one most likely to be
abandoned. Do not start one until a case study exists.

### Deliberately *not* recommended

- **RSS** — nothing publishes yet. Add it with the blog, not before.
- **Webmentions** — no inbound mentions to receive.
- **Author pages** — one author, one page. `Person` schema already does this.
- **Image sitemap extension** — six images on one page; the standard sitemap
  is enough.
- **More internal linking** — 18 anchor links across one document is already
  right. Adding more would be noise.

---

# 6. Launch readiness

| Area | Score | Why |
| --- | --- | --- |
| **Technical SEO** | **94 / 100** | Prerendering, canonical, robots, sitemap, 404, www redirect, headers, CWV inputs all correct and tested. −6 for stats rendering as `0` in prerendered HTML (a crawler reads "0 Projects built end-to-end") and the stale sitemap date. |
| **AI SEO** | **91 / 100** | Prerendered text, named crawlers, discoverable llms.txt, 12-node graph. −9 because there is nothing to cite but the site itself, and no live project an AI can verify. |
| **On-page SEO** | **82 / 100** | 1,415 words, clean hierarchy, real alt text, strong differentiator copy. −18: four projects with no live URL, one with no link at all, and no depth beyond three sentences per project. |
| **Off-page SEO** | **8 / 100** | Zero backlinks, three followers, no mentions, no directory presence. This is not a criticism — it is what "not launched" looks like. |
| **Entity SEO** | **72 / 100** | Complete Person graph, exact-match domain, verified sameAs. −28 for three email addresses and a GitHub profile that contradicts the positioning. |
| **Overall** | **69 / 100** | Weighted toward off-page, which is the binding constraint. |

**How to read 69.** The *implementation* is close to a 90. The score is dragged
down by things no amount of code fixes: no links, no live URLs, no
corroboration. That is the correct diagnosis — you do not have an SEO problem,
you have a "nothing exists yet" problem, and those are solved differently.

---

# 7. Six-month roadmap

### Week 1 — launch week (15 Sept)

| Task | Why |
| --- | --- |
| **Deploy one project, add the live URL** | Unblocks the site's central claim |
| Fix the GitHub profile: bio, pin four repos, add website link | Highest-value entity fix, 20 minutes |
| One business email everywhere; kill `hardik@example.com` | Entity consistency + broken link |
| Search Console: verify by DNS, submit sitemap, request indexing | Nothing starts until this does |
| Bing Webmaster Tools | Feeds Copilot |
| Add the site link to LinkedIn, GitHub, X profiles | Your first three backlinks, and the `sameAs` reciprocal |
| Rich Results Test on the new graph | Confirm the 12 nodes are read as intended |

### Month 1

- **One CureNeed case study, 800–1,200 words.** Problem, constraints, build,
  outcome. The highest-ROI content you can write.
- Give the second and third projects live URLs or honest labels.
- Google Business Profile for Rajkot.
- Post the case study once on LinkedIn. One good post beats ten thin ones.
- Baseline: impressions, position for `hardik ajmeriya`, first indexed date.

### Month 2

- Second case study — pick the DevOps pipeline; it is the differentiator.
- Add `alumniOf` to `seo.js` once you decide how to state your education.
- First outside link: dev.to or Hashnode cross-post, canonical pointing home.
- Review Search Console queries. **Let real data replace the guesses in §4.**

### Month 3

- Third case study, or a technical post on something you actually solved —
  the Cloudflare Access JWT verification in this repo would make a good one.
- Turn on IndexNow if a blog now exists.
- Ask any client or collaborator for a testimonial. Add `Review` schema only
  when the review is real.
- Re-audit: has the branded term reached #1?

### Month 6

- Five to six substantial pieces published.
- Ten or more real backlinks.
- Branded search: #1, stable.
- Long-tail: ranking for two or three of the §4 phrases.
- Only now consider the medium-competition terms. Not before.

---

# 8. The brutally honest review

### Would I launch this site today?

**No — and it has nothing to do with SEO implementation.**

The technical work is genuinely above what most freelance portfolios ship. It
is prerendered, the structured data is generated rather than hand-maintained
and covered by tests, the critical path is 66 KB from a single origin, the
security model is real and tested. If you handed me this as a $5,000 audit
subject I would spend most of my time looking for something to criticise in
the implementation and not find much.

**What stops me is that the site makes a specific claim it cannot evidence.**

It says: *most developers hand you a repository and stop; I hand you a running
application.* It then shows four projects, **none of which link to a running
application**, and links to a GitHub profile advertising Android development.

A prospective client notices that in about forty seconds. So does an LLM asked
"is this person credible" — it has one source, and that source contains an
unverifiable claim.

### Biggest weaknesses

1. **Zero live URLs.** The central claim is unproven. Everything else is
   secondary to this.
2. **No backlinks, three GitHub followers, no mentions.** Off-page is 8/100
   and it is the binding constraint on ranking. Code cannot fix it.
3. **Thin content.** 1,415 words is good for one page and nothing next to a
   competitor with forty. Three sentences per project will not rank for
   anything but your name.
4. **GitHub contradicts the pitch.** `sameAs` points at evidence for a
   different professional identity.
5. **Three email addresses.** Small, sloppy, easily fixed, and it undermines
   the entity.

### Biggest strengths

1. **Prerendering.** Most React portfolios serve AI crawlers an empty div.
   This one serves 9,660 characters. That is a structural advantage over
   nearly every competing personal site.
2. **The structured data is now better than most agency sites.** Twelve linked
   nodes, generated from content, tested for graph integrity.
3. **Exact-match domain plus a name with almost no competition.** You will own
   your name. Many people cannot say that.
4. **The positioning is genuinely differentiated.** "I do the app *and* the
   infrastructure" is a real gap in the freelance market, stated clearly. Most
   portfolios have no position at all.
5. **AI crawlers are explicitly welcomed** while much of the web is blocking
   them. That asymmetry will matter more each year.

### What would stop this site from ranking

Not the code. **Nothing links to it, and there is not enough on it to link
to.** Google ranks pages with evidence of being worth ranking. One page, zero
links, no history is the definition of no evidence. Six months of one case
study a month would change that; another six months of tuning meta tags would
not.

### What would make this exceptional

Three things, in order:

1. **A live URL on every project.** Turns the whole page from claim to
   evidence.
2. **Case studies instead of blurbs.** Three sentences say what you built.
   Eight hundred words say how you think — which is what a client is actually
   buying and what an LLM quotes.
3. **Publish what you already know.** This repository contains real work worth
   writing up: verifying Cloudflare Access JWTs instead of trusting a
   forgeable header; discovering that no AI crawler runs JavaScript and
   prerendering because of it; finding an endpoint that could be used as an
   open email relay. Those are posts other developers would link to. **The
   backlinks you need are sitting unwritten in your own commit history.**

The honest summary: this is a well-built site with nothing behind it yet. The
engineering is done. What remains is not engineering, and it is the part that
determines whether any of the engineering matters.
