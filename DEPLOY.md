# Deploying to Cloudflare Workers

The site is a static Vite/React build served by a Cloudflare Worker using
[static assets](https://developers.cloudflare.com/workers/static-assets/).
Domain `hardikajmeriya.com` is already registered in the same Cloudflare account,
which makes the DNS step almost automatic.

There are **two Workers** in this repo, on purpose:

| Worker | Source | Purpose |
| --- | --- | --- |
| `hardik-coming-soon` | `coming-soon/` | Live on the domain now |
| `hardik-portfolio` | `app/` | The real site, deployed when ready |

Keeping them separate means the unreleased site is never served or bundled
anywhere public. Part 0 puts the coming-soon page live today; parts 1–4 cover
the real site; part 6 is the swap.

---

## 0. Put the coming-soon page live (do this first)

Static HTML, no build step. Roughly five minutes end to end.

### 0a. Secure the account before you deploy anything

Do these once. They protect the domain itself, which matters more than the page
on it — losing control of the domain is the one mistake that is genuinely hard
to undo.

1. **Two-factor auth on Cloudflare.** My Profile → Authentication → 2FA. Your
   Cloudflare account now controls both the domain and the hosting; if it is
   protected only by a password, that is the single point of failure.
2. **Registrar lock.** Domains → `hardikajmeriya.com` → Configuration → confirm
   the lock is on. Blocks unauthorised transfers away from your account.
3. **WHOIS privacy.** Same page. Cloudflare redacts it free — without it, your
   home address and phone number are in a public database that spammers scrape.

### 0b. Authorise the CLI

```bash
cd coming-soon
npx wrangler login     # opens a browser, OAuth — no key stored in the repo
```

`wrangler login` uses short-lived OAuth credentials stored outside the project.
Do **not** put a Cloudflare API token in `.env` or anywhere in the repo. If you
later automate deploys from CI, create a **scoped** API token with only
`Workers Scripts: Edit`, never the Global API Key, which can do anything to
every zone on your account.

### 0c. Deploy

```bash
npx wrangler deploy
```

You get a `hardik-coming-soon.<subdomain>.workers.dev` URL. Open it and check
the sign swings and the fonts load.

### 0d. Attach the domain

**Compute → Workers & Pages → `hardik-coming-soon` → Settings → Domains & Routes
→ Add → Custom domain**

Add both:

- `hardikajmeriya.com`
- `www.hardikajmeriya.com`

DNS records are created automatically because the domain is registered in this
same account. Certificates are issued within a few minutes.

### 0e. Turn on the zone-level TLS settings

Under **SSL/TLS** for the domain:

- **Overview → Full (strict)**
- **Edge Certificates → Always Use HTTPS: On**
- **Edge Certificates → Minimum TLS Version: 1.2**

### 0f. Verify it actually shipped hardened

```bash
curl -sI https://hardikajmeriya.com | grep -Ei 'strict-transport|content-security|x-frame|x-content-type|referrer|permissions|robots'
```

You should see the HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy` and `X-Robots-Tag` lines. If they are
missing, the `_headers` file did not deploy — confirm it sits in
`coming-soon/public/`.

Also confirm the config file is not public — this must return **404**:

```bash
curl -so /dev/null -w '%{http_code}\n' https://hardikajmeriya.com/_headers
```

To edit the page later: change the files in `coming-soon/public/` and run
`npx wrangler deploy` again.

---

## What is actually deployed, and why it is safe

The page is five static files. There is no server, no database, no form, no
user input and no cookies — which removes most of the attack surface a site
normally has. What remains is handled in `coming-soon/public/_headers`:

| Header | What it stops |
| --- | --- |
| `Content-Security-Policy` | Injected scripts. Strict: `default-src 'none'`, no `unsafe-inline` anywhere |
| `Strict-Transport-Security` | Downgrade to HTTP for two years |
| `X-Frame-Options: DENY` | Clickjacking via iframe |
| `X-Content-Type-Options` | MIME-type sniffing |
| `Referrer-Policy` | Leaking your URLs to third parties |
| `Permissions-Policy` | Access to camera, mic, geolocation, etc. |
| `Cross-Origin-*-Policy` | Cross-origin side-channel reads |

The CSP is strict — `unsafe-inline` appears nowhere — because the page's CSS and
JS live in `styles.css` and `sign.js` rather than inline in the HTML. If you add
an inline `<style>` block or an `onclick=` attribute later, **it will be blocked
and silently stop working**. Put new CSS in `styles.css` and new JS in `sign.js`.

`_headers` is parsed by Workers and is never served, so its contents are not
public. Verify with the 404 check in step 0f.

The page is set to `noindex` in both `robots.txt` and a meta tag, so Google's
first indexed impression of the domain is the real site rather than a
placeholder. **Delete `robots.txt` and remove the robots meta tag at launch**, or
your finished site will stay invisible in search.

---

## 1. Install and test locally

```bash
cd app
npm install
npm run dev
```

`npm install` picks up the changes: `three` was added, and
`@vercel/speed-insights`, `framer-motion`, `lucide-react` and `react-router-dom`
were removed (nothing imports them any more).

Before deploying, confirm the production build works:

```bash
npm run build
npm run preview
```

---

## 2. Environment variable

The contact form posts to Web3Forms and needs its access key.

Locally, `app/.env` already contains:

```
VITE_WEB3FORMS_ACCESS_KEY=<your key>
```

**This is a build-time variable.** Vite bakes it into the bundle at build time,
so it must be set in Cloudflare too, or the contact form silently fails in
production. Step 3 covers where to add it.

> Note: any `VITE_`-prefixed variable ends up visible in the shipped JavaScript.
> That is expected and fine for a Web3Forms public access key — it is designed to
> be public. Never put a real secret behind a `VITE_` prefix.

---

## 3. Connect the repo (automatic deploys)

1. Push the branch and merge it:

   ```bash
   git push -u origin redesign
   # open a PR on GitHub, review the diff, merge into main
   ```

2. In the Cloudflare dashboard: **Compute → Workers & Pages → Create → Workers →
   Import a repository**.

3. Authorise GitHub and pick `Hardik_Dev_Portfolio`.

4. Set the build configuration:

   | Field | Value |
   | --- | --- |
   | Project name | `hardik-portfolio` |
   | Production branch | `main` |
   | Root directory | `app` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |

   The **root directory must be `app`** — the Vite project lives in a subfolder,
   not at the repo root. This is the most common thing to get wrong here.

5. Under **Variables and Secrets**, add:

   | Name | Value |
   | --- | --- |
   | `VITE_WEB3FORMS_ACCESS_KEY` | your Web3Forms key |

6. Save and deploy. You get a `hardik-portfolio.<subdomain>.workers.dev` URL.
   Check it before attaching the real domain.

From here, every push to `main` deploys automatically, and pull requests get
their own preview URLs.

---

## 4. Test the real site on its workers.dev URL

Don't attach the domain yet. Open the `hardik-portfolio.<subdomain>.workers.dev`
URL that the deploy produced and check:

- the 3D hero scene loads on desktop, and is skipped on mobile
- project screenshots appear
- the technology filter tabs work
- **the contact form actually sends** — submit a real test message and confirm it
  arrives in your inbox. This is the one that fails silently if
  `VITE_WEB3FORMS_ACCESS_KEY` was not set in step 3.

---

## 5. Manual deploys (optional)

Git deploys are the main path, but the CLI is configured too:

```bash
cd app
npm run cf:login     # once, opens a browser to authorise
npm run deploy       # builds and deploys immediately
npm run cf:tail      # live request logs
```

---

## 6. Launch — swap the domain to the real site

Once the real site checks out on its workers.dev URL:

1. **Detach** the domain from the coming-soon Worker:
   `hardik-coming-soon` → Settings → Domains & Routes → remove
   `hardikajmeriya.com` and `www.hardikajmeriya.com`.

2. **Attach** it to the real one:
   `hardik-portfolio` → Settings → Domains & Routes → Add → Custom domain →
   add both hostnames.

Do it in that order. A hostname can only be attached to one Worker at a time, so
adding before removing will just error. There is a brief gap between the two
steps where the domain does not resolve to anything — it is seconds, and no one
is watching yet.

3. **Undo the noindex.** The coming-soon page deliberately blocks search
   engines. Once the real site is on the domain, make sure it is *not* carrying
   those rules — the real site has no `robots.txt` and no robots meta tag, so
   this is automatic when you swap Workers. But if you ever copy files across,
   check for it.

Once the real site is live and stable, you can delete the `hardik-coming-soon`
Worker from the dashboard. The source stays in the repo if you ever want it
again (a maintenance page, for instance).

Consider carrying the `_headers` file across to `app/public/` too, so the real
site ships the same protections. It will need a looser CSP — the real site loads
Devicon logos from `cdn.jsdelivr.net` and posts the contact form to
`api.web3forms.com`, so `img-src` and `connect-src` must allow those. Ask me and
I will write it.

---

## Configuration reference

`app/wrangler.jsonc` (the real site):

- `assets.directory: ./dist` — where Vite writes the build
- `assets.not_found_handling: single-page-application` — unknown paths serve
  `index.html` instead of a 404, so client-side anchors keep working
- `observability.enabled: true` — free request and error metrics in the
  dashboard, replacing what Vercel Speed Insights did

`coming-soon/wrangler.jsonc` (the temporary page):

- `assets.directory: ./public` — note this is a subfolder, not `.`, so that
  `wrangler.jsonc` itself is never served as a public file
- no build step; `wrangler deploy` uploads the folder as-is

---

## Rolling back

In the dashboard: **Worker → Deployments → ⋯ → Rollback** on any previous
version. Cloudflare keeps the history, so a bad deploy is a two-click fix.

---

## Still to do

The site is built and deployable, but two things still limit how it reads to a
client:

1. **No live project URLs.** Every project in `app/src/data/projects.js` has
   `liveUrl: ''`, which renders a greyed-out "Live site — add URL" slot. Deploying
   CureNeed and DCPVAS — subdomains like `cureneed.hardikajmeriya.com` work well
   now that you own the domain — and filling in those fields is the single highest
   value change left.

2. **Projects read as learning work, not client work.** A prospect scanning the
   page asks "has he built this for someone like me". One real paid project, or a
   named testimonial, changes that answer.
