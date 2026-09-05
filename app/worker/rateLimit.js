/**
 * Server-side rate limiting for the public enquiry endpoint.
 *
 * WHY THIS EXISTS
 * ---------------
 * The contact form already had a cooldown, but it lived in Contact.jsx —
 * in the browser, in a variable an attacker controls. It stops a visitor
 * double-clicking Submit. It stops nothing else:
 *
 *   while true; do curl -X POST https://hardikajmeriya.com/api/enquiry \
 *     -H 'content-type: application/json' -d @payload.json; done
 *
 * Three things that costs, in increasing order of seriousness:
 *
 *  1. D1 fills with junk rows and the admin panel becomes unusable.
 *  2. The Resend quota burns out (100 emails/day on the free plan, and each
 *     submission sends TWO — the notification and the auto-reply — so the
 *     real ceiling is 50 submissions a day). Once it is gone, genuine
 *     enquiries silently stop arriving.
 *  3. The worst one: the auto-reply goes to whatever address the *submitter*
 *     typed. Without a per-recipient limit this endpoint is an open relay —
 *     someone can make hardikajmeriya.com send repeated mail to a victim who
 *     never asked for it. That is a deliverability and reputation problem
 *     that outlives the attack, because it is your domain doing the sending.
 *
 * So the limits below are not only about load. The per-email bucket exists
 * specifically to close (3).
 *
 * DESIGN
 * ------
 * Fixed windows in D1. A fixed window is slightly less precise than a sliding
 * one at the boundary, but it costs a single upsert per request instead of
 * keeping a row per event, and precision is not what matters here — the
 * difference between "5 an hour" and "9 across one boundary" is irrelevant
 * when the legitimate rate is about one a week.
 *
 * Addresses are stored as a salted SHA-256 hash, never in the clear. The
 * limiter only ever needs to know whether two requests came from the same
 * place, which a hash answers, so holding the raw value would be collecting
 * personal data for no reason.
 *
 * FAILS OPEN, deliberately. If the rate-limit table is missing or D1 is
 * having a bad day, a genuine enquiry still gets through. The opposite
 * choice — refusing every submission when the limiter is broken — would turn
 * a storage blip into silently losing business, which is a worse failure than
 * the spam this prevents. Compare worker/access.js, which fails CLOSED,
 * because there the downside is exposing client data rather than dropping a
 * message.
 */

/** Buckets applied to every submission, in order. First one exceeded wins. */
export const LIMITS = [
  // Per IP. A real person sends one enquiry; five in an hour is already odd.
  { name: 'ip-hour', scope: 'ip', windowSeconds: 60 * 60, max: 5 },
  { name: 'ip-day', scope: 'ip', windowSeconds: 24 * 60 * 60, max: 15 },

  // Per recipient address. This is the anti-relay control: it caps how much
  // mail this domain can be made to send to any single person per day.
  { name: 'email-hour', scope: 'email', windowSeconds: 60 * 60, max: 3 },
  { name: 'email-day', scope: 'email', windowSeconds: 24 * 60 * 60, max: 6 },

  // Whole-site ceiling. 40 submissions = 80 emails, comfortably inside the
  // Resend free tier's 100/day, so a distributed flood from many IPs still
  // cannot exhaust the quota and take the form down for real enquiries.
  { name: 'global-day', scope: 'global', windowSeconds: 24 * 60 * 60, max: 40 },
];

const encoder = new TextEncoder();

/**
 * Salted SHA-256, truncated. The salt means the hashes are not reversible
 * with a rainbow table of the IPv4 space, which an unsalted hash of an IP
 * address absolutely is — there are only four billion of them.
 */
async function hashKey(value, salt) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${value}`));
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** The visitor's IP, as Cloudflare sees it. Not client-settable. */
export function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || '';
}

/**
 * Count one request against every bucket.
 *
 * Returns { ok: true } or { ok: false, limit, retryAfter } where retryAfter
 * is seconds until the offending window rolls over.
 */
export async function checkRateLimit(request, email, env) {
  if (!env.DB) return { ok: true, skipped: 'no D1 binding' };

  const salt = env.RATE_LIMIT_SALT || 'hardikajmeriya-default-salt';
  const now = Math.floor(Date.now() / 1000);

  const ip = clientIp(request);
  const identities = {
    ip: ip ? await hashKey(ip, salt) : null,
    email: email ? await hashKey(email.toLowerCase(), salt) : null,
    global: 'all',
  };

  for (const limit of LIMITS) {
    const identity = identities[limit.scope];
    // No IP header (local dev, some test harnesses) — skip that bucket
    // rather than lumping every such request into one shared counter.
    if (!identity) continue;

    const windowStart = Math.floor(now / limit.windowSeconds) * limit.windowSeconds;
    const expiresAt = windowStart + limit.windowSeconds;
    const bucket = `${limit.name}:${identity}`;

    try {
      // One statement. A later window always has a strictly larger
      // expires_at, which is what resets the counter — no separate read,
      // no race between reading and writing.
      const row = await env.DB.prepare(
        `INSERT INTO rate_limits (bucket, count, expires_at)
         VALUES (?1, 1, ?2)
         ON CONFLICT(bucket) DO UPDATE SET
           count = CASE WHEN excluded.expires_at > rate_limits.expires_at
                        THEN 1 ELSE rate_limits.count + 1 END,
           expires_at = CASE WHEN excluded.expires_at > rate_limits.expires_at
                             THEN excluded.expires_at ELSE rate_limits.expires_at END
         RETURNING count, expires_at`
      )
        .bind(bucket, expiresAt)
        .first();

      if (row && row.count > limit.max) {
        return {
          ok: false,
          limit: limit.name,
          retryAfter: Math.max(1, row.expires_at - now),
        };
      }
    } catch (err) {
      // See the header comment: a broken limiter must not block real mail.
      console.error(`Rate limit check failed for ${limit.name}:`, err.message);
      return { ok: true, degraded: err.message };
    }
  }

  return { ok: true };
}

/**
 * Drop rows whose window has closed. Called opportunistically rather than on
 * a schedule so there is no cron to maintain; at these volumes the table
 * stays tiny either way.
 */
export async function sweepExpired(env, now = Math.floor(Date.now() / 1000)) {
  if (!env.DB) return;
  try {
    await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
  } catch (err) {
    console.error('Rate limit sweep failed:', err.message);
  }
}
