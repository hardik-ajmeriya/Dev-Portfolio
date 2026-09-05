# SEO & AI search

Two goals:

1. Someone searches **"Hardik Ajmeriya"** → your site is the top result.
2. Someone asks **ChatGPT / Claude / Perplexity** for a developer who can build
   and deploy a web app → you get mentioned.

---

## The thing that was blocking both

The site was a client-rendered React SPA. The HTML served to any crawler was:

```html
<div id="root"></div>
```

**Zero words.** Everything appeared only after JavaScript ran.

Googlebot renders JavaScript, so it would eventually have seen the page — but
slower and less reliably than static HTML. **AI crawlers do not render
JavaScript at all.** As of 2026 that includes GPTBot, OAI-SearchBot,
ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot and Meta-ExternalAgent.
They fetch raw HTML and move on. An empty div gives them nothing to cite, so
you could never be recommended regardless of how good the content was.

### Fixed: build-time prerendering

`npm run build` now runs three steps:

```
vite build                                    → dist/       client bundle
vite build --ssr src/entry-server.jsx         → dist-ssr/   server bundle
node prerender.js                             → injects rendered HTML into dist/index.html
```

The result: **5,743 characters of real text** in the raw HTML, with a full
heading hierarchy — every project, service, technology and process step. The
build prints the figure each time, and fails loudly if the render produces
too little, so a regression can't slip through silently.

Visitors still get the identical interactive site; React hydrates the existing
markup instead of rebuilding it (`hydrateRoot` in `main.jsx`).

---

## What's in place

| Item | File | Purpose |
| --- | --- | --- |
| Prerendered HTML | `prerender.js` | Content visible without JS |
| Person / ProfilePage schema | `index.html` | States who you are and what you offer, machine-readably |
| Title + meta description | `index.html` | Leads with your name |
| Open Graph + Twitter cards | `index.html` | Link previews in WhatsApp, LinkedIn, Slack |
| Canonical URL | `index.html` | Prevents duplicate-content splits |
| `robots.txt` | `app/public/` | Explicitly allows every major AI crawler |
| `sitemap.xml` | `app/public/` | Points Google at the single page |
| `llms.txt` | `app/public/` | Plain-language summary for LLMs |

### On the structured data

`ProfilePage` → `Person` is the highest-value item for both goals. It carries
your name, job title, email, 24 `knowsAbout` topics and all 6 services as
`makesOffer` entries. Search engines and language models parse this directly
rather than inferring it from prose.

`sameAs` is what ties this domain to your other profiles, and it's the main
lever for ranking your own name.

### On llms.txt — honest expectations

`llms.txt` is included because it's cheap, but **do not expect much from it.**
Adoption sits around 10% of domains, and as of early 2026 no major AI company
has committed to reading it in production. One analysis of 500M AI bot visits
found only 408 requests for the file. The crawlers overwhelmingly just read
your HTML — which is why prerendering mattered far more than this file does.

---

## What YOU need to do

Code can't do these. They're also the highest-impact remaining items.

### 1. Fill in the placeholder profile URLs — do this first

`app/index.html` has two placeholders in the `sameAs` array:

```
https://www.linkedin.com/in/REPLACE-WITH-YOUR-LINKEDIN
https://x.com/REPLACE-WITH-YOUR-HANDLE
```

Replace with your real URLs, or delete the lines. **Leaving fake URLs in
structured data is worse than having none** — it points at pages that don't
exist and undermines the entity link you're trying to establish.

### 2. Link back from each profile

`sameAs` claims the connection; the link back confirms it. Both directions are
needed.

- **GitHub** → Settings → Profile → Website: `https://hardikajmeriya.com`.
  Also add it to your profile README. GitHub has very high domain authority, so
  this is the single strongest backlink available to you for free.
- **LinkedIn** → Contact info → Website. LinkedIn is usually the top result for
  a person's name, so this reinforces the association hard.
- **X / Instagram** → bio link.

Use the identical name spelling — "Hardik Ajmeriya" — everywhere. Search
engines resolve entities partly by consistency, and "Hardik A." on one profile
and "Hardik Ajmeriya" on another weakens the match.

### 3. Google Search Console

1. https://search.google.com/search-console → Add property → Domain →
   `hardikajmeriya.com`
2. Verification is a DNS TXT record. Because the domain is on Cloudflare, add
   it under **DNS → Records**; verification is usually near-instant.
3. Submit `https://hardikajmeriya.com/sitemap.xml`
4. Use **URL Inspection → Request Indexing** to skip the initial wait.

Also worth doing: [Bing Webmaster Tools](https://www.bing.com/webmasters). Bing
powers ChatGPT's web search, so it matters more than its market share suggests.

### 4. Remove the noindex at launch

The coming-soon page deliberately blocks all crawlers. When you switch the
domain to the real site, confirm:

```powershell
curl.exe -s https://hardikajmeriya.com/robots.txt
```

It should show the permissive robots.txt above, **not** `Disallow: /`. If you
skip this, everything in this document is wasted — the site will be invisible.

---

## Realistic expectations

**Your name:** you should rank #1 within a few weeks of indexing. There's
little competition for it and you'll have a matching domain, Person schema and
consistent profile links. This is the easy goal.

**Skill searches** ("MERN developer India", "freelance AWS developer") are
genuinely hard — you're competing with agencies and job boards that have spent
years on it. A new single-page portfolio will not rank for those, and anyone
promising otherwise is selling something.

**AI recommendations** are the newer, more winnable surface. Models cite sources
they can read and that state things plainly. You now have prerendered HTML,
explicit service descriptions and structured data, which is most of what's
needed. But models also weight corroboration — being mentioned in more than one
place. Which brings us to the thing that would help most:

> **Get CureNeed and DCPVAS deployed to real URLs.** Every project still shows
> "Live site — add URL". A working product at `cureneed.hardikajmeriya.com` is
> another indexable page, a real demonstration, and something an assistant can
> point to. It would do more for both goals than any further tag tuning.

---

## Maintenance

- Update `<lastmod>` in `sitemap.xml` after substantial content changes.
- Update `llms.txt` when you add a project or change services — it's prose,
  written for humans and models both.
- After each deploy, sanity-check the prerender actually ran:

  ```powershell
  curl.exe -s https://hardikajmeriya.com | findstr /C:"into production"
  ```

  If that returns nothing, the prerender step didn't run and you're back to
  serving an empty div.
