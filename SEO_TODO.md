# SEO — manual work only

Everything implementable in code is done. This file contains **only** the
things that cannot be, with exact instructions. Ordered by return.

Tick items off as you go — several of them block the others.

---

## Before launch (Tue 15 September)

### 1. Google Search Console — nothing starts until this is done

- [ ] <https://search.google.com/search-console> → **Add property** → **Domain** → `hardikajmeriya.com`
- [ ] Verify by **DNS TXT**. Cloudflare → DNS → Records → Add → TXT, name `@`, paste the value. Domain verification covers www, subdomains and both protocols in one go; the URL-prefix method does not.
- [ ] **Sitemaps** → submit `sitemap.xml`
- [ ] **URL Inspection** → paste `https://hardikajmeriya.com/` → **Request indexing**
- [ ] Repeat URL Inspection for `https://hardikajmeriya.com/resume`
- [ ] **Settings → Users and permissions** → confirm only you have access

> Requesting indexing is what turns "eventually" into "a day or two". Do it for both URLs on launch day.

### 2. Bing Webmaster Tools — 10 minutes, and it feeds Copilot

- [ ] <https://www.bing.com/webmasters> → **Import from Google Search Console** (one click once step 1 is done)
- [ ] Submit the sitemap
- [ ] **Settings → IndexNow** → enable. Cloudflare also has a one-toggle IndexNow integration under **Caching → Configuration**; either is fine, do not do both.

### 3. Rich Results Test — confirm the graph is read as intended

- [ ] <https://search.google.com/test/rich-results> → test `https://hardikajmeriya.com/`
- [ ] Expect: **no rich results at all**, and that is the correct outcome. Google removed FAQ rich results on **7 May 2026** and deprecated HowTo in 2023. Person, ProfessionalService, SoftwareSourceCode and ItemList have never had a visual rich result. The test should report the types as *detected and valid* with zero errors — that is what "passing" looks like for this site.
- [ ] <https://validator.schema.org/> → same URL → expect **0 errors, 0 warnings**

### 4. Reciprocal profile links — this is what makes `sameAs` mean anything

`sameAs` is a *claim* that two profiles are the same person. A link back is what
**confirms** it. Without the return link the claim is unverified.

- [ ] **GitHub** → Settings → Public profile → **Website** = `https://hardikajmeriya.com`
- [ ] **LinkedIn** → Contact info → **Website** = `https://hardikajmeriya.com` (label: Personal)
- [ ] LinkedIn → **Featured** section → add the site as a link

### 5. Fix the GitHub profile — it currently contradicts the site

Your `sameAs` points at a profile whose bio reads *"Android & DevOps
Enthusiast — building seamless mobile experiences"*, with `AndroidStudioWebApp`,
`SQL-Pizza-Sales` and `Titanic-Data-Analysis` pinned. **None of your four
portfolio projects are pinned.** For entity SEO this actively works against you:
the corroborating source describes a different professional.

- [ ] Bio → something matching the site, e.g. *"Full-stack developer (MERN) and cloud engineer. I build web applications and deploy them to production on AWS. hardikajmeriya.com"*
- [ ] Pin the four portfolio repos: `MedCare`, `ultimate-devops-project-demo`, `k8s-kind-voting-app`, and DCPVAS once pushed
- [ ] Location field → `Rajkot, Gujarat, India` (currently `Rajkot,Gujrat,India` — misspelled, and missing spaces)
- [ ] **Remove the broken `mailto:hardik@example.com`** from your profile README — it is a live dead link
- [ ] Set the README email to your one business address (see item 6)

### 6. Pick ONE business email

You currently publish three:

| Where | Address |
| --- | --- |
| Site, schema, llms.txt | `hardik.ajmeriya89@gmail.com` |
| GitHub README | `hardik.ajmeriya12@gmail.com` + a `hardik@example.com` placeholder |
| Cloudflare / admin | `hardikpt95@gmail.com` |

- [ ] Decide which is the business address
- [ ] If it is **not** `hardik.ajmeriya89@gmail.com`, change `PERSON.email` in `app/src/data/seo.js` — one line, everything else is derived from it
- [ ] Update the GitHub README to match

> Keep `hardikpt95@gmail.com` for Cloudflare and the admin panel. That one is infrastructure, not a public contact, and it is fine for it to differ.

### 7. Fill in `alumniOf` — I cannot, you can

Your GitHub README says "MCA Graduate" in one place and "ECE Graduate" in
another. I will not guess at your education.

- [ ] Add to `app/src/data/seo.js`, inside `PERSON`:

```js
  alumniOf: {
    name: 'Your University Name',
    url: 'https://university-website.example',   // the official site
  },
```

- [ ] Tell me and I will wire it into `scripts/build-schema.mjs` as a proper
      `EducationalOrganization` node, or add it yourself following the
      `worksFor` pattern already there.

> Education is a strong disambiguation signal for a person entity: it is a fact a third party (the university) can corroborate.

---

## Month 1

### 8. Google Business Profile — the local lever, unused

You are in Rajkot and the schema now says so, but nothing outside your own site
confirms it.

- [ ] <https://business.google.com> → create a profile
- [ ] Category: **Website designer** (closest match; **Software company** as secondary)
- [ ] **Service area business** — do not publish your home address
- [ ] Website → `https://hardikajmeriya.com`
- [ ] Verification is usually by postcard or video; allow 1–2 weeks

> This is the single strongest signal available for "web developer Rajkot" and it costs nothing.

### 9. The first real backlinks

Five genuine links beat fifty directory submissions. In order of ease:

- [ ] GitHub profile website field (item 4)
- [ ] LinkedIn website + Featured (item 4)
- [ ] Add `hardikajmeriya.com` to the README of each of your four project repos
- [ ] One post on **dev.to** or **Hashnode**, with `canonical_url` pointing at your own domain

**Post about work you have already done.** Your commit history contains at
least three things other developers would link to:

- verifying Cloudflare Access JWTs instead of trusting the forgeable
  `Cf-Access-Authenticated-User-Email` header
- discovering that no major AI crawler executes JavaScript, and prerendering a
  React site because of it
- finding that a contact form with an auto-reply is an open email relay without
  a per-recipient rate limit

### 10. Sitelinks require more URLs — see the report

- [ ] Write one case study, published at `/work/cureneed`
- [ ] Tell me when the content exists and I will add the route, the internal
      links and a legitimate `BreadcrumbList` (which becomes valid the moment
      a hierarchy exists)

> Do **not** split the existing page into `/about`, `/contact`, `/tech` to chase sitelinks. That turns one decent page into five thin ones, and thin pages do not get sitelinks either.

---

## When the accounts exist

### 11. Add real profiles to `sameAs`

Only when the account **exists and links back to your site**:

- [ ] Add the URL to `PERSON.sameAs` in `app/src/data/seo.js`
- [ ] Run `node scripts/schema.test.mjs` — it fails on placeholders and non-https URLs

Worth having, roughly in order: **X/Twitter**, **Stack Overflow**, **dev.to**,
**Instagram** (if professional). A dormant account with no link back adds
nothing; leave it out until it is real.

### 12. Wikidata — the actual knowledge-panel path

A panel needs an entity Google's Knowledge Graph trusts. Wikidata is the most
common route, and it has a **notability requirement** you do not meet yet:
you need to be the subject of published sources you did not write.

Not something to attempt now. Revisit if you are ever interviewed, speak at a
conference, or your work is written about somewhere you do not control.

---

## Never do these

Listed because they are commonly recommended and would actively hurt you:

- ❌ **Directory-submission services / paid link packages.** Link schemes, manual action risk.
- ❌ **`sameAs` entries for accounts that do not exist.** A 404 in `sameAs` weakens the entity.
- ❌ **`aggregateRating` or `Review` markup with no real reviews.** One of the most-actioned structured-data violations.
- ❌ **`SearchAction` without a search endpoint.** Invalid; there is a test that fails if it is added.
- ❌ **Keyword-stuffed footer text** ("MERN developer Rajkot | React developer Gujarat | …"). Google has handled this since 2011.
- ❌ **Splitting the homepage into thin pages** for sitelinks.

---

## Quick status

| # | Task | Blocks | Effort |
| --- | --- | --- | --- |
| 1 | Search Console | everything | 15 min |
| 2 | Bing Webmaster | Copilot | 10 min |
| 3 | Rich Results Test | — | 5 min |
| 4 | Reciprocal profile links | `sameAs` credibility | 10 min |
| 5 | GitHub profile | entity consistency | 20 min |
| 6 | One email | entity consistency | 10 min |
| 7 | `alumniOf` | — | 5 min + my help |
| 8 | Business Profile | local search | 20 min + wait |
| 9 | First backlinks | ranking | ongoing |
| 10 | Case studies | sitelinks, long-tail | days |
