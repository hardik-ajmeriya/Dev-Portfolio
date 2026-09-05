# Client auto-reply

When someone submits the contact form they now receive a branded thank-you
email, and you receive the enquiry notification. Both are sent by a Cloudflare
Worker on your own domain — no monthly cost.

```
Browser  ──POST /api/enquiry──▶  Worker (app/worker/index.js)
                                    ├─▶ Resend  → notification to you
                                    └─▶ Resend  → thank-you to the client
```

Both legs go through Resend. An earlier version sent the notification via
Web3Forms, but Web3Forms's free plan rejects server-to-server submissions
outright — it only accepts a form posted directly from a visitor's browser,
which defeats the point of hiding the key in a Worker. Resend has no such
restriction, so one provider now handles both emails.

---

## Why a Worker and not just the browser

Three reasons, in order of importance:

1. **The Resend API key can never touch the client.** Anything in the JS bundle
   is public. A leaked email key means spam sent *from your own domain*, which
   damages your sending reputation and is painful to recover from.
2. **Client-side validation is a convenience, not a control.** Anyone can POST
   directly to an endpoint with curl. The Worker re-validates everything.

---

## One-time setup

### 1. Resend account and domain

1. Sign up at [resend.com](https://resend.com) — free tier is 3,000 emails/month,
   100/day. Far beyond a portfolio's volume.
2. **Domains → Add Domain → `hardikajmeriya.com`**
3. Resend gives you DNS records (DKIM, SPF, and usually a return-path CNAME).
   Add them in **Cloudflare → DNS → Records**. Set them to **DNS only** (grey
   cloud), not proxied — proxying breaks mail records.
4. Wait for Resend to show **Verified**. Usually minutes.

**Do not skip verification.** Without it Resend refuses to send from
`@hardikajmeriya.com`, and mail that does go out unauthenticated lands in spam.

### 2. API key

**Resend → API Keys → Create**, with **Sending access** only. Not full access —
this key lives on a server that only ever sends mail.

### 3. Store the secrets

```bash
cd app
npx wrangler secret put RESEND_API_KEY   # paste the Resend key
```

Or `npm run secrets` to be prompted for it.

These are stored encrypted by Cloudflare. They are **not** in `wrangler.jsonc`,
not in `.env`, and not in git.

### 4. Local development

Create `app/.dev.vars` (gitignored):

```
RESEND_API_KEY=your-resend-key
```

---

## Running it locally

The form posts to `/api/enquiry`, which Vite does not serve. **Two terminals:**

```bash
# terminal 1 — the Worker API on :8787
cd app && npm run dev:api

# terminal 2 — the site with hot reload on :5173
cd app && npm run dev
```

Vite proxies `/api` to the Worker (see `vite.config.js`), so the form works end
to end while you keep hot reload.

**If you only run `npm run dev`**, submitting the form returns Vite's HTML
instead of JSON and fails with a parse error. That is the expected symptom of
forgetting terminal 1.

Unlike Web3Forms Pro's autoresponder — which only works in production — this
one works locally, so you can actually test it.

---

## Deploying

```bash
cd app
npm run deploy
```

Builds (including the prerender step) and deploys the Worker plus assets
together. Secrets persist across deploys; you set them once.

---

## Editing the email

All wording and styling lives in `app/worker/emails.js`, separate from the
request logic. Both an HTML and a plain-text part are sent — some clients block
HTML, and having a text part measurably improves deliverability.

The current message confirms receipt, restates what they submitted so they know
it arrived intact, and promises a reply within 24 hours. It deliberately sounds
like a person, not a system: *"I read every one personally — not a team, not a
bot."* That is a genuine advantage you have over an agency, so it is worth
saying.

If you change the promised response time, change it in `emails.js`,
`src/data/faq.js`, `src/data/projects.js` (the stats strip) and
`public/llms.txt` — they have drifted apart once already.

---

## What happens when something fails

| Failure | Behaviour |
| --- | --- |
| Validation fails | 422, form shows an error, nothing sent |
| Honeypot tripped | 200 returned, **nothing sent** — the bot learns nothing |
| Owner notification fails (Resend rejects it) | 503, visitor told to email you directly |
| Client auto-reply fails (Resend rejects it) | **Still reports success.** The enquiry reached you; the auto-reply is a nicety. Failure is logged, not surfaced |
| `RESEND_API_KEY` missing entirely | 503 with an explicit "form is misconfigured" message — the most common deploy mistake |

That second-from-last row is the important design decision: a visitor must
never be told their message failed when it actually reached you.

---

## Tests

`app/worker/index.test.mjs` covers routing, server-side validation, the honeypot,
the happy path, and each failure mode above:

```bash
cd app/worker && node index.test.mjs
```

14 tests, no dependencies, upstream calls mocked.

---

## Things worth knowing

**The `from` address is `hello@hardikajmeriya.com`.** It does not need to be a
real mailbox — Resend sends *from* it, and `reply_to` is set to your Gmail, so
replies reach you. If you later set up Cloudflare Email Routing you can receive
at that address too.

**Free tier limits:** 3,000/month, 100/day. Each submission sends **two**
emails — the notification to you and the auto-reply to the client — so the
real ceiling is **50 submissions a day**, not 100. The Worker's global rate
limit is set to 40/day to stay inside it with headroom (see SECURITY.md).

**Turnstile is now viable.** It was ruled out earlier because Web3Forms gates it
behind Pro — but you now control the server side, so you can verify a Turnstile
token in the Worker yourself, for free. Worth doing only if real spam appears;
the rate limiter below is the cheaper first line.

**Rate limiting is enforced in the Worker**, not the browser. `worker/rateLimit.js`
caps submissions per IP, per recipient address and site-wide. The per-recipient
cap is the one that matters most: the auto-reply goes to whatever address the
submitter types, so without it this endpoint would let anyone make your domain
send repeated mail to a stranger. Apply the migration before deploying:

```bash
npx wrangler d1 migrations apply hardik-enquiries --remote
```
