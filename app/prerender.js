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

const output = template.replace(PLACEHOLDER, `<div id="root">${appHtml}</div>`);
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

// dist-ssr is a build artifact, not something to deploy.
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
