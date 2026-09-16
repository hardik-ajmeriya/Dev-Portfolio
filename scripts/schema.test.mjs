/**
 * Structured-data tests.
 *
 *     node scripts/schema.test.mjs        (after `cd app && npm run build`)
 *
 * Two jobs:
 *
 *  1. Validate the graph is internally consistent — every @id referenced by
 *     another node actually exists. A dangling reference is the classic
 *     JSON-LD bug: it parses fine, validates against schema.org, and silently
 *     conveys nothing because the thing it points at is not there.
 *
 *  2. Assert the schema still matches the rendered page. This is the failure
 *     the generated approach exists to prevent, so it deserves a test that
 *     would catch it coming back.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSchema } from './build-schema.mjs';
import { faqs } from '../app/src/data/faq.js';
import { projects, projectImages } from '../app/src/data/projects.js';
import { services } from '../app/src/data/services.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'app', 'dist', 'index.html');

let pass = 0;
let fail = 0;
const t = (name, fn) => {
  try {
    fn();
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

const graph = buildSchema()['@graph'];
const byId = Object.fromEntries(graph.map((n) => [n['@id'], n]));
const typeOf = (n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]);
const find = (type) => graph.filter((n) => typeOf(n).includes(type));

console.log('=== GRAPH INTEGRITY ===');

t('every @id in the graph is unique', () => {
  const ids = graph.map((n) => n['@id']);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error('duplicate @id: ' + dupes.join(', '));
});

t('every @id REFERENCE resolves to a node in the graph', () => {
  // The bug this catches: {"author": {"@id": "...#hardikk"}} — parses, validates,
  // means nothing, and nothing tells you.
  const dangling = [];
  const walk = (node, at) => {
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${at}[${i}]`));
    if (!node || typeof node !== 'object') return;
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === '@id' && !byId[node['@id']]) {
      dangling.push(`${at} -> ${node['@id']}`);
    }
    for (const [k, v] of Object.entries(node)) if (k !== '@id') walk(v, `${at}.${k}`);
  };
  graph.forEach((n) => walk(n, typeOf(n)[0]));
  if (dangling.length) throw new Error('dangling: ' + dangling.join('; '));
});

t('the Person node is referenced by everything that should cite it', () => {
  const personId = find('Person')[0]['@id'];
  const wants = ['FAQPage', 'ProfessionalService', 'WebSite', 'SoftwareSourceCode'];
  for (const type of wants) {
    const node = find(type)[0];
    const json = JSON.stringify(node);
    if (!json.includes(personId)) throw new Error(`${type} does not reference the Person`);
  }
});

t('exactly one Person and one ProfessionalService', () => {
  eq(find('Person').length, 1, 'Person count');
  eq(find('ProfessionalService').length, 1, 'ProfessionalService count');
});

console.log();
console.log('=== DERIVED FROM THE DATA, NOT HAND-COPIED ===');

t('every FAQ in faq.js is in the schema, with identical text', () => {
  const faq = find('FAQPage')[0];
  eq(faq.mainEntity.length, faqs.length, 'question count');
  faqs.forEach((f, i) => {
    eq(faq.mainEntity[i].name, f.q.replace(/\s+/g, ' ').trim(), `Q${i + 1}`);
    eq(faq.mainEntity[i].acceptedAnswer.text, f.a.replace(/\s+/g, ' ').trim(), `A${i + 1}`);
  });
});

t('every project in projects.js has a node', () => {
  const nodes = [...find('SoftwareSourceCode'), ...find('CreativeWork')];
  eq(nodes.length, projects.length, 'project node count');
  for (const p of projects) {
    if (!nodes.find((n) => n.name === p.title)) throw new Error('no node for ' + p.id);
  }
});

t('a project with a repo is SoftwareSourceCode; one without is CreativeWork', () => {
  // Nothing may claim a repository it cannot show.
  for (const p of projects) {
    const node = graph.find((n) => n.name === p.title);
    const want = p.githubUrl ? 'SoftwareSourceCode' : 'CreativeWork';
    eq(typeOf(node)[0], want, `${p.id} type`);
    if (p.githubUrl) eq(node.codeRepository, p.githubUrl, `${p.id} repo`);
    if (!p.githubUrl && node.codeRepository) throw new Error(`${p.id} claims a repo it has no URL for`);
  }
});

t('a project url is only present when liveUrl is set', () => {
  for (const p of projects) {
    const node = graph.find((n) => n.name === p.title);
    if (!p.liveUrl && node.url) throw new Error(`${p.id} advertises a live URL that does not exist`);
    if (p.liveUrl) eq(node.url, p.liveUrl, `${p.id} url`);
  }
});

t('every service in services.js is in the offer catalog', () => {
  const cat = find('ProfessionalService')[0].hasOfferCatalog.itemListElement;
  eq(cat.length, services.length, 'offer count');
  services.forEach((s, i) => {
    eq(cat[i].itemOffered.name, s.title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(), `service ${i + 1}`);
  });
});

console.log();
console.log('=== MATCHES THE RENDERED PAGE ===');

if (!fs.existsSync(DIST)) {
  console.log('  SKIP  dist/index.html not built — run `cd app && npm run build` first');
} else {
  const html = fs.readFileSync(DIST, 'utf-8');
  /* Decode the HTML entities the renderer emits before comparing. The page
   * writes "Prometheus &amp; Grafana"; the JSON-LD, being inside a script
   * tag, writes a bare "&". Google decodes both to the same string, so a
   * comparison that does not decode reports a mismatch that is not real. */
  const decode = (s) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, '’')
      .replace(/&mdash;/g, '—')
      .replace(/&nbsp;/g, ' ');

  const text = decode(
    html
      .split('<div id="root">')[1]
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ');

  t('exactly one JSON-LD block ships (one graph, not four islands)', () => {
    eq((html.match(/application\/ld\+json/g) || []).length, 1, 'block count');
  });

  t('the shipped JSON-LD parses', () => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('no JSON-LD in the built page');
    JSON.parse(m[1].replace(/\\u003c/g, '<'));
  });

  t('every FAQ question in the schema is visible on the page', () => {
    // Google drops the rich result when structured data claims content the
    // visitor cannot see.
    for (const f of faqs) {
      const q = f.q.replace(/'/g, '’');
      if (!text.includes(q) && !text.includes(f.q)) {
        throw new Error('question not rendered: ' + f.q.slice(0, 50));
      }
    }
  });

  t('every project name in the schema is visible on the page', () => {
    for (const p of projects) {
      const name = p.title.replace(/'/g, '’');
      if (!text.includes(name) && !text.includes(p.title)) {
        throw new Error('project not rendered: ' + p.title);
      }
    }
  });

  t('no "</script" can break out of the JSON-LD block', () => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (/<\/script/i.test(m[1])) throw new Error('unescaped </script inside the JSON-LD');
  });
}

console.log();
console.log('=== ENTITY SIGNALS ===');

t('sameAs contains only absolute https URLs, no placeholders', () => {
  for (const u of find('Person')[0].sameAs) {
    if (!/^https:\/\//.test(u)) throw new Error('not an https URL: ' + u);
    if (/REPLACE|example\.com|your-handle/i.test(u)) throw new Error('placeholder in sameAs: ' + u);
  }
});

t('the Person has an image, a location and a job title', () => {
  const p = find('Person')[0];
  for (const k of ['image', 'address', 'jobTitle', 'description', 'knowsAbout']) {
    if (!p[k]) throw new Error('Person is missing ' + k);
  }
});

t('knowsAbout is substantial and deduplicated', () => {
  const k = find('Person')[0].knowsAbout;
  if (k.length < 20) throw new Error(`only ${k.length} topics`);
  if (new Set(k).size !== k.length) throw new Error('knowsAbout contains duplicates');
});

t('areaServed does not contradict the page copy', () => {
  // The FAQ says "clients in any timezone" and Contact says "available
  // worldwide". A schema that claimed India only would disagree with both.
  const areas = find('ProfessionalService')[0].areaServed.map((a) => a.name);
  if (areas.length < 2) throw new Error('areaServed is India-only but the page says worldwide');
});

console.log();
console.log('=== ADDED FOR ENTITY / BRAND SEO ===');

t('Person has contactPoint, identifier and subjectOf', () => {
  const p = find('Person')[0];
  for (const k of ['contactPoint', 'identifier', 'subjectOf', 'worksFor', 'hasOccupation']) {
    if (!p[k]) throw new Error('Person is missing ' + k);
  }
});

t('the CV is a real node with a clean URL', () => {
  const cv = find('DigitalDocument')[0];
  if (!cv) throw new Error('no DigitalDocument for the CV');
  eq(cv.url, 'https://hardikajmeriya.com/resume', 'url');
  eq(cv.encodingFormat, 'application/pdf', 'format');
  if (!JSON.stringify(cv).includes(find('Person')[0]['@id'])) throw new Error('CV is not linked to the Person');
});

t('the business has a square logo distinct from the OG image', () => {
  const b = find('ProfessionalService')[0];
  if (!b.logo) throw new Error('no logo');
  eq(b.logo.width, b.logo.height, 'logo must be square');
  if (b.logo.url === b.image) throw new Error('logo and image are the same asset');
});

t('every screenshot of every project is in the schema', () => {
  for (const p of projects) {
    const node = graph.find((n) => n.name === p.title);
    const want = projectImages(p).map((i) => `https://hardikajmeriya.com${i.src}`);
    eq(JSON.stringify(node.image), JSON.stringify(want), `${p.id} images`);
  }
});

t('project images are always an array, even with one screenshot', () => {
  // A bare string here would work for Google but break any consumer that
  // assumes the shape is stable across projects.
  for (const p of projects) {
    const node = graph.find((n) => n.name === p.title);
    if (!Array.isArray(node.image)) throw new Error(`${p.id} image is not an array`);
    if (!node.image.length) throw new Error(`${p.id} has no image at all`);
  }
});

console.log();
console.log('=== NO FAKE MARKUP ===');

t('NO SearchAction — the site has no search endpoint', () => {
  // Requested, and deliberately refused. The sitelinks search box requires a
  // working search URL; declaring one the site cannot serve is markup for a
  // feature that does not exist.
  if (JSON.stringify(graph).includes('SearchAction')) {
    throw new Error('SearchAction declared without a search endpoint');
  }
});

t('NO BreadcrumbList — one page, no hierarchy to describe', () => {
  if (JSON.stringify(graph).includes('BreadcrumbList')) {
    throw new Error('breadcrumbs on a single-page site describe a trail that does not exist');
  }
});

t('no aggregateRating, review or award without a source', () => {
  const json = JSON.stringify(graph);
  for (const t of ['aggregateRating', '"Review"', '"award"']) {
    if (json.includes(t)) throw new Error(`${t} present with nothing real behind it`);
  }
});

t('no empty or placeholder property values anywhere', () => {
  const bad = [];
  const walk = (n, at) => {
    if (Array.isArray(n)) return n.forEach((x, i) => walk(x, `${at}[${i}]`));
    if (n && typeof n === 'object') return Object.entries(n).forEach(([k, v]) => walk(v, `${at}.${k}`));
    if (typeof n === 'string' && (n.trim() === '' || /TODO|TBD|REPLACE|example\.com|your-/i.test(n))) {
      bad.push(`${at} = ${JSON.stringify(n)}`);
    }
  };
  graph.forEach((n) => walk(n, typeOf(n)[0]));
  if (bad.length) throw new Error(bad.join('; '));
});

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
