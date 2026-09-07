#!/usr/bin/env node
/**
 * Design-leak guard for the coming-soon page.
 *
 *     node scripts/check-design-leak.mjs
 *
 * The coming-soon placeholder is public at hardikajmeriya.com while the real
 * site is not. The real site's visual identity is part of the unreleased work,
 * so the placeholder must not preview it — not the typefaces, not the palette,
 * not the headline.
 *
 * This is easy to get wrong by accident: copying a component across for its
 * layout brings the fonts with it, and reusing "the brand colour" for an
 * accent is a one-character change that leaks the whole palette.
 *
 * Matching is deliberately precise rather than substring-based. A first
 * version flagged `pointer-events`, `international` and `setInterval` as
 * leaks of the font "Inter", which is exactly the kind of noise that trains
 * you to ignore a checker.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = path.join(ROOT, 'coming-soon', 'public');

/** Signature tokens of the real site. None of these may appear on the placeholder. */
const SIGNATURES = [
  // Typefaces — matched as quoted font-family values or Google Fonts params,
  // so ordinary English words containing them do not trip the check.
  { label: 'font: Bricolage Grotesque', re: /Bricolage[+\s]?Grotesque/i },
  { label: 'font: Inter', re: /(['"])Inter\1|family=Inter|font-family:\s*Inter\b/i },
  { label: 'font: JetBrains Mono', re: /JetBrains[+\s]?Mono/i },

  // Palette — the exact hex values from tailwind.config.js.
  { label: 'colour: paper #f4f4f1', re: /#f4f4f1/i },
  { label: 'colour: paperAlt #ebebe7', re: /#ebebe7/i },
  { label: 'colour: ink #0b0b0d', re: /#0b0b0d/i },
  { label: 'colour: muted #5c5c64', re: /#5c5c64/i },
  { label: 'colour: line #e2e2dd', re: /#e2e2dd/i },
  { label: 'colour: accent #3d2ef5', re: /#3d2ef5/i },
  { label: 'colour: accent2 #00d4a0', re: /#00d4a0/i },

  // Copy that only exists on the real site.
  { label: 'headline copy', re: /I build web apps|into production\./i },
  { label: 'positioning copy', re: /hand you a (repository|running application)/i },
  { label: 'section labels', re: /SELECTED WORK|What I\s*(provide|work with)/i },

  // Structural giveaways.
  { label: 'the 3D hero scene', re: /three\.?js|IcosahedronGeometry|WebGLRenderer/i },
  { label: 'project imagery', re: /cureneed|dcpvas|prometheus\.webp|pipeline\.webp/i },
];

if (!fs.existsSync(DIR)) {
  console.error(`\n  ${path.relative(ROOT, DIR)} not found.\n`);
  process.exit(2);
}

const files = fs
  .readdirSync(DIR)
  .filter((f) => /\.(html|css|js|json|webmanifest|txt)$/.test(f));

const leaks = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(DIR, file), 'utf-8');
  const lines = text.split('\n');
  for (const sig of SIGNATURES) {
    lines.forEach((line, i) => {
      if (sig.re.test(line)) {
        leaks.push({ file, line: i + 1, label: sig.label, text: line.trim().slice(0, 90) });
      }
    });
  }
}

console.log(`\n  Scanned ${files.length} file(s) in coming-soon/public\n`);

if (!leaks.length) {
  console.log('  No leaks. The placeholder shares nothing with the real site.\n');
  process.exit(0);
}

for (const l of leaks) {
  console.log(`  LEAK  ${l.file}:${l.line}  ${l.label}`);
  console.log(`        ${l.text}`);
}
console.log(`\n  ${leaks.length} leak(s). The unreleased design is visible on a public page.\n`);
process.exit(1);
