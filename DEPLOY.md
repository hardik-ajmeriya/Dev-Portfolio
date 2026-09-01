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

The coming-soon page is plain HTML with no build step, so this takes a couple of
minutes.

```bash
cd coming-soon
npx wrangler login      # once, opens a browser to authorise
npx wrangler deploy
```

That gives you a `hardik-coming-soon.<subdomain>.workers.dev` URL. Open it and
check it looks right.

Then attach the real domain — in the Cloudflare dashboard:

**Compute → Workers & Pages → `hardik-coming-soon` → Settings → Domains & Routes
→ Add → Custom domain**

Add both:

- `hardikajmeriya.com`
- `www.hardikajmeriya.com`

DNS records are created automatically because the domain is registered in this
same account. SSL takes a few minutes, then `hardikajmeriya.com` is live.

To edit the page later, change `coming-soon/public/index.html` and run
`npx wrangler deploy` again.

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

Once the real site is live and stable, you can delete the `hardik-coming-soon`
Worker from the dashboard. The source stays in the repo if you ever want it
again (a maintenance page, for instance).

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
