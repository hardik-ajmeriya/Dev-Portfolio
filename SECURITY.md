# Security

What actually protects this site, what the real risks are, and what to
configure in the Cloudflare dashboard.

---

## The short version

This site is **static files served from Cloudflare's edge**. There is no origin
server of yours, no database, no backend API, and no code of yours executing on
a request. That removes most of the attack surface a normal website has:

| Common attack | Applies here? |
| --- | --- |
| SQL injection | No — there is no database |
| Server RCE / shell | No — there is no server of yours running code |
| Auth bypass / session hijack | No — there are no accounts or sessions |
| File upload abuse | No — nothing accepts uploads |
| Origin IP discovery → direct attack | No — there is no origin to find |
| DDoS / request flood | Absorbed by Cloudflare (see below) |
| XSS | Mitigated by CSP; also no user input is rendered |
| Clickjacking | Blocked by `X-Frame-Options` / `frame-ancestors` |
| Contact form spam | **Real risk** — mitigated, see below |
| Cloudflare account takeover | **The biggest real risk** — see below |

Most of what people mean by "protect from cyber attacks" simply does not apply
to a static site. The two things that genuinely matter are at the bottom of
that table.

---

## 1. DDoS and request floods

**Already handled, and better than anything custom.** Cloudflare's free plan
includes *unmetered* DDoS protection at layers 3, 4 and 7. It is always on and
needs no configuration. Attack traffic is absorbed at the edge, across
Cloudflare's global network, before it reaches anything of yours.

There is no server of yours to overload. A flood hits Cloudflare, not you.

### The one real "overload" concern

Cloudflare Workers on the free plan allow **100,000 requests per day**. A large
enough bot flood could burn through that quota, and the site would stop serving
until the counter resets. This is the actual version of the risk you were
asking about — not a crashed server, an exhausted quota.

The rate limiting rule below is what addresses it.

---

## 2. Rate limiting (configure this)

The free plan includes **one** rate limiting rule. Expressions on the free plan
can only match on **Path** and **Verified Bot**, so keep it simple.

**Security → WAF → Rate limiting rules → Create rule**

| Field | Value |
| --- | --- |
| Rule name | `flood-guard` |
| If incoming requests match | `URI Path` `contains` `/` |
| Rate | `150` requests per `10 seconds` |
| Per | IP |
| Then | Managed Challenge |
| Duration | 10 seconds |

150 requests / 10s per IP is deliberately generous. A real visitor loading the
page pulls the HTML, CSS, JS, three.js chunk, four project images and ~35
Devicon logos — easily 45+ requests in a couple of seconds. Setting this too
low will challenge genuine visitors. Start here and tighten only if you see
abuse in the analytics.

Prefer **Managed Challenge** over Block: a real person who trips it solves an
invisible check and continues, while a bot is stopped.

---

## 3. Bot protection (configure this)

**Security → Bots → Bot Fight Mode: On**

Free tier. Challenges traffic Cloudflare identifies as automated. Note it can
occasionally challenge legitimate crawlers, so if you later care about a
specific tool reaching the site, check it still can.

Leave **verified bots** (Google, Bing) allowed so your site can be indexed
after launch.

---

## 4. WAF managed rules

**Security → WAF → Managed rules**

The free plan includes Cloudflare's basic managed ruleset. Enable it. Full
OWASP Core Ruleset requires a Pro plan — not worth paying for on a static
brochure site, since the rules it adds mostly defend server-side injection
attacks that cannot occur here.

---

## 5. Contact form spam — the real application risk

The contact form is the only thing on the site that *does* something, so it is
the only thing that can be abused. Someone can script requests to it and fill
your inbox.

Three defences are implemented in `app/src/components/sections/Contact.jsx`:

1. **Honeypot** — a `botcheck` field positioned off-screen and hidden from
   screen readers. Bots that fill every input trip it and the submission is
   silently discarded. Web3Forms also rejects it server-side.
2. **Minimum fill time** — submissions faster than 3 seconds after page load
   are rejected. No human reads and completes the form that fast.
3. **Cooldown** — 45 seconds enforced between submissions from the same
   browser.

These stop unsophisticated bots, which is the overwhelming majority. They are
client-side, so a determined attacker can bypass them by posting directly to
the Web3Forms endpoint.

**If you ever get real spam, turn on hCaptcha in the Web3Forms dashboard.**
That is a server-side check and is the actual fix. It costs a little friction
for genuine visitors, so it is not worth enabling pre-emptively.

Note the Web3Forms access key is public by design — it is visible in the page
source and cannot be hidden in a static site. That is expected. It only allows
sending to *your* form; it grants nothing else.

---

## 6. Account security — the biggest real risk

Everything above protects the site. **None of it matters if someone gets into
your Cloudflare account**, because that account now controls both the domain
and the hosting. This is the one failure that is genuinely hard to undo — an
attacker could point your domain anywhere, or transfer it away.

Do all three:

- [ ] **2FA on Cloudflare** — My Profile → Authentication
- [ ] **Registrar lock** — Domains → hardikajmeriya.com → Configuration
- [ ] **WHOIS privacy** — same page (free, hides your home address and phone
      from public lookup)

Also:

- Never commit a Cloudflare API token. `wrangler login` uses short-lived OAuth
  stored outside the repo.
- If you automate deploys, create a **scoped** token (`Workers Scripts: Edit`
  only), never the Global API Key.
- `.env` is gitignored. Keep it that way.

---

## 7. Security headers

Set in `app/public/_headers` (main site) and `coming-soon/public/_headers`.
Both files are parsed by Workers and are never served publicly.

| Header | Purpose |
| --- | --- |
| `Content-Security-Policy` | Blocks injected scripts. No `unsafe-inline`/`unsafe-eval` on `script-src` |
| `Strict-Transport-Security` | Forces HTTPS for 2 years, all subdomains |
| `X-Frame-Options: DENY` | Blocks clickjacking |
| `X-Content-Type-Options` | Blocks MIME sniffing |
| `Referrer-Policy` | Stops URL leakage to third parties |
| `Permissions-Policy` | Denies camera, mic, geolocation etc. |
| `Cross-Origin-Opener-Policy` | Cross-origin isolation |

Verify after any deploy:

```powershell
curl.exe -sI https://hardikajmeriya.com | findstr /I "strict-transport content-security x-frame x-content-type referrer permissions"
curl.exe -so NUL -w "%{http_code}`n" https://hardikajmeriya.com/_headers   # must be 404
```

### HSTS caveat

`includeSubDomains` means every subdomain must be HTTPS for two years. Fine on
Cloudflare, but remember it when you add `cureneed.hardikajmeriya.com`.

The `preload` token is a declaration of intent only — it does nothing unless
you submit the domain at hstspreload.org, which has **not** been done. Getting
removed from that list takes months, so do not submit unless you are certain.

---

## 8. On disabling right-click, DevTools and text selection

**Not implemented, deliberately.** See the discussion below — the short version
is that it does not work, and on a developer's portfolio it actively costs you
credibility with exactly the people you want to hire you.

If after reading that you still want it, it is a small change and can be added.

---

## Checklist

Configure once in the dashboard:

- [ ] 2FA on Cloudflare account
- [ ] Registrar lock + WHOIS privacy
- [ ] Rate limiting rule (section 2)
- [ ] Bot Fight Mode on
- [ ] WAF managed ruleset on
- [ ] SSL/TLS: Full (strict), Always Use HTTPS, Min TLS 1.2

Already done in code:

- [x] Security headers on both sites
- [x] Strict CSP, no `unsafe-inline` on scripts
- [x] Contact form honeypot, fill-time check, cooldown
- [x] No secrets in the repo
