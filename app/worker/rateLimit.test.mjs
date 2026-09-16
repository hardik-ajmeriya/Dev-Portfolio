/**
 * Rate limiter tests.
 *
 * The interesting cases are the ones that describe an attack, not the happy
 * path: a flood from one IP, a flood aimed at one victim's inbox from many
 * IPs (the open-relay case), and a global flood from many IPs at many
 * targets. Each of those is a separate bucket and each is asserted here.
 */

import { checkRateLimit, sweepExpired, LIMITS } from './rateLimit.js';

// --- D1 stand-in that actually implements the upsert semantics -------------
// The limiter leans on "a later window has a strictly larger expires_at" to
// reset counters, so a stub that just counts calls would pass while the real
// query was wrong. This models the rows.
function makeDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      const q = { sql, binds: [] };
      q.bind = (...b) => {
        q.binds = b;
        return q;
      };
      q.first = async () => {
        if (!/INSERT INTO rate_limits/.test(sql)) return null;
        const [bucket, expiresAt] = q.binds;
        const existing = rows.get(bucket);
        if (!existing || expiresAt > existing.expires_at) {
          rows.set(bucket, { count: 1, expires_at: expiresAt });
        } else {
          existing.count += 1;
        }
        return { ...rows.get(bucket) };
      };
      q.run = async () => {
        if (/DELETE FROM rate_limits/.test(sql)) {
          const [now] = q.binds;
          let n = 0;
          for (const [k, v] of rows) {
            if (v.expires_at < now) {
              rows.delete(k);
              n += 1;
            }
          }
          return { meta: { changes: n } };
        }
        return { meta: {} };
      };
      return q;
    },
  };
}

const req = (ip) =>
  new Request('https://hardikajmeriya.com/api/enquiry', {
    method: 'POST',
    headers: ip ? { 'cf-connecting-ip': ip } : {},
  });

let pass = 0;
let fail = 0;
const t = async (name, fn) => {
  try {
    await fn();
    console.log('  PASS  ' + name);
    pass += 1;
  } catch (e) {
    console.log('  FAIL  ' + name + ' -> ' + e.message);
    fail += 1;
  }
};
const eq = (a, b, m) => {
  if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
};

const limitOf = (name) => LIMITS.find((l) => l.name === name).max;

console.log('=== NORMAL USE IS NEVER BLOCKED ===');
await t('a single genuine submission passes', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const r = await checkRateLimit(req('1.2.3.4'), 'client@example.com', env);
  eq(r.ok, true, 'ok');
});

await t('different people submitting at once do not affect each other', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  for (let i = 0; i < 10; i += 1) {
    const r = await checkRateLimit(req(`10.0.0.${i}`), `person${i}@example.com`, env);
    eq(r.ok, true, `submission ${i}`);
  }
});

console.log();
console.log('=== FLOOD FROM ONE IP ===');
await t(`blocks after ${limitOf('ip-hour')} in an hour, and says how long to wait`, async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const max = limitOf('ip-hour');
  for (let i = 0; i < max; i += 1) {
    const r = await checkRateLimit(req('9.9.9.9'), `a${i}@example.com`, env);
    eq(r.ok, true, `submission ${i + 1} of ${max} should pass`);
  }
  const blocked = await checkRateLimit(req('9.9.9.9'), 'a99@example.com', env);
  eq(blocked.ok, false, 'the next one is blocked');
  eq(blocked.limit, 'ip-hour', 'bucket');
  if (!(blocked.retryAfter > 0 && blocked.retryAfter <= 3600)) {
    throw new Error(`retryAfter out of range: ${blocked.retryAfter}`);
  }
});

console.log();
console.log('=== OPEN RELAY: many IPs, ONE victim address ===');
await t('caps mail aimed at a single recipient regardless of source IP', async () => {
  // This is the abuse the per-email bucket exists for. An attacker with a
  // botnet defeats every IP limit trivially; what they must not be able to do
  // is make this domain repeatedly email someone who never asked for it.
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const max = limitOf('email-hour');
  for (let i = 0; i < max; i += 1) {
    const r = await checkRateLimit(req(`203.0.113.${i}`), 'victim@example.com', env);
    eq(r.ok, true, `submission ${i + 1} should pass`);
  }
  const blocked = await checkRateLimit(req('203.0.113.200'), 'victim@example.com', env);
  eq(blocked.ok, false, 'blocked despite a brand-new IP each time');
  eq(blocked.limit, 'email-hour', 'bucket');
});

await t('the address is matched case-insensitively', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const max = limitOf('email-hour');
  for (let i = 0; i < max; i += 1) {
    await checkRateLimit(req(`198.51.100.${i}`), 'Victim@Example.COM', env);
  }
  const blocked = await checkRateLimit(req('198.51.100.9'), 'victim@example.com', env);
  eq(blocked.ok, false, 'case variation must not reset the counter');
});

console.log();
console.log('=== GLOBAL CEILING PROTECTS THE EMAIL QUOTA ===');
await t(`blocks after ${limitOf('global-day')}/day across all IPs and addresses`, async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const max = limitOf('global-day');
  for (let i = 0; i < max; i += 1) {
    const r = await checkRateLimit(req(`172.16.${Math.floor(i / 250)}.${i % 250}`), `u${i}@x.com`, env);
    eq(r.ok, true, `submission ${i + 1} should pass`);
  }
  const blocked = await checkRateLimit(req('172.31.1.1'), 'last@x.com', env);
  eq(blocked.ok, false, 'global cap reached');
  eq(blocked.limit, 'global-day', 'bucket');
});

await t('the global cap stays inside the Resend free tier', () => {
  // Each submission sends TWO emails: the notification and the auto-reply.
  // Resend's free plan allows 100/day. If this assertion ever fails, the
  // quota can be exhausted and real enquiries stop arriving silently.
  const emailsPerSubmission = 2;
  const dailyQuota = 100;
  const worstCase = limitOf('global-day') * emailsPerSubmission;
  if (worstCase > dailyQuota) {
    throw new Error(`global-day allows ${worstCase} emails/day, over the ${dailyQuota} quota`);
  }
});

console.log();
console.log('=== PRIVACY ===');
await t('no raw IP or email address is ever stored', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  await checkRateLimit(req('192.0.2.77'), 'someone@example.com', env);
  const keys = [...env.DB.rows.keys()].join(' ');
  if (keys.includes('192.0.2.77')) throw new Error('raw IP found in a bucket key: ' + keys);
  if (keys.includes('someone@example.com')) throw new Error('raw email found: ' + keys);
  if (keys.includes('example.com')) throw new Error('email domain leaked: ' + keys);
});

await t('the salt changes the stored hashes', async () => {
  const a = { DB: makeDb(), RATE_LIMIT_SALT: 'salt-a' };
  const b = { DB: makeDb(), RATE_LIMIT_SALT: 'salt-b' };
  await checkRateLimit(req('192.0.2.5'), 'x@y.com', a);
  await checkRateLimit(req('192.0.2.5'), 'x@y.com', b);
  const ka = [...a.DB.rows.keys()].sort().join();
  const kb = [...b.DB.rows.keys()].sort().join();
  if (ka === kb) throw new Error('hashes are not salted — a rainbow table of the IPv4 space would reverse them');
});

console.log();
console.log('=== FAILURE MODES ===');
await t('FAILS OPEN when the database throws', async () => {
  // Opposite of access.js on purpose: dropping a real enquiry because a
  // counter table is unavailable is worse than letting spam through.
  const broken = {
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          first() {
            throw new Error('d1 down');
          },
        };
      },
    },
  };
  const r = await checkRateLimit(req('1.1.1.1'), 'a@b.com', broken);
  eq(r.ok, true, 'must still allow the submission');
  eq(r.degraded, 'd1 down', 'and record why');
});

await t('no D1 binding at all -> allowed and flagged', async () => {
  const r = await checkRateLimit(req('1.1.1.1'), 'a@b.com', {});
  eq(r.ok, true, 'ok');
  eq(r.skipped, 'no D1 binding', 'skipped reason');
});

await t('a request with no IP header still applies the email and global buckets', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const max = limitOf('email-hour');
  for (let i = 0; i < max; i += 1) await checkRateLimit(req(null), 'v@example.com', env);
  const blocked = await checkRateLimit(req(null), 'v@example.com', env);
  eq(blocked.ok, false, 'email bucket still enforced without an IP');
  const keys = [...env.DB.rows.keys()];
  if (keys.some((k) => k.startsWith('ip-'))) {
    throw new Error('missing IPs were lumped into a shared bucket: ' + keys.join(' '));
  }
});

console.log();
console.log('=== WINDOW ROLLOVER ===');
await t('the counter resets once the window closes', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const max = limitOf('ip-hour');
  const realNow = Date.now;
  try {
    const base = 1_800_000_000_000; // fixed instant, mid-window
    Date.now = () => base;
    for (let i = 0; i < max; i += 1) await checkRateLimit(req('5.5.5.5'), `a${i}@x.com`, env);
    eq((await checkRateLimit(req('5.5.5.5'), 'z@x.com', env)).ok, false, 'blocked inside the window');

    Date.now = () => base + 2 * 60 * 60 * 1000; // two hours later
    eq((await checkRateLimit(req('5.5.5.5'), 'z@x.com', env)).ok, true, 'allowed in the next window');
  } finally {
    Date.now = realNow;
  }
});

await t('sweepExpired removes closed windows and keeps open ones', async () => {
  const env = { DB: makeDb(), RATE_LIMIT_SALT: 's' };
  const now = Math.floor(Date.now() / 1000);
  env.DB.rows.set('old:x', { count: 3, expires_at: now - 10 });
  env.DB.rows.set('live:y', { count: 1, expires_at: now + 3600 });
  await sweepExpired(env, now);
  if (env.DB.rows.has('old:x')) throw new Error('expired row was not swept');
  if (!env.DB.rows.has('live:y')) throw new Error('a live window was swept away');
});

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
