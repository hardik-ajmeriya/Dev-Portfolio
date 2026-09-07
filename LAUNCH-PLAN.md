# Launch plan — Tuesday 15 September 2026

**Target:** swap `hardikajmeriya.com` from the coming-soon sign to the real site.
**Today:** Monday 7 September. Eight days.

Tuesday is a sound choice. Tuesday–Thursday consistently outperform Monday and
Friday for B2B and developer audiences, and a mid-morning European post catches
the UK, EU and US East Coast in one window while India is still awake. Aim for
**14:00–15:00 IST**: that is 09:30 UK, 10:30 CET, 04:30 US Eastern — the post is
already sitting there when the US wakes up.

One caution about the date itself: do not let *when* become more important than
*what*. A Tuesday launch of a site whose four projects link nowhere converts
worse than a Thursday launch of one that has a live URL. The date is a rounding
error next to the two blockers below.

---

## The two blockers, restated

`node scripts/preflight.mjs` currently exits 1 on both:

```
FAIL  At least one project has a live URL        <- all 4 liveUrl fields empty
FAIL  Every project has at least one working link <- no link at all on: dcpvas
```

Everything else in the build already passes. These are content, not code, and
they are the whole reason I would not launch today.

---

## Week plan

### Mon 8 – Wed 10 · Deploy CureNeed

The single highest-value task of the week. One live URL turns *"I put
applications into production"* from an assertion into something a client can
click.

- Deploy it anywhere credible — Cloudflare Workers, Vercel, Render, Fly. It does
  not have to be on your infrastructure to count.
- Put the URL in `app/src/data/projects.js` → `liveUrl`.
- Also fix `browser: 'cureneed.app'` to the real hostname. A mockup address bar
  showing a domain that does not exist is a small dishonesty that costs nothing
  to remove.
- If it needs a backend and that is a week's work, deploy the **frontend only**
  with seeded data and label it *"front-end demo — backend runs locally"*.
  Honest and clickable beats absent.

### Thu 11 · GitHub, and the `dcpvas` card

**GitHub profile** — 20 minutes, and it is the second thing a client checks:

- Bio: currently *"Android & DevOps Enthusiast"*. It should describe the person
  the portfolio is selling.
- Pin the four portfolio repos. Right now none of them are pinned; the pins are
  `AndroidStudioWebApp`, `SQL-Pizza-Sales`, `Titanic-Data-Analysis`.
- Add `hardikajmeriya.com` to the profile website field.
- Fix the broken `mailto:hardik@example.com` in your profile README.

**`dcpvas`** has no `githubUrl` and no `liveUrl`, so its card has nothing to
click. Either push the repo and link it, or remove the project until it does.
A card a visitor cannot act on is worse than one fewer project.

**CureNeed credit** — the `MedCare` README lists two authors, you and Anshuman
Singh. Add *"built with Anshuman Singh"* to the card. Shared credit costs
nothing; being caught omitting it costs a great deal.

### Fri 12 · Email, end to end

This is the path an actual enquiry takes, and it has never been exercised in
production.

1. **Resend domain verified.** Resend → Domains → `hardikajmeriya.com` shows
   **Verified**. DNS records must be **DNS only** (grey cloud) — proxying breaks
   mail records.
2. **The secret is set:**
   ```bash
   cd app
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret list          # confirm it is there
   ```
3. **Apply the rate-limit migration to production:**
   ```bash
   npx wrangler d1 migrations apply hardik-enquiries --remote
   ```
   Not optional. Without the table the limiter logs an error and fails open on
   every request — safe, but you are unprotected.
4. **Send a real test submission** through `admin.hardikajmeriya.com` (still
   private) and confirm **all three**: the notification reaches your inbox, the
   auto-reply reaches the address you typed, and the row appears in `/admin`.

   Check the auto-reply is not in spam. If it is, the domain is not properly
   verified — fix that before launch, not after.

### The countdown

`hardikajmeriya.com` now shows a live countdown to **15 Sept, 14:00 IST**, in
each visitor's own timezone. Two things about it worth knowing:

- **If you move the date**, edit `TARGET` at the top of
  `coming-soon/public/countdown.js` and redeploy the coming-soon Worker.
  `scripts/preflight.mjs` fails if the target has gone stale.
- **If you slip past Tuesday**, it handles itself. For 24 hours it says
  "Launching — today"; after that the whole block hides and the page looks
  exactly as it did before. A timer frozen at 00:00:00 advertises a missed
  deadline to every visitor, so it removes itself rather than doing that.

Deploy it now so it is counting while people can still see it:

```bash
cd coming-soon && npx wrangler deploy
```

### Sat 13 – Sun 14 · Review, and one last pass

- Open `admin.hardikajmeriya.com` on your **phone**, on mobile data. Read the
  whole page as a stranger would.
- Read every word of copy aloud. Typos are invisible on screen and obvious out
  loud.
- Clear the seeded test data so you launch with a clean pipeline:
  ```bash
  npx wrangler d1 execute hardik-enquiries --remote \
    --command "DELETE FROM enquiries WHERE email LIKE '%@seed.test'"
  ```
- Update `app/public/sitemap.xml` → `<lastmod>2026-09-15</lastmod>`.
- **Account hardening**, which I have raised repeatedly and you have not
  confirmed: 2FA on Cloudflare, registrar lock, WHOIS privacy. That account now
  guards a database of client contact details, not just a website.

---

## Tuesday 15 · Launch runbook

Total time: about 15 minutes. Do it in this order.

### 1. Preflight — must exit 0

```bash
cd app && npm run build
cd .. && node scripts/preflight.mjs
```

If it prints blockers, stop. That is the script's entire purpose.

### 2. Full test suite

```bash
cd app/worker
node index.test.mjs && node admin.test.mjs && node rateLimit.test.mjs
cd ../.. && node coming-soon/countdown.test.mjs
node scripts/schema.test.mjs
node scripts/check-design-leak.mjs
```
Expect 15 + 47 + 14 + 18 + 25 = **119 passing**, and no design leaks.

### 3. Deploy the Worker

```bash
cd app && npm run deploy
```

Nothing is public yet — the apex still points at the coming-soon Worker.

### 4. Swap the domain

**Order matters.** A hostname can only be attached to one Worker, so removing
must come first. There is a gap of a few seconds where the domain resolves to
nothing.

1. `hardik-coming-soon` → Settings → Domains & Routes → **remove**
   `hardikajmeriya.com` **and** `www.hardikajmeriya.com`
2. `hardik-portfolio` → Settings → Domains & Routes → Add → Custom domain →
   **add both** hostnames

> **Add www as well, not just the apex.** The Worker 301-redirects
> `www.hardikajmeriya.com` to the apex, but only if the request reaches it. If
> www stays pointed at the deleted coming-soon Worker, anyone typing "www."
> gets an error page.

### 5. Verify, in a private window

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" https://hardikajmeriya.com/
# expect 200

curl.exe -s -o NUL -w "%{redirect_url}`n" https://www.hardikajmeriya.com/
# expect https://hardikajmeriya.com/

curl.exe -s -o NUL -w "%{http_code}`n" https://hardikajmeriya.com/no-such-page
# expect 404 — not 200

curl.exe -s -o NUL -w "%{http_code}`n" https://admin.hardikajmeriya.com/api/admin/enquiries
# expect 401 or 302 — the admin must NOT become public with the site
```

That last one matters most. The site going public must not take the client
database with it.

Then, in a browser: submit the contact form **for real**, from the live domain,
and confirm both emails arrive.

### 6. Search Console and Bing — same day

- Add `hardikajmeriya.com`, verify by **DNS**.
- Submit `https://hardikajmeriya.com/sitemap.xml`.
- **URL Inspection → Request indexing** on the homepage. This is what turns
  "eventually" into "within a day or two".
- Test the rich results: <https://search.google.com/test/rich-results>
  The graph is now 12 linked nodes — confirm Google reads the Person,
  ProfessionalService, FAQ, HowTo and the four project nodes.
- **Bing Webmaster Tools** too, ten minutes. `bingbot` is allowed in
  robots.txt, but allowing a crawler is not the same as telling it you exist,
  and Bing is what feeds Copilot.

See `SEO-AUDIT.md` for the full picture, `SEO_TODO.md` for the launch-day
checklist (Search Console, Bing, GitHub profile, one email address) and
`SEO_SCORE.md` for where each area stands.

### 7. Share — 14:00 IST

Add the website link to **LinkedIn, GitHub and X profiles first**. Those
profile links are the `sameAs` signal that ties the domain to your name, and
they matter more for ranking than the launch post itself.

Then post. LinkedIn is your strongest surface — it already ranks first for your
name. Lead with the CureNeed live URL, not with "I made a portfolio".

---

## Rollback

If something is badly wrong, reverse step 4: detach both hostnames from
`hardik-portfolio`, reattach to `hardik-coming-soon`. Back to the sign in under
two minutes. **Do not delete the coming-soon Worker until you have been live
for a week.**

---

## Deliberately not doing before launch

Real, but none of it should delay Tuesday:

- Self-hosting the 34 Devicon logos (removes a third-party origin)
- `InstancedMesh` for the 150 hero nodes (150 draw calls → 1)
- Stats rendering as `0` in the prerendered HTML
- A privacy policy page — **do this within a fortnight**, you are storing
  personal data in D1
- `inert` on collapsed FAQ panels

---

## The honest summary

The engineering is ready. It has been ready since the audit. What is not ready
is the evidence: a site that says *"most developers hand you a repository and
stop — I hand you a running application"*, followed by four projects that link
to no running application.

Deploy CureNeed. Fix the GitHub profile. Everything else on this page is
mechanical.
