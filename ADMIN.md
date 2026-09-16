# Admin panel

A private dashboard at **`admin.hardikajmeriya.com/admin`** listing every
enquiry, with status tracking, private notes, follow-up dates, search and CSV
export.

Free: Cloudflare D1 for storage, Cloudflare Access for authentication.

## Which hostname does what

| Host | Serves | Public? |
| --- | --- | --- |
| `hardikajmeriya.com` | the coming-soon sign (a separate Worker) | yes |
| `admin.hardikajmeriya.com/admin` | the enquiries panel | no |
| `admin.hardikajmeriya.com/` | a private preview of the real site | no |

That second row is why the whole subdomain is locked, not just `/admin`. The
finished site is not launched yet, and an unlaunched design sitting on a
guessable subdomain is a leak — it can also be crawled and then compete with
the real domain for your own name once you do launch.

---

## How the "only me" part works

Three layers. The second is the one that actually guarantees it; the third
covers a mistake that is very easy to make in the dashboard.

**1. Cloudflare Access at the edge.** An unauthenticated request is stopped
before it reaches your code — no login page of yours to attack, no session
cookie to steal, no password to leak.

**2. The Worker verifies Access's signed token itself.** This is the part worth
understanding.

Access sets a `Cf-Access-Authenticated-User-Email` header after it
authenticates someone. It is tempting to just trust that header — but it is
only trustworthy *while Access is correctly configured on that hostname*,
because Access is what strips a client-supplied copy of it. If the policy were
missing, deleted, or applied to a path that didn't cover the request, the
header would be attacker-controlled and this would dump your entire client
list:

```bash
curl -H "cf-access-authenticated-user-email: hardikpt95@gmail.com" \
  https://hardikajmeriya.com/api/admin/enquiries
```

So the Worker ignores that header entirely. It reads the **signed JWT**
(`Cf-Access-Jwt-Assertion`, or the `CF_Authorization` cookie) and verifies:

- the RS256 signature, against Cloudflare's published keys for your team
- `aud` matches **this** Access application — without it, a token minted for
  any other app in your Cloudflare team would be accepted
- `iss` is your team domain
- `exp` has not passed
- the algorithm is RS256, so an `alg: "none"` downgrade is refused
- the verified email equals `ADMIN_EMAIL`

A forged token fails the signature check regardless of what any dashboard
setting says. **Security by cryptography rather than by configuration.**

It **fails closed**: if `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD` are missing, every
admin request is denied. There is no fallback to the header.

**3. The Worker gates every path on a non-public hostname.** `PUBLIC_HOST` in
`wrangler.jsonc` names the one host the site may be served on openly. On any
other host the Worker answers — `admin.hardikajmeriya.com`, or a `*.workers.dev`
URL if that subdomain is ever switched on — *every* request needs a verified
Access token, not just `/admin`.

This exists because of a specific, silent failure: an Access application
scoped to the **path** `admin` protects the panel perfectly while leaving the
site root on that subdomain completely open. Signing in works, the panel looks
locked, and the unreleased design is public the whole time. The symptom only
shows up if you open the bare subdomain in a private window.

Responses on those hosts also carry `X-Robots-Tag: noindex, nofollow`, so a
preview can never be indexed even if the gate is later loosened.

Writing auth yourself instead would mean password hashing, session management,
CSRF protection, brute-force limits and timing-safe comparison — five chances
to get it subtly wrong, in the one place where wrong means leaking client data.

---

## One-time setup

### 1. Create the database

```bash
cd app
npx wrangler d1 create hardik-enquiries
```

It prints a `database_id`. Paste it into `wrangler.jsonc`, replacing
`REPLACE_WITH_YOUR_D1_DATABASE_ID`.

### 2. Create the table

```bash
npx wrangler d1 migrations apply hardik-enquiries --local    # for dev
npx wrangler d1 migrations apply hardik-enquiries --remote   # for production
```

### 3. Turn on Cloudflare Access

In the dashboard: **Zero Trust → Access → Applications → Add an application →
Self-hosted**

| Field | Value |
| --- | --- |
| Application name | `Portfolio admin` |
| Session duration | 24 hours (or 1 week if you prefer) |
| Subdomain | `admin` |
| Domain | `hardikajmeriya.com` |
| Path | **leave empty** |

Then add a policy:

- Action: **Allow**
- Rule: **Emails** → `hardikpt95@gmail.com`

Login method: Google, or the built-in one-time PIN, which emails you a code and
needs no identity provider setup at all.

> **Leave the path empty on purpose.** Typing `admin` there protects
> `/admin` and nothing else — the panel is locked, `/api/admin` is reachable
> directly, and the whole unreleased site is served from the subdomain root to
> anyone at all. An empty path covers the entire hostname, which is what you
> want, and it means one application instead of two.
>
> The Worker refuses to serve that subdomain without a token regardless, so
> getting this wrong now fails visibly (a 401) rather than silently.

### 4. Copy the two Access values into wrangler.jsonc

This is what makes the Worker able to verify tokens itself. Both are in
`wrangler.jsonc` under `vars`, and both are currently placeholders:

| Variable | Where to find it |
| --- | --- |
| `ACCESS_TEAM_DOMAIN` | Zero Trust → Settings → Custom Pages. Looks like `yourteam.cloudflareaccess.com` |
| `ACCESS_AUD` | The Access application → Overview → **Application Audience (AUD) Tag** |

Use the AUD tag from the **`/admin` application**. Neither value is a secret;
both belong in git.

**Until you set these, the admin panel denies every request** — including
yours. That is deliberate: it fails closed rather than falling back to a
forgeable header.

### 5. Deploy

```bash
npm run deploy
```

### 6. Verify it is actually locked

Do not skip this. Run it from a terminal, signed out:

```powershell
# 1. No credentials at all -> must be 401
curl.exe -s -o NUL -w "%{http_code}`n" https://admin.hardikajmeriya.com/api/admin/enquiries

# 2. The forged header -> must ALSO be 401, not 200
curl.exe -s -o NUL -w "%{http_code}`n" `
  -H "cf-access-authenticated-user-email: hardikpt95@gmail.com" `
  https://admin.hardikajmeriya.com/api/admin/enquiries

# 3. The panel itself -> 401 or an Access login redirect, never the page
curl.exe -s -o NUL -w "%{http_code}`n" https://admin.hardikajmeriya.com/admin

# 4. The subdomain ROOT -> must NOT return the site
curl.exe -s -o NUL -w "%{http_code}`n" https://admin.hardikajmeriya.com/
```

**If check 2 returns 200, stop.** That would mean the JWT verification is not
running, and your client data is public.

**If check 4 returns 200 with the site**, the Access application is scoped to a
path instead of the whole host — see step 3. The Worker gate should make this
impossible, but check it anyway; that is what the check is for.

Then open `admin.hardikajmeriya.com/admin` **in a private window**, sign in
through Access, and confirm you can see the panel. A private window matters: a
normal one may still hold a valid Access session and show you the panel whether
or not the policy is working.

---

## Running it locally

Cloudflare Access does not exist in `wrangler dev`, so the Worker has a
dev-only bypass. It requires **two** conditions, neither of which can be true
in production:

1. the request hostname is `localhost` or `127.0.0.1`
2. `DEV_ADMIN_EMAIL` is set — and that only lives in `.dev.vars`, which is
   gitignored and never uploaded by `wrangler deploy`

So even if the variable somehow reached production, the hostname check still
refuses. There is deliberately **no commented-out auth check** to forget.

### Setup

Add to `app/.dev.vars`:

```
RESEND_API_KEY=your-resend-key
DEV_ADMIN_EMAIL=hardikpt95@gmail.com
```

Apply the migration to the local database:

```bash
npx wrangler d1 migrations apply hardik-enquiries --local
```

### Run

```bash
# terminal 1
cd app && npm run dev:api

# terminal 2
cd app && npm run dev
```

Then open **http://localhost:5173/admin** — Vite proxies both `/api` and
`/admin` to the Worker, so the panel and the site share one URL and one port.

You can also go straight to `http://127.0.0.1:8787/admin`.

The local panel shows an amber **LOCAL DEV** banner across the top, because a
page full of client data that looks identical in both environments is a
mistake waiting to happen. Production never renders it — there is a test
asserting exactly that.

### Getting data to look at

The local database starts empty. Either submit the contact form at
`localhost:5173`, or seed ten realistic enquiries:

```bash
npm run seed:local     # insert the dummy set
npm run seed:clear     # remove it again
```

The seed is **idempotent** — running it twice does not duplicate rows, because
it deletes anything at `@seed.test` first. Every seeded address uses that
domain, so clearing is unambiguous and nothing real is ever caught by it.

The rows are chosen to exercise every state the panel can show:

| Covers | Row |
| --- | --- |
| All five statuses | 4 new, 2 replied, 1 won, 1 lost, 2 archived |
| Overdue follow-up (amber flag) | Anjali Mehta |
| Future follow-up | Daniel Okafor, Marcus Bell, Rebecca Lin |
| No company (em-dash fallback) | Sofia Rinaldi, Tom Whitfield |
| Long Markdown brief (drawer scroll) | Rebecca Lin, 715 chars |
| Dates spanning a month (sorting) | 2 hours ago → 30 days ago |

Two rows are deliberately hostile, so the guards can be checked by looking
rather than by trusting a test:

- **`<script>alert(1)</script> Ravi`** — the panel must show this as literal
  text. If a dialog ever appears, escaping has broken.
- **`=cmd|'/c calc'!A1`** — export the CSV and open it. The cell must read as
  text, not evaluate as a formula.

> Seeds live in `seeds/`, **not** `migrations/`. Anything in `migrations/` runs
> against production on the next `--remote` apply, and fake client records in
> your real pipeline would be genuinely confusing to debug. Both npm scripts
> hardcode `--local` for the same reason.

Local and production databases are entirely separate — nothing here touches
real enquiries.

---

## What the panel does

- **List** every enquiry, newest first, with status and follow-up flags
- **Filter** by status: new, replied, won, lost, archived — with live counts
- **Search** across name, email, company and the brief
- **Detail view**: full brief, project type, budget, timeline, country
- **Status** tracking through your pipeline
- **Private notes** per enquiry (never sent to the client)
- **Follow-up date**, with overdue ones flagged in the list
- **Reply by email** straight from the panel
- **CSV export** of everything
- **Delete**, for genuine erasure requests

---

## Data protection — read this bit

You are now **storing personal data**, not just receiving emails. That changes
your obligations.

**What is stored:** name, email, company, project details, the brief, country
code and user agent.

**Three things to do:**

1. **Add it to your privacy page.** Say what you collect, why, that it is stored
   on Cloudflare D1, and how someone asks for deletion. The Delete button exists
   precisely so you can honour that request.
2. **Decide a retention period.** "Enquiries are deleted after 24 months" is
   reasonable. Indefinite retention is hard to justify.
3. **Keep 2FA on your Cloudflare account.** It now guards a database of client
   contact details, not just a website.

The country code and user agent are stored to help spot abuse. If you would
rather not hold them, drop those two columns from the migration — nothing in the
panel depends on them.

---

## Tests

```bash
cd app/worker
node admin.test.mjs
```

13 tests. The first four are the ones that matter — they assert that an
unauthenticated request gets 401, a *different* authenticated user gets 403, and
that neither response leaks any data. There is also a test that a database
failure still lets the enquiry email through, because losing a lead would be
worse than losing a row.

---

## Things worth knowing

**The panel is not in the React bundle.** It is a single HTML document the
Worker returns. That keeps a private tool's markup and logic out of the public
build entirely, and means it cannot be reached without passing the Access check.

**CSV export neutralises formula injection.** A field beginning `=`, `+`, `-` or
`@` is prefixed with an apostrophe, so a malicious submission cannot become an
executable formula when you open the file in Excel.

**D1 free tier:** 5GB storage and 5 million row reads per day. A portfolio will
not approach it.
