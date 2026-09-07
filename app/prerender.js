/**
 * Build-time prerender.
 *
 * Runs after both Vite builds:
 *   1. `vite build`                       -> dist/          (client bundle)
 *   2. `vite build --ssr src/entry-server.jsx` -> dist-ssr/  (server bundle)
 *   3. this script                        -> injects rendered HTML into dist/index.html
 *
 * Why: no major AI crawler (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot)
 * executes JavaScript. Without this step they receive `<div id="root"></div>`
 * and have nothing to index or cite. Googlebot does render JS, but static
 * HTML is faster and more reliable for it too.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

function fail(message) {
  console.error(`\n[prerender] ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(templatePath)) fail('dist/index.html not found — run `vite build` first.');
if (!fs.existsSync(ssrEntry)) fail('dist-ssr/entry-server.js not found — the SSR build did not run.');

const template = fs.readFileSync(templatePath, 'utf-8');

const PLACEHOLDER = '<div id="root"></div>';
if (!template.includes(PLACEHOLDER)) {
  fail(`could not find \`${PLACEHOLDER}\` in dist/index.html — did index.html change?`);
}

const { render } = await import(`file://${ssrEntry}`);
const appHtml = render();

if (!appHtml || appHtml.length < 500) {
  fail(`render produced only ${appHtml ? appHtml.length : 0} characters — expected the full page.`);
}

let output = template.replace(PLACEHOLDER, `<div id="root">${appHtml}</div>`);

/*
 * Inject the structured data, generated from the same data files the page was
 * just rendered from. See scripts/build-schema.mjs for why it is derived
 * rather than written by hand in index.html.
 */
const { schemaScriptTag, buildSchema } = await import('../scripts/build-schema.mjs');
const schema = buildSchema();
const schemaTag = schemaScriptTag();

if (!schemaTag.includes('"@graph"')) {
  fail('schema generation produced no @graph — structured data would ship empty.');
}
output = output.replace('</head>', `  ${schemaTag}\n  </head>`);

const nodeTypes = schema['@graph'].map((n) =>
  Array.isArray(n['@type']) ? n['@type'].join('+') : n['@type']
);
console.log(`[prerender] structured data: ${schema['@graph'].length} linked nodes`);
console.log(`[prerender]   ${nodeTypes.join(', ')}`);

/*
 * Preload the two fonts the first screen actually needs: Bricolage 800 (the
 * h1, which is the LCP element) and Inter 400 (all body copy).
 *
 * Without this the browser cannot discover them until it has downloaded and
 * parsed the CSS bundle, which costs a round trip at exactly the moment that
 * matters. The filenames are content-hashed by Vite, so they are read from
 * the build output rather than hardcoded — a hardcoded name would silently
 * stop matching on the next build and the preload would just be dead weight.
 */
const assetsDir = path.join(distDir, 'assets');
const fontFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const CRITICAL = [/^bricolage-grotesque-latin-800-normal.*\.woff2$/, /^inter-latin-400-normal.*\.woff2$/];

const preloads = CRITICAL.map((pattern) => fontFiles.find((f) => pattern.test(f)))
  .filter(Boolean)
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`)
  .join('\n    ');

if (preloads) {
  output = output.replace('</head>', `  ${preloads}\n  </head>`);
  console.log(`[prerender] preloading ${preloads.split('<link').length - 1} critical font file(s)`);
} else {
  console.warn('[prerender] WARNING: no critical font files matched — preload tags were not injected');
}

fs.writeFileSync(templatePath, output);

// Report what a non-JS crawler will now actually see.
const visibleText = output
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

console.log(`[prerender] injected ${appHtml.length.toLocaleString()} chars of HTML`);
console.log(`[prerender] crawlers now see ${visibleText.length.toLocaleString()} chars of visible text`);

/*
 * Drop the legacy .woff fallbacks.
 *
 * Fontsource's CSS lists woff2 first and woff second. Every browser that can
 * run this site supports woff2 (universal since 2016), so the .woff copies
 * are never requested — they are just ~170 KB uploaded on every deploy. The
 * @font-face rules are rewritten first so nothing points at a file that is
 * no longer there.
 */
const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
let removedWoff = 0;

for (const file of assetFiles.filter((f) => f.endsWith('.css'))) {
  const cssPath = path.join(assetsDir, file);
  const before = fs.readFileSync(cssPath, 'utf-8');
  const after = before.replace(/,\s*url\([^)]*\.woff\)\s*format\(["']woff["']\)/g, '');
  if (after !== before) fs.writeFileSync(cssPath, after);
}

for (const file of assetFiles.filter((f) => f.endsWith('.woff'))) {
  fs.rmSync(path.join(assetsDir, file));
  removedWoff += 1;
}
if (removedWoff) console.log(`[prerender] removed ${removedWoff} unused legacy .woff file(s)`);

// dist-ssr is a build artifact, not something to deploy.
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
