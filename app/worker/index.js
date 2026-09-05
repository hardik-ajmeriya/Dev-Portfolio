/**
 * Site Worker.
 *
 * Serves the static build (via the `assets` binding) and adds one API route:
 *
 *   POST /api/enquiry
 *     1. validates the submission server-side
 *     2. forwards it to Web3Forms  -> notification to Hardik
 *     3. sends a branded auto-reply via Resend -> confirmation to the client
 *
 * Why a Worker rather than posting to Web3Forms straight from the browser:
 *  - The Resend API key must never reach the client. Anything in the bundle
 *    is public, and a leaked key means spam sent from your own domain.
 *  - Client-side validation is a convenience, not a control — anyone can POST
 *    directly to an endpoint. This re-checks everything.
 *  - The Web3Forms access key moves out of the bundle as a side benefit.
 *
 * Secrets (set with `wrangler secret put NAME` — never committed):
 *   WEB3FORMS_ACCESS_KEY
 *   RESEND_API_KEY
 */

import { clientAutoReply, BRAND } from './emails.js';

const MAX_FIELD = 5000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/**
 * Trim, cap length, and strip control characters — keeping tab and newline,
 * which are legitimate inside the project overview.
 *
 * Written as an explicit character-code filter rather than a regex range.
 * Escape sequences for control characters are easy to get subtly wrong, and
 * a wrong range here would silently mangle every message.
 *
 * This matters beyond tidiness: a CR or LF smuggled into a short field is the
 * classic email header-injection trick, and these values end up in an email.
 */
const TAB = 9;
const NEWLINE = 10;
const LAST_CONTROL = 31;
const DEL = 127;

const clean = (value) =>
  String(value ?? '')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      if (code === TAB || code === NEWLINE) return true;
      return code > LAST_CONTROL && code !== DEL;
    })
    .join('')
    .trim()
    .slice(0, MAX_FIELD);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Server-side validation. Mirrors the client rules — the client version is
 * there for fast feedback, this one is the actual gate.
 */
function validate(body) {
  const data = {
    name: clean(body.name),
    email: clean(body.email),
    company: clean(body.company),
    projectType: clean(body.projectType),
    budget: clean(body.budget),
    timeline: clean(body.timeline),
    message: clean(body.message),
    botcheck: clean(body.botcheck),
  };

  // Honeypot: accept and discard, so the bot learns nothing from the response.
  if (data.botcheck) return { discard: true, data };

  const errors = [];
  if (data.name.length < 2) errors.push('name');
  if (!EMAIL_RE.test(data.email)) errors.push('email');
  if (!data.projectType) errors.push('projectType');
  if (!data.budget) errors.push('budget');
  if (!data.timeline) errors.push('timeline');
  if (data.message.length < 30) errors.push('message');

  return { errors, data };
}

/** Notification to Hardik, via Web3Forms. */
async function notifyOwner(data, env) {
  const summary = [data.name, data.company, data.projectType, data.budget, data.timeline]
    .filter(Boolean)
    .join('  ·  ');

  const submittedAt = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const payload = {
    access_key: env.WEB3FORMS_ACCESS_KEY,
    subject: `New enquiry — ${data.name} · ${data.budget} · ${data.timeline}`,
    from_name: 'hardikajmeriya.com',
    replyto: data.email,
    Summary: summary,
    'Full name': data.name,
    Email: data.email,
    Company: data.company || '—',
    'Project type': data.projectType,
    'Estimated budget': data.budget,
    Timeline: data.timeline,
    'Project overview': data.message,
    Submitted: `${submittedAt} IST`,
  };

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await res.json().catch(() => ({}));
  return { ok: res.ok && result.success !== false, result };
}

/** Auto-reply to the client, via Resend. */
async function sendAutoReply(data, env) {
  if (!env.RESEND_API_KEY) return { ok: false, skipped: 'no RESEND_API_KEY' };

  const { subject, html, text } = clientAutoReply(data);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${BRAND.name} <hello@hardikajmeriya.com>`,
      reply_to: BRAND.email,
      to: [data.email],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, detail: await res.text().catch(() => '') };
  }
  return { ok: true };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Everything except the API route is a static asset.
    if (url.pathname !== '/api/enquiry') {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== 'POST') {
      return json({ success: false, message: 'Method not allowed.' }, 405);
    }

    // Same-origin only. Not security on its own — Origin can be forged by a
    // non-browser client — but it stops the endpoint being driven from
    // another website in a real browser.
    const origin = request.headers.get('origin') || '';
    const allowed = [`https://${url.hostname}`, 'http://localhost:5173'];
    if (origin && !allowed.includes(origin)) {
      return json({ success: false, message: 'Forbidden.' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: 'Invalid request.' }, 400);
    }

    const { errors, data, discard } = validate(body);

    if (discard) return json({ success: true });

    if (errors.length) {
      return json({ success: false, message: 'Please check the form and try again.', errors }, 422);
    }

    const owner = await notifyOwner(data, env);
    if (!owner.ok) {
      return json(
        { success: false, message: 'Could not send your message. Please email me directly.' },
        502
      );
    }

    // The auto-reply is a nicety. If Resend fails the enquiry still reached
    // Hardik, so the visitor must still be told it worked.
    const reply = await sendAutoReply(data, env);
    if (!reply.ok && !reply.skipped) {
      console.error('Resend auto-reply failed', reply.status, reply.detail);
    }

    return json({ success: true });
  },
};
