# Admin panel

A private dashboard at **`hardikajmeriya.com/admin`** listing every enquiry,
with status tracking, private notes, follow-up dates, search and CSV export.

Free: Cloudflare D1 for storage, Cloudflare Access for authentication.

---

## How the "only me" part works

**Cloudflare Access sits in front of the Worker.** An unauthenticated request
is stopped at Cloudflare's edge and never reaches your code — there is no login
page of yours to attack, no session cookie to steal, no password to leak.

Once Access has verified you, it injects a header
(`Cf-Access-Authenticated-User-Email`) that cannot be forged from outside,
because Access terminates the request first and strips any client-supplied copy.

The Worker then checks that header against `ADMIN_EMAIL` in `wrangler.jsonc`.
That is **defence in depth**: if the Access policy were ever deleted or widened
by mistake, the panel would still refuse to serve data rather than quietly
exposing every client's contact details.

Writing this yourself would mean password hashing, session management, CSRF
protection, brute-force limits and timing-safe comparison — five chances to get
it subtly wrong, in the one place where wrong means leaking client data.

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
| Domain | `hardikajmeriya.com` |
| Path | `admin` |

Add a **second application** for the API, otherwise the panel loads but every
request it makes is public:

| Field | Value |
| --- | --- |
| Application name | `Portfolio admin API` |
| Domain | `hardikajmeriya.com` |
| Path | `api/admin` |

Then add a policy to each:

- Action: **Allow**
- Rule: **Emails** → `hardikpt95@gmail.com`

Login method: Google, or the built-in one-time PIN, which emails you a code and
needs no identity provider setup at all.

> **Both applications matter.** Protecting only `/admin` leaves
> `/api/admin/enquiries` reachable by anyone who guesses the URL. The Worker's
> own `ADMIN_EMAIL` check would still block it, but you do not want that to be
> the only thing standing between the internet and your client list.

### 4. Deploy

```bash
npm run deploy
```

Visit `hardikajmeriya.com/admin`, sign in, and you are in.

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

The local D1 database starts empty. Submit the contact form at
`localhost:5173` a few times and the rows will appear in the panel.

To seed a few directly:

```bash
npx wrangler d1 execute hardik-enquiries --local --command "INSERT INTO enquiries (name,email,company,project_type,budget,timeline,message) VALUES ('Priya Sharma','priya@northwind.example','Northwind Logistics','SaaS product','\$3,000 – \$5,000','Within 1 month','We track deliveries in spreadsheets and need a multi-tenant dashboard for dispatch and drivers.')"
```

Local and production databases are entirely separate — nothing you do here
touches real enquiries.

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
