# Launch checklist — portfolio → Cloudflare Workers

Checked on **16 September 2026** by running the real build, the real preflight and
every test suite in this repo against the current working tree (9 projects, the five
new live ones included).

What "verified" means below: the build was run, the script was run, the output was
read. Items marked **you must do this** are the ones a script cannot check —
anything that depends on your Cloudflare account, the live DNS, or a browser.

---

## A · Blockers — do not swap the domain until these are clear

- [ ] **1. The `dcpvas` card has no link at all.**
  In `app/src/data/projects.js`, `dcpvas` has `githubUrl: ''` and `liveUrl: ''`.
  Every other card renders at least one button; this one renders none, so it reads
  as a claim with nothing behind it. `scripts/preflight.mjs` treats it as a blocker
  and it is the last one standing.
  Fix by either pushing the repo and filling in `githubUrl`, or dropping the entry
  until it has somewhere to point.

- [ ] **2. The coming-soon countdown contradicts its own page.**
  - `coming-soon/public/index.html` line 89 tells visitors **12:00 IST**
  - `coming-soon/public/countdown.js` line 25 counts to `Date.UTC(2026, 8, 16, 7, 30)` = **13:00 IST**
  - `coming-soon/countdown.test.mjs` expects **12:00 IST** — 6 of its 18 tests fail because of this
  - `LAUNCH-PLAN.md` says **11:00 IST**, which is a third answer

  Pick one time, then make all four agree. Note that the test that looks like it
  guards this — *"the baked-in target really is 12:00 IST"* — asserts against the
  test file's own constant, not against `countdown.js`, so it passes while the
  mismatch sits there. Worth fixing that test too, or it will hide the same bug again.

- [ ] **3. The contact form has no working email provider.**
  `app/worker/index.js` sends both the owner notification and the client auto-reply
  through Resend, and there is no Web3Forms code left anywhere in the repo — only a
  comment mentioning it. Without `RESEND_API_KEY` the form returns
  *"The form is misconfigured. Please email me directly."*

  Worse, the key check at line 309 runs **before** `saveEnquiry` at line 324, so a
  missing key means the enquiry is not even written to D1 — it is lost, and nothing
  shows up in `/admin`. That is true of any future key problem too, not just this one.

  Web3Forms cannot be dropped in server-side as a substitute: its API is client-side
  only, server-to-server returns 403, and enabling it needs a paid plan plus an IP
  safelist — which a Cloudflare Worker cannot satisfy because it has no stable
  outbound IP. That is exactly why this repo moved to Resend in the first place.

  Regardless of which provider you land on, move `saveEnquiry` above the key check so
  a provider failure can never silently discard an enquiry.

---

## B · Worth doing before you deploy

- [ ] **4. Remove the dead Web3Forms config.**
  The repo-root `.env` still holds `VITE_WEB3FORMS_ACCESS_KEY`, but nothing reads it —
  there is no `import.meta.env.VITE_WEB3FORMS` anywhere in `app/src`. It is gitignored
  so nothing leaked, but it will confuse you in six months.

- [ ] **5. Bump the sitemap `lastmod`.**
  `app/public/sitemap.xml` still says `2026-09-07`. Five projects were added today,
  so the homepage entry is stale. Change both `<lastmod>` values to `2026-09-16`.

- [ ] **6. Decide about the three.js payload.**
  The hero canvas ships `three.module-*.js` at **684 KB raw / 176 KB gzipped** — the
  single largest thing on the site, and Vite warns about it on every build. Not a
  launch blocker and not a mistake, but if you ever want a faster first paint, a
  dynamic `import()` for the hero canvas is where the win is.

- [ ] **7. `DEPLOY.md` §6 says "the real site has no robots.txt".**
  It does — `app/public/robots.txt` exists and is good. The sentence is stale and
  will mislead you later. One-line doc fix.

---

## C · Verified green — no action needed

Build and code:

- [x] `npm ci && npm run build` completes: Vite client build, SSR build, prerender
- [x] `npm run lint` — clean, zero warnings
- [x] `scripts/schema.test.mjs` — **27 passed, 0 failed** (this was failing before the
      rebuild only because `dist/` was stale from 5 September)
- [x] `app/worker/index.test.mjs`, `admin.test.mjs`, `rateLimit.test.mjs` — all pass
- [x] Prerender emits 18 linked structured-data nodes, including a node for all 9 projects
- [x] Deploy payload **2.5 MB**, under the 5 MB check
- [x] `app/public/images` is 788 KB total — no unreferenced images in the deploy

The five new projects specifically:

- [x] All 5 appear in the prerendered HTML (so crawlers and AI bots see them without JS)
- [x] All 5 live URLs are in the built output and point at the right Vercel deployments
- [x] All 5 screenshots resolve to real files at the right 3:2 ratio
- [x] Every project has at least one image, so the tilt-frame component cannot crash

Configuration:

- [x] `app/wrangler.jsonc` — D1 binding `DB` present with a real `database_id`, and
      `migrations_dir` points at `app/migrations`, where both migrations exist
- [x] `run_worker_first` covers `/api/*`, `/admin` and `/admin/*` — the Worker runs
      before the static asset layer on those paths
- [x] `not_found_handling: "404-page"` — unknown URLs return a real 404, not a soft one
- [x] `PUBLIC_HOST` is set, so every host that is not the apex is gated behind Access
- [x] `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` both set — the admin panel fails closed
- [x] `RESEND_API_KEY` is not in the repo; `.dev.vars` is gitignored and `.env` is too

Security and SEO:

- [x] CSP is strict — `default-src 'none'`, no `unsafe-inline` on `script-src`,
      `frame-ancestors 'none'`, `base-uri 'none'`
- [x] HSTS with preload, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy,
      Permissions-Policy all present in `_headers`
- [x] Cache headers are correct per path — immutable for fingerprinted assets,
      revalidate for HTML, `no-store` for the 404 page
- [x] `robots.txt` allows everything including the named AI crawlers, and points at
      the sitemap
- [x] Canonical points at the apex; no stray `noindex` in the built HTML
- [x] No secrets anywhere in the build output

---

## D · Deployment — the actual steps

Run everything from the repo root unless a step says otherwise.

### 1. Build and prove it

```powershell
cd app
npm run build
cd ..
node scripts/preflight.mjs
```

`preflight.mjs` must print **0 blockers**. It will keep failing on `dcpvas` until you
clear item 1 above. Also run the tests, since `npm run deploy` does not:

```powershell
node scripts/schema.test.mjs
node --test app/worker/
```

### 2. Apply the D1 migration to the real database

Local migrations do not touch production. This is the step that is easy to skip and
only discovered when the admin panel is empty and the contact form 500s:

```powershell
cd app
npx wrangler d1 migrations apply hardik-enquiries --remote
```

### 3. Set the Resend secret — once per Worker, not per deploy

```powershell
cd app
npx wrangler secret put RESEND_API_KEY
```

Paste the key at the prompt. It is never written to a file and never appears in git.
If you have already done this for `hardik-portfolio`, skip it — re-running just
overwrites it with the same value.

### 4. Deploy the Worker

```powershell
cd app
npm run deploy
```

That is `npm run build && wrangler deploy`. It publishes to your `workers.dev`
subdomain, **not** to your domain yet — the domain still belongs to the coming-soon
Worker at this point.

### 5. Test it on the workers.dev URL first

Open the `*.workers.dev` URL wrangler prints. Because `PUBLIC_HOST` is the apex only,
that hostname counts as a private preview and Cloudflare Access will ask you to log
in — that is the gate working correctly, not a fault. Log in and check the Work
section, the five live links, and submit the contact form once to confirm the email
actually arrives.

### 6. Swap the domain

Order matters — a hostname can only be attached to one Worker at a time, so removing
comes first. There are a few seconds where the domain resolves to nothing.

1. Cloudflare dashboard → Workers → **`hardik-coming-soon`** → Settings →
   Domains & Routes → remove **`hardikajmeriya.com`** and **`www.hardikajmeriya.com`**
2. Workers → **`hardik-portfolio`** → Settings → Domains & Routes → Add → Custom
   domain → add **both** hostnames

Add `www` as well as the apex. The Worker 301-redirects www to the apex, but only for
requests that reach it — and if www is missing, it falls into the private-preview
branch and shows visitors an Access login screen instead of your site.

### 7. Verify in a private window

```powershell
curl -I https://hardikajmeriya.com/                    # expect 200
curl -I https://www.hardikajmeriya.com/                # expect 301 to the apex
curl -I https://hardikajmeriya.com/no-such-page        # expect 404, not 200
curl -I https://hardikajmeriya.com/admin               # expect 401 or 302, never 200
curl -I https://hardikajmeriya.com/resume              # expect 200, application/pdf
```

The `/admin` one is the check that matters most. If it returns 200 to a logged-out
browser, stop and fix Access before telling anyone the site is live.

Then, in a real private window: load the site, click all five live project links,
send one contact-form enquiry, and confirm both the notification and the auto-reply
land.

### 8. Same day

- Submit the sitemap in Google Search Console and Bing Webmaster Tools
- Once the site is stable, delete the `hardik-coming-soon` Worker from the dashboard
  (the source stays in the repo if you ever want a maintenance page)

---

## E · Rollback

If something is badly wrong after the swap, reverse step 6 — detach both hostnames
from `hardik-portfolio` and reattach them to `hardik-coming-soon`. That is a dashboard
action and takes under a minute. For a bad deploy rather than a bad config, Workers
keeps previous versions: Workers → `hardik-portfolio` → Deployments → roll back.
