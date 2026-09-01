# Deploying to Cloudflare Workers

The site is a static Vite/React build served by a Cloudflare Worker using
[static assets](https://developers.cloudflare.com/workers/static-assets/).
Domain `hardikajmeriya.com` is already registered in the same Cloudflare account,
which makes the DNS step almost automatic.

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

## 4. Attach hardikajmeriya.com

In the Worker → **Settings → Domains & Routes → Add → Custom domain**:

- add `hardikajmeriya.com`
- add `www.hardikajmeriya.com`

Because the domain is registered in the same Cloudflare account, the DNS records
are created for you. No manual A or CNAME records, and no orange-cloud/SSL
mismatch to debug — that whole class of problem only applies when the origin is
somewhere else, like Vercel.

SSL is issued automatically and usually takes a few minutes.

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

## Configuration reference

`app/wrangler.jsonc`:

- `assets.directory: ./dist` — where Vite writes the build
- `assets.not_found_handling: single-page-application` — unknown paths serve
  `index.html` instead of a 404, so client-side anchors keep working
- `observability.enabled: true` — free request and error metrics in the
  dashboard, replacing what Vercel Speed Insights did

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
