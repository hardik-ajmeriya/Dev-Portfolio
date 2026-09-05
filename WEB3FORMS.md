# Web3Forms configuration

How the contact form talks to Web3Forms, what your enquiry emails will look
like, and which dashboard settings are worth changing.

Form code: `app/src/components/sections/Contact.jsx`

---

## How it works

There is nothing to "design" in the Web3Forms dashboard — **the email is built
from whatever field names the form posts.** Web3Forms takes every non-reserved
field and renders it as a labelled row in the email.

That means the field names in the code *are* the email layout. They were
deliberately written as human-readable labels rather than variable names:

```js
payload.append('Full name',        data.name);
payload.append('Business email',   data.email);
payload.append('Company',          data.company || 'Not provided');
payload.append('Project type',     data.projectType);
payload.append('Estimated budget', data.budget);
payload.append('Timeline',         data.timeline);
payload.append('Project overview', data.message);
```

If they had been `name`, `projectType` and so on, your inbox would read
`projectType: New web application`. Instead you get:

```
New project enquiry — Jane Doe

Full name          Jane Doe
Business email     jane@company.com
Company            Acme Inc.
Project type       New web application
Estimated budget   $3,000 – $5,000
Timeline           Within 1 month
Project overview   We need a client portal where customers can
                   track orders. Key features:
                   - Login and roles
                   - Order history
                   - **Email notifications**
```

To change the email layout, rename the strings in `payload.append(...)`. Nothing
in the dashboard needs touching.

### Reserved fields (these do not appear as rows)

| Field | Value we send | Effect |
| --- | --- | --- |
| `access_key` | from `VITE_WEB3FORMS_ACCESS_KEY` | Routes the mail to your inbox |
| `subject` | `New project enquiry — {name}` | Email subject line |
| `from_name` | `hardikajmeriya.com` | Sender name shown in your client |
| `replyto` | the enquirer's email | **Hit Reply and it goes to them, not to Web3Forms** |
| `botcheck` | empty | Honeypot |

`replyto` is the one that saves you daily annoyance — without it, replying to an
enquiry sends the message to nobody useful.

### Markdown in the overview

The Project Overview field has a formatting toolbar, so the text arrives as
Markdown (`**bold**`, `- bullets`, `1. numbered`). Web3Forms sends plain-text
email, so it arrives as literal characters — readable as-is, and it renders
properly if you paste it into Notion, a doc or a GitHub issue.

---

## Dashboard setup

There is no per-field configuration. Only two things are worth doing:

1. **Verify the destination email.** Web3Forms sends to the address the access
   key was created for. Confirm it is the inbox you actually read.
2. **Send a real test submission** from `npm run dev` and confirm it arrives —
   check spam on the first one, since a new sender often lands there once.

That is genuinely all that is required for the free plan.

---

## Free vs Pro — what you actually lose

Verified against the Web3Forms docs. **Pro** features:

| Feature | Why you might want it |
| --- | --- |
| **Autoresponder** | Auto-reply to the enquirer: "thanks, I'll respond within 24 hours". The most valuable one for how you're positioning — it sets expectations instantly |
| **Domain restriction** | Only accept submissions from hardikajmeriya.com |
| **Cloudflare Turnstile / reCaptcha** | Stronger captcha options |
| **File attachments** | Let clients send a brief or spec |
| **CC email** | Copy submissions to a second address |
| **Webhooks** | Push enquiries into a CRM or Notion |

Free, and already in use or available:

- Unlimited-ish submissions for a portfolio's volume
- Custom subject, from-name and reply-to (all configured)
- **hCaptcha** — the free captcha option
- Google Sheets, Slack, Discord and Telegram integrations
- Web3Forms does not store submissions (they forward and discard)

### Do you need Pro?

Not to launch. The two that would genuinely earn it later are the
**autoresponder** (an instant acknowledgement makes a one-person operation feel
responsive) and **domain restriction** (see below). Neither is worth paying for
before you have real enquiry volume.

---

## Spam and the access key

**Your access key is public and that is by design.** It is compiled into the
JavaScript bundle and visible in page source. Web3Forms is explicit about this:
the key is an alias for your email address, not a secret. Someone who has it can
send you emails — exactly like someone who knows your email address can.

Current protection, in order of what stops what:

1. **Web3Forms' own firewall and spam filtering** — server-side, always on.
2. **Honeypot** — an off-screen field. Bots that fill every input trip it and the
   submission is discarded client-side before any request is made.
3. **Minimum fill time** — anything submitted under 3 seconds after page load is
   rejected.
4. **Cooldown** — 45 seconds enforced between sends from one browser.

Note: Web3Forms' docs now mark **honeypot as deprecated**, on the grounds that
modern bots defeat it. That is fair, and it is why it is one layer of four here
rather than the only one.

### If real spam starts arriving

**Enable hCaptcha** — it is free, and server-side, which the guards above are
not. The code already forwards an `h-captcha-response` token if the widget is
present, so it is a front-end change only:

1. Turn on hCaptcha in the Web3Forms dashboard
2. Add the hCaptcha script and widget to the form
3. Add `https://hcaptcha.com` and `https://*.hcaptcha.com` to `script-src`,
   `frame-src` and `connect-src` in `app/public/_headers`

Do not enable it pre-emptively. It costs every genuine visitor a puzzle, and you
currently have no spam problem to solve.

> **Correction to earlier work:** the form originally carried a Cloudflare
> Turnstile placeholder. Turnstile is a **Pro** feature on Web3Forms, so on the
> free plan hCaptcha is the path. The code now forwards either token, so
> whichever you enable will work without further changes.

---

## Troubleshooting

**Form says sent, nothing arrives.** Check spam first. Then confirm
`VITE_WEB3FORMS_ACCESS_KEY` is actually set — this already bit us once: Vite
reads `app/.env`, **not** the repo-root `.env`, because `vite.config.js` lives in
`app/`. A key in the wrong file means an empty `access_key` and a silent failure.

```powershell
# should print a 36-character UUID, not blank
Get-Content app\.env
```

**Works locally, fails when deployed.** `VITE_` variables are baked in at build
time. With `wrangler deploy` the build runs on your machine and picks up
`app/.env`. With Git-connected builds, Cloudflare builds on its own servers and
you must set `VITE_WEB3FORMS_ACCESS_KEY` in the dashboard's environment
variables.

**Testing repeatedly.** The 45-second cooldown will block you. Reload the page
to reset it.
