<div align="center">

# Hardik Ajmeriya — Full-Stack Portfolio

A prerendered, single-page React portfolio with a Cloudflare Workers backend:
a validated contact form backed by D1 and Resend, a private admin panel for
enquiries, and SEO/AI-search structured data baked in at build time.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-Build-646cff?logo=vite&style=for-the-badge) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss&style=for-the-badge) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&style=for-the-badge) ![D1](https://img.shields.io/badge/Cloudflare-D1-f38020?logo=cloudflare&style=for-the-badge)

</div>

## Status

**Pre-launch.** `hardikajmeriya.com` currently serves a coming-soon holding
page (`coming-soon/`, a separate Worker); the real site (`app/`) is built and
deployable but not yet swapped onto the domain. See
[LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for what's still open.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | React 18 + Vite, single page (no router — anchor-scrolled sections) |
| Styling | Tailwind CSS, self-hosted fonts (`@fontsource`: Bricolage Grotesque, Inter, JetBrains Mono) |
| 3D | three.js (hero scene, skipped on mobile) |
| Forms | React Hook Form + Yup, both client- and server-side validated |
| Hosting | Cloudflare Workers (static assets + one Worker script), not Vercel/Netlify |
| Backend | Worker API route (`/api/enquiry`, `/admin`) — see below |
| Database | Cloudflare D1 (`hardik-enquiries`) — enquiries + rate-limit state |
| Email | Resend (owner notification + client auto-reply, both server-side) |
| Auth | Cloudflare Access, gating the whole `admin.hardikajmeriya.com` subdomain |
| SEO | SSR prerender (`entry-server.jsx` + `prerender.js`) so crawlers get full HTML; generated structured data (`scripts/build-schema.mjs`) |
| Tooling | npm scripts, ESLint, plain `node *.test.mjs` for tests (no test runner dependency) |

> Plain JavaScript (`.jsx`) throughout — not TypeScript, despite `typescript`
> appearing in devDependencies (editor tooling only).

## How the contact form actually works

The form doesn't call any third-party API directly from the browser. It posts
same-origin to `/api/enquiry`, which the Worker (`app/worker/index.js`)
handles:

1. Re-validates everything server-side (never trusts the client).
2. Checks a D1-backed rate limit (`worker/rateLimit.js`).
3. Writes the enquiry to D1.
4. Emails the notification to Hardik via Resend, then the client auto-reply —
   both server-side, so the Resend key never reaches the browser.

The admin panel (`worker/admin.js`, `worker/adminPage.js`) reads that D1 table
at `admin.hardikajmeriya.com/admin`: status tracking, private notes,
follow-up dates, search, CSV export. Full details in
[AUTOREPLY.md](AUTOREPLY.md) and [ADMIN.md](ADMIN.md).

## Project structure (key parts)

```
app/
  src/
    entry-server.jsx        # SSR entry, used only at build time by prerender.js
    pages/Home.jsx           # The single page
    components/sections/     # Hero, About, Work, Services, Tech, Process,
                              # Stats, Faq, Ticker, Contact
    components/form/         # Shared form controls used by Contact
    data/                    # projects, services, tech, faq, seo, contactOptions
  worker/
    index.js                 # POST /api/enquiry — validation, D1, Resend
    admin.js, adminPage.js   # Private enquiries dashboard
    access.js                 # Cloudflare Access verification
    rateLimit.js              # D1-backed rate limiting
    emails.js                 # Owner notification + client auto-reply bodies
  migrations/                # D1 schema migrations
  seeds/                     # Local D1 dev seed data
  public/                    # Static assets, copied verbatim into the build
coming-soon/                 # Separate Worker: the holding page live today
scripts/                     # build-schema, optimise-images, generate-icons,
                              # md-to-pdf, preflight (pre-launch checks)
assets-original/             # Full-size source images (gitignored, not deployed)
branding/                    # Brand masters (tracked — needed to regenerate favicons)
```

## Getting started

Two terminals — the form needs both running:

```bash
cd app
npm install

# terminal 1 — the Worker API on :8787
npm run dev:api

# terminal 2 — Vite with hot reload on :5173, proxies /api to the Worker
npm run dev
```

Visit `http://localhost:5173`. Submitting the form with only `npm run dev`
running returns Vite's HTML instead of JSON — that's the expected symptom of
forgetting terminal 1.

### Local database

```bash
cd app
npm run db:migrate:local   # apply migrations to local D1
npm run seed:local         # optional: sample enquiries for the admin panel
```

### Build for production

```bash
cd app
npm run build      # client build + SSR prerender
npm run preview    # serve dist/ locally for verification
```

## Environment / secrets

No `VITE_`-prefixed env vars are needed — nothing in the client bundle talks
to a third-party API directly. The Worker needs one secret:

```bash
cd app
npx wrangler secret put RESEND_API_KEY     # production
```

For local dev, copy `app/.dev.vars.example` to `app/.dev.vars` and fill in the
same key — that file is read by `wrangler dev`, is gitignored, and must never
be committed with a real value (`.dev.vars.example` stays blank on purpose).

## Testing

Each test file runs standalone with plain Node — no test runner dependency:

```bash
node app/worker/index.test.mjs
node app/worker/admin.test.mjs
node app/worker/rateLimit.test.mjs
node coming-soon/countdown.test.mjs
node scripts/schema.test.mjs
```

## Deployment

Cloudflare Workers, via `wrangler`. Full walkthrough — account hardening,
connecting the repo for auto-deploy on push, the coming-soon → real-site
domain swap — in [DEPLOY.md](DEPLOY.md).

```bash
cd app
npm run deploy      # build + wrangler deploy
```

## Further reading

- [AUTOREPLY.md](AUTOREPLY.md) — the contact form's Worker + Resend + D1 flow, failure modes, editing the email copy
- [ADMIN.md](ADMIN.md) — the private enquiries dashboard and Cloudflare Access setup
- [SECURITY.md](SECURITY.md) — what actually protects the site, and what to configure in the Cloudflare dashboard
- [SEO.md](SEO.md) — the prerender/structured-data approach for search and AI-search visibility
- [DEPLOY.md](DEPLOY.md) — the full deploy and domain-swap walkthrough
- [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) — current pre-launch blockers
