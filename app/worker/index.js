/**
 * Site Worker.
 *
 * Serves the static build (via the `assets` binding) and adds one API route:
 *
 *   POST /api/enquiry
 *     1. validates the submission server-side
 *     2. emails the enquiry to Hardik via Resend
 *     3. sends a branded auto-reply via Resend -> confirmation to the client
 *
 * Both emails go through Resend. Web3Forms was tried first for step 2, but
 * its free plan rejects server-to-server submissions outright ("Use our API
 * in client side... Pro plan is required" for a server IP) — Workers don't
 * even have a stable outbound IP to register for that. Resend has no such
 * restriction, so one provider now handles both emails.
 *
 * Why a Worker rather than posting to Resend straight from the browser:
 *  - The Resend API key must never reach the client. Anything in the bundle
 *    is public, and a leaked key means spam sent from your own domain.
 *  - Client-side validation is a convenience, not a control — anyone can POST
 *    directly to an endpoint. This re-checks everything.
 *
 * Secret (set with `wrangler secret put NAME` — never committed):
 *   RESEND_API_KEY
 */

import { clientAutoReply, ownerNotification, BRAND } from './emails.js';
import { handleAdminApi, requireAccess, saveEnquiry } from './admin.js';
import { checkRateLimit, sweepExpired } from './rateLimit.js';
import { adminPage } from './adminPage.js';

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

/** Shared Resend send — both the owner notification and the client auto-reply use it. */
async function sendEmail({ to, replyTo, subject, html, text }, env) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${BRAND.name} <hello@hardikajmeriya.com>`,
      reply_to: replyTo,
      to: [to],
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

/** Notification to Hardik, via Resend. Reply-to is the enquirer's address. */
async function notifyOwner(data, env) {
  const submittedAt = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const { subject, html, text } = ownerNotification({ ...data, submittedAt: `${submittedAt} IST` });
  return sendEmail({ to: BRAND.email, replyTo: data.email, subject, html, text }, env);
}

/** Auto-reply to the client, via Resend. Reply-to is Hardik's own address. */
async function sendAutoReply(data, env) {
  const { subject, html, text } = clientAutoReply(data);
  return sendEmail({ to: data.email, replyTo: BRAND.email, subject, html, text }, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---- Private hosts: gate the WHOLE site, not just /admin -----------
    //
    // The same Worker answers on more than one hostname:
    //   hardikajmeriya.com          the public site        (PUBLIC_HOST)
    //   admin.hardikajmeriya.com    private preview + panel
    //   *.workers.dev               if the subdomain is ever enabled
    //
    // Cloudflare Access is supposed to sit in front of the private ones, but
    // that is dashboard configuration, and it is easy to scope an Access
    // application to the path `admin` instead of the whole hostname. When
    // that happens the panel is protected but the site root is not — the
    // unreleased design is served to anyone who guesses the subdomain, and
    // since the site carries no noindex it can be crawled and indexed.
    //
    // So the Worker enforces it rather than trusting the dashboard: on any
    // host that is not PUBLIC_HOST, every path requires a verified Access
    // token. Same fail-closed principle already used for /admin.
    const host = url.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    // ---- www -> apex, before anything else ------------------------------
    //
    // www.hardikajmeriya.com is attached as a custom domain alongside the
    // apex. Without this it would fall through to the private-host gate
    // below — PUBLIC_HOST is the apex only — and every visitor who typed
    // "www." would be shown a Cloudflare Access login instead of the site.
    //
    // A 301 rather than serving both: the canonical tag, the sitemap and
    // every JSON-LD url already name the apex, so answering on two hostnames
    // would split the signals for the one search term that matters most.
    if (env.PUBLIC_HOST && host === `www.${env.PUBLIC_HOST}`) {
      url.hostname = env.PUBLIC_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const isPrivateHost = !isLocalHost && !!env.PUBLIC_HOST && host !== env.PUBLIC_HOST;

    if (isPrivateHost) {
      const auth = await requireAccess(request, env);
      if (!auth.ok) return auth.response;
    }

    // ---- /resume ---------------------------------------------------------
    //
    // The CV shipped as /DevOps_V1.2.pdf and was linked from nowhere at all:
    // no href on the page, not in the sitemap, not in llms.txt. An asset
    // nothing points at is not crawlable, so it may as well not have been
    // deployed. The filename also said nothing about whose CV it is, which
    // matters when it is the file a recruiter saves to disk.
    //
    // Served at a clean /resume rather than redirected to the .pdf, so the
    // indexable URL is the readable one. This is also the site's only second
    // URL, which is the beginning of any answer to "why are there no
    // sitelinks" — see SEO_TODO.md.
    if (url.pathname === '/resume' || url.pathname === '/resume/') {
      const pdf = await env.ASSETS.fetch(
        new Request(`${url.origin}/hardik-ajmeriya-resume.pdf`, request)
      );
      if (!pdf.ok) return pdf;
      const headers = new Headers(pdf.headers);
      headers.set('content-type', 'application/pdf');
      // inline, not attachment: a recruiter should be able to read it in the
      // browser without a download, and Google indexes PDF text either way.
      headers.set('content-disposition', 'inline; filename="hardik-ajmeriya-resume.pdf"');
      headers.set('cache-control', 'public, max-age=86400');
      headers.set('x-robots-tag', 'index, follow');
      return new Response(pdf.body, { status: 200, headers });
    }

    // ---- Admin, behind Cloudflare Access -------------------------------
    // Access authenticates at the edge before the request reaches here; the
    // checks inside are defence in depth, not the primary control.
    if (url.pathname.startsWith('/api/admin')) {
      return handleAdminApi(request, env, url);
    }

    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      const auth = await requireAccess(request, env);
      if (!auth.ok) return auth.response;
      return new Response(adminPage(auth.email, auth.dev), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          // Never cache a page containing client data.
          'cache-control': 'no-store, must-revalidate',
          // The panel is deliberately excluded from search engines.
          'x-robots-tag': 'noindex, nofollow',
        },
      });
    }

    // ---- Everything except the enquiry endpoint is a static asset -------
    if (url.pathname !== '/api/enquiry') {
      const asset = await env.ASSETS.fetch(request);

      // Second layer, in case the gate above is ever loosened: a private
      // host must never contribute a crawlable copy of the site. A preview
      // indexed on a subdomain would also compete with the real domain for
      // the same terms once it launches.
      if (isPrivateHost) {
        const headers = new Headers(asset.headers);
        headers.set('x-robots-tag', 'noindex, nofollow');
        return new Response(asset.body, { status: asset.status, headers });
      }

      return asset;
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

    // ---- Rate limiting -------------------------------------------------
    // Deliberately AFTER validation (which is pure CPU and costs nothing) and
    // BEFORE anything expensive: the database write and the two Resend calls.
    // A malformed request therefore does not consume a visitor's quota, but
    // nothing that costs money or sends mail happens without passing here.
    const rate = await checkRateLimit(request, data.email, env);
    if (!rate.ok) {
      console.warn(`Rate limit hit: ${rate.limit}`);
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Too many submissions from this connection. Please wait a little, or email me directly.',
          code: 'rate_limited',
        }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'retry-after': String(rate.retryAfter),
          },
        }
      );
    }

    // Missing secret is a deployment mistake, not a visitor's problem — say
    // so explicitly rather than letting it look like a generic upstream
    // failure. This is the most common cause of a broken form.
    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set — run `wrangler secret put`, or add it to .dev.vars for local dev');
      return json(
        {
          success: false,
          message: 'The form is misconfigured. Please email me directly.',
          code: 'missing_api_key',
        },
        503
      );
    }

    // Persist before emailing. If the database write fails the submission
    // still goes through — losing an enquiry would be far worse than losing
    // a row — but doing it first means a send failure never loses the data.
    const saved = await saveEnquiry(data, request, env);
    if (!saved.ok && !saved.skipped) {
      console.error('Enquiry not persisted, continuing to email anyway:', saved.error);
    }

    const owner = await notifyOwner(data, env);
    if (!owner.ok) {
      console.error('Owner notification failed', owner.status, owner.detail);
      // 503, deliberately not 502: in local dev the Vite proxy itself returns
      // 502 when the Worker is not running at all, so 503 here unambiguously
      // means the Worker ran but the send itself failed.
      return json(
        {
          success: false,
          message: 'Could not send your message. Please email me directly.',
          code: 'upstream_failed',
        },
        503
      );
    }

    // The auto-reply is a nicety. If it fails the enquiry still reached
    // Hardik, so the visitor must still be told it worked.
    const reply = await sendAutoReply(data, env);
    if (!reply.ok) {
      console.error('Client auto-reply failed', reply.status, reply.detail);
    }

    // Tidy closed rate-limit windows on the way out. Only on a successful
    // submission, so it runs roughly as often as there is anything to clean
    // up, and never adds latency to the failure paths.
    await sweepExpired(env);

    return json({ success: true });
  },
};
