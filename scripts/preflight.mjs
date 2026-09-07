#!/usr/bin/env node
/**
 * Launch preflight.
 *
 *     cd app && npm run build
 *     node scripts/preflight.mjs
 *
 * Checks the things that are cheap to get wrong and expensive to notice late.
 * It reads the built output in app/dist and the repo config — it does NOT make
 * network requests, so it can run before anything is public.
 *
 * Exit code 0 = safe to swap the domain. Non-zero = do not launch yet.
 *
 * The checks are split into two tiers:
 *   BLOCKER — launching with this broken means a visibly broken site, or a
 *             claim on the page that is not true.
 *   WARN    — worth fixing, will not embarrass you on launch day.
 *
 * Deliberately NOT checked here, because a script cannot: whether the live
 * URLs actually resolve, whether the Resend key is set in the Cloudflare
 * dashboard, and whether the site looks right. Those are in LAUNCH-PLAN.md as
 * manual steps.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APP = path.join(ROOT, 'app');
const DIST = path.join(APP, 'dist');

const results = [];
const check = (tier, name, fn) => {
  let ok = false;
  let detail = '';
  try {
    const r = fn();
    if (typeof r === 'string') {
      ok = false;
      detail = r;
    } else {
      ok = !!r;
    }
  } catch (err) {
    ok = false;
    detail = err.message;
  }
  results.push({ tier, name, ok, detail });
};

const read = (p) => fs.readFileSync(p, 'utf-8');
const exists = (p) => fs.existsSync(p);

if (!exists(DIST)) {
  console.error('\n  app/dist not found. Run `cd app && npm run build` first.\n');
  process.exit(2);
}

const html = read(path.join(DIST, 'index.html'));
const wrangler = read(path.join(APP, 'wrangler.jsonc'));
const cfg = JSON.parse(wrangler.replace(/^\s*\/\/.*$/gm, ''));
const projects = read(path.join(APP, 'src/data/projects.js'));

// ---------------------------------------------------------------- BLOCKERS

check('BLOCKER', 'At least one project has a live URL', () => {
  const urls = [...projects.matchAll(/liveUrl:\s*'([^']*)'/g)].map((m) => m[1]);
  const filled = urls.filter(Boolean);
  return filled.length > 0 || `all ${urls.length} liveUrl fields are still empty`;
});

check('BLOCKER', 'Every project has at least one working link', () => {
  const blocks = projects.split(/\n  \{\n/).slice(1);
  const bad = [];
  for (const b of blocks) {
    const id = b.match(/id:\s*'([^']*)'/)?.[1];
    if (!id) continue;
    const live = b.match(/liveUrl:\s*'([^']*)'/)?.[1] || '';
    const gh = b.match(/githubUrl:\s*'([^']*)'/)?.[1] || '';
    if (!live && !gh) bad.push(id);
  }
  return bad.length === 0 || `no link at all on: ${bad.join(', ')}`;
});

check('BLOCKER', 'No dev-only placeholder text in the built HTML', () =>
  (!/add liveUrl|add URL|REPLACE-WITH|TODO|FIXME|Lorem ipsum/i.test(html)) ||
  'placeholder text found in dist/index.html'
);

check('BLOCKER', 'PUBLIC_HOST is set (private preview stays private)', () =>
  !!cfg.vars?.PUBLIC_HOST || 'missing — every hostname would serve the site publicly'
);

check('BLOCKER', 'Access team domain and AUD are set (admin fails closed)', () =>
  (!!cfg.vars?.ACCESS_TEAM_DOMAIN && !!cfg.vars?.ACCESS_AUD) ||
  'missing — the admin panel will deny every request, including yours'
);

check('BLOCKER', 'Worker runs before assets on /api and /admin', () => {
  const first = cfg.assets?.run_worker_first || [];
  return (first.includes('/admin') && first.some((p) => p.startsWith('/api'))) ||
    `run_worker_first is ${JSON.stringify(first)}`;
});

check('BLOCKER', 'rate_limits migration exists', () =>
  exists(path.join(APP, 'migrations/0002_create_rate_limits.sql')) ||
  'migration 0002 missing — the limiter will fail open on every request'
);

check('BLOCKER', 'Site is not carrying a noindex', () =>
  (!/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) || 'the homepage has a noindex meta tag'
);

check('BLOCKER', 'robots.txt does not disallow everything', () => {
  const robots = read(path.join(DIST, 'robots.txt'));
  return (!/^\s*Disallow:\s*\/\s*$/m.test(robots)) || 'robots.txt blocks the whole site';
});

check('BLOCKER', 'Canonical points at the apex', () =>
  /rel="canonical"\s+href="https:\/\/hardikajmeriya\.com\/"/.test(html) || 'canonical is wrong or missing'
);

check('BLOCKER', 'Prerendered HTML is populated', () => {
  const body = html.split('<div id="root">')[1] || '';
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 5000 || `only ${text.length} chars of prerendered text`;
});

check('BLOCKER', 'Footer hosting claim is accurate', () =>
  (html.includes('Deployed on Cloudflare') && !html.includes('Deployed on AWS')) ||
  'the footer still claims AWS'
);

check('BLOCKER', 'Favicon set present at the site root', () => {
  const missing = ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
    'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png',
    'site.webmanifest'].filter((f) => !exists(path.join(DIST, f)));
  return missing.length === 0 || `missing: ${missing.join(', ')}`;
});

check('BLOCKER', "CSP allows the manifest (manifest-src 'self')", () => {
  const headers = read(path.join(DIST, '_headers'));
  const csp = headers.split('\n').find((l) => l.includes('Content-Security-Policy')) || '';
  return csp.includes("manifest-src 'self'") || 'manifest-src missing — Android install will silently fail';
});

check('BLOCKER', 'No secrets committed to the build', () =>
  (!/re_[A-Za-z0-9]{20,}|sk_live|BEGIN [A-Z ]*PRIVATE KEY/.test(html)) ||
  'something that looks like an API key is in dist/index.html'
);

// ------------------------------------------------------------------- WARN

check('WARN', 'All liveUrl fields filled', () => {
  const urls = [...projects.matchAll(/liveUrl:\s*'([^']*)'/g)].map((m) => m[1]);
  const empty = urls.filter((u) => !u).length;
  return empty === 0 || `${empty} of ${urls.length} projects still have no live URL`;
});

check('WARN', 'Sitemap lastmod is within the last 30 days', () => {
  const sm = read(path.join(DIST, 'sitemap.xml'));
  const d = sm.match(/<lastmod>([\d-]+)<\/lastmod>/)?.[1];
  if (!d) return 'no lastmod found';
  const age = (Date.now() - new Date(d).getTime()) / 86400000;
  return age <= 30 || `lastmod is ${Math.round(age)} days old (${d})`;
});

check('WARN', 'Meta description fits in a search result', () => {
  const d = html.match(/name="description"\s+content="([^"]*)"/s)?.[1] || '';
  return (d.length >= 100 && d.length <= 160) || `${d.length} chars (aim for 120-160)`;
});

check('WARN', 'Every image declares width and height', () => {
  const imgs = html.match(/<img[^>]*>/g) || [];
  const bad = imgs.filter((t) => !t.includes('width=') || !t.includes('height='));
  return bad.length === 0 || `${bad.length} of ${imgs.length} images have no intrinsic size`;
});

check('WARN', 'No third-party font stylesheet', () =>
  (!/<link[^>]*fonts\.(googleapis|gstatic)/.test(html)) || 'Google Fonts is back on the critical path'
);

check('WARN', 'Critical fonts are preloaded', () =>
  (html.match(/rel="preload"[^>]*as="font"/g) || []).length >= 2 || 'font preloads missing'
);

check('WARN', 'Deploy payload under 5 MB', () => {
  let total = 0;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else total += fs.statSync(p).size;
  });
  walk(DIST);
  const mb = total / 1024 / 1024;
  return mb < 5 || `dist is ${mb.toFixed(1)} MB`;
});

check('WARN', 'No unreferenced images in the deploy', () => {
  const imgDir = path.join(DIST, 'images');
  if (!exists(imgDir)) return true;
  const referenced = new Set();
  for (const f of ['index.html', '404.html', 'llms.txt', 'sitemap.xml']) {
    const p = path.join(DIST, f);
    if (exists(p)) for (const m of read(p).matchAll(/\/images\/([A-Za-z0-9_.-]+)/g)) referenced.add(m[1]);
  }
  const orphans = fs.readdirSync(imgDir).filter((f) => !referenced.has(f));
  return orphans.length === 0 || `unused: ${orphans.join(', ')}`;
});

check('WARN', 'X/Twitter profile present in sameAs', () =>
  html.includes('x.com/') || 'no X handle in the structured data (fine if you have no account)'
);

// ------------------------------------------------------------------ OUTPUT

const pad = Math.max(...results.map((r) => r.name.length));
let blockers = 0;
let warns = 0;

for (const tier of ['BLOCKER', 'WARN']) {
  console.log(`\n  ${tier === 'BLOCKER' ? 'MUST PASS BEFORE LAUNCH' : 'WORTH FIXING'}`);
  console.log('  ' + '-'.repeat(pad + 12));
  for (const r of results.filter((x) => x.tier === tier)) {
    if (!r.ok) tier === 'BLOCKER' ? (blockers += 1) : (warns += 1);
    const mark = r.ok ? 'ok  ' : (tier === 'BLOCKER' ? 'FAIL' : 'warn');
    console.log(`  ${mark}  ${r.name.padEnd(pad)}${r.ok ? '' : '  <- ' + r.detail}`);
  }
}

console.log();
if (blockers) {
  console.log(`  ${blockers} blocker(s). DO NOT SWAP THE DOMAIN YET.\n`);
  process.exit(1);
}
console.log(`  No blockers.${warns ? `  ${warns} warning(s).` : ''}  Safe to launch.\n`);
process.exit(0);
