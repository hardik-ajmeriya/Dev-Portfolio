/**
 * Cloudflare Access JWT verification.
 *
 * WHY THIS EXISTS
 * ---------------
 * Access sets a `Cf-Access-Authenticated-User-Email` header once it has
 * authenticated someone. Trusting that header alone is only safe while Access
 * is actually sitting in front of the hostname, because Access is what strips
 * a client-supplied copy of it.
 *
 * If the Access policy is missing, misconfigured, deleted, or the Worker is
 * ever reached on a route Access does not cover, that header becomes
 * attacker-controlled and anyone can do:
 *
 *   curl -H "cf-access-authenticated-user-email: you@example.com" .../api/admin
 *
 * So instead we verify the signed assertion. Access issues an RS256 JWT
 * (`Cf-Access-Jwt-Assertion` header, or the CF_Authorization cookie) signed by
 * keys published at https://<team>.cloudflareaccess.com/cdn-cgi/access/certs.
 * A forged token fails the signature check. This is a cryptographic control
 * rather than a configuration one.
 *
 * Fails CLOSED: if the verification config is absent, access is denied rather
 * than falling back to the header.
 */

const CERTS_TTL_MS = 60 * 60 * 1000; // refresh public keys hourly
let certsCache = { url: null, keys: null, fetchedAt: 0 };

/** base64url -> Uint8Array */
function b64uToBytes(input) {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    '='
  );
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** base64url -> parsed JSON */
function b64uToJson(input) {
  return JSON.parse(new TextDecoder().decode(b64uToBytes(input)));
}

async function getSigningKeys(teamDomain) {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const fresh = certsCache.url === url && Date.now() - certsCache.fetchedAt < CERTS_TTL_MS;
  if (fresh && certsCache.keys) return certsCache.keys;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not fetch Access certs (${res.status})`);

  const { keys } = await res.json();
  if (!Array.isArray(keys) || !keys.length) throw new Error('Access certs response had no keys');

  certsCache = { url, keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * Verify an Access JWT.
 * Returns { ok: true, email } or { ok: false, reason }.
 */
export async function verifyAccessJwt(token, env) {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const audience = env.ACCESS_AUD;

  if (!teamDomain || !audience) {
    return { ok: false, reason: 'ACCESS_TEAM_DOMAIN or ACCESS_AUD not configured' };
  }
  if (!token) return { ok: false, reason: 'no Access token on the request' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed token' };

  const [headerB64, payloadB64, signatureB64] = parts;

  let header;
  let payload;
  try {
    header = b64uToJson(headerB64);
    payload = b64uToJson(payloadB64);
  } catch {
    return { ok: false, reason: 'token header or payload is not valid JSON' };
  }

  if (header.alg !== 'RS256') {
    // Refuse anything else outright. Accepting "alg": "none" — or letting the
    // token pick its own algorithm — is the classic JWT bypass.
    return { ok: false, reason: `unexpected algorithm ${header.alg}` };
  }

  let keys;
  try {
    keys = await getSigningKeys(teamDomain);
  } catch (err) {
    return { ok: false, reason: err.message };
  }

  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return { ok: false, reason: 'signing key not found for this token' };

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    b64uToBytes(signatureB64),
    signed
  );
  if (!valid) return { ok: false, reason: 'signature verification failed' };

  // --- claim checks -------------------------------------------------------
  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.exp !== 'number' || payload.exp < now) {
    return { ok: false, reason: 'token expired' };
  }
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) {
    return { ok: false, reason: 'token not yet valid' };
  }

  // `aud` ties the token to ONE Access application. Without this check a token
  // issued for any other app in the same Cloudflare team would be accepted.
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(audience)) {
    return { ok: false, reason: 'token audience does not match this application' };
  }

  if (payload.iss !== `https://${teamDomain}`) {
    return { ok: false, reason: 'unexpected issuer' };
  }

  const email = payload.email || payload.identity?.email;
  if (!email) return { ok: false, reason: 'token carries no email claim' };

  return { ok: true, email };
}

/** Pull the Access token from the header, falling back to the cookie. */
export function readAccessToken(request) {
  const header = request.headers.get('cf-access-jwt-assertion');
  if (header) return header;

  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

/** Exposed for tests. */
export function __resetCertsCache() {
  certsCache = { url: null, keys: null, fetchedAt: 0 };
}
