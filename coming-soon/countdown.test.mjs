/**
 * Tests for the coming-soon countdown.
 *
 *     node coming-soon/countdown.test.mjs
 *
 * The interesting cases are not "does it count down" — they are the states
 * around zero. A countdown is only ever seen by strangers, and the two ways it
 * embarrasses you both happen after the deadline: sitting at 00:00:00:00
 * forever, or cheerfully announcing "launching today" a week late.
 *
 * Runs the real countdown.js against a minimal DOM stub with a frozen clock,
 * so no browser is needed.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = fs.readFileSync(path.join(HERE, 'public', 'countdown.js'), 'utf-8');

/** The target baked into countdown.js: Wed 16 Sept 2026, 12:00 IST. */
const TARGET = Date.UTC(2026, 8, 16, 6, 30, 0);

function makeDom() {
  const el = (id) => ({
    id,
    textContent: '',
    hidden: false,
    _listeners: {},
    addEventListener() {},
  });
  const ids = ['cd', 'cdGrid', 'cdLead', 'cdWhen', 'cdD', 'cdH', 'cdM', 'cdS'];
  const nodes = Object.fromEntries(ids.map((i) => [i, el(i)]));
  return {
    nodes,
    document: {
      hidden: false,
      getElementById: (id) => nodes[id] || null,
      addEventListener() {},
    },
  };
}

/** Run countdown.js with `now` as the current time. Timers are captured, not run. */
function run(now) {
  const dom = makeDom();
  const timeouts = [];
  const intervals = [];
  const reloads = { count: 0 };

  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  }

  const sandbox = {
    document: dom.document,
    Date: FrozenDate,
    Intl,
    setTimeout: (fn, ms) => {
      timeouts.push(ms);
      return timeouts.length;
    },
    setInterval: (fn, ms) => {
      intervals.push(ms);
      return intervals.length;
    },
    clearInterval: () => {},
    window: { location: { reload: () => (reloads.count += 1) } },
    console,
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);

  return { ...dom.nodes, timeouts, intervals, reloads };
}

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

const HOUR = 3600e3;
const DAY = 24 * HOUR;

console.log('=== COUNTING DOWN ===');

t('8 days out shows the right units', () => {
  const r = run(TARGET - (8 * DAY + 3 * HOUR + 4 * 60e3 + 5e3));
  eq(r.cdD.textContent, '08', 'days');
  eq(r.cdH.textContent, '03', 'hours');
  eq(r.cdM.textContent, '04', 'minutes');
  eq(r.cdS.textContent, '05', 'seconds');
});

t('units are zero padded to two digits', () => {
  const r = run(TARGET - (1 * DAY + 1 * HOUR + 1 * 60e3 + 1e3));
  eq(r.cdD.textContent, '01', 'days');
  eq(r.cdH.textContent, '01', 'hours');
});

t('hours roll over rather than accumulating past 24', () => {
  const r = run(TARGET - (2 * DAY + 23 * HOUR));
  eq(r.cdD.textContent, '02', 'days');
  eq(r.cdH.textContent, '23', 'hours');
});

t('one second remaining', () => {
  const r = run(TARGET - 1000);
  eq(r.cdD.textContent, '00', 'days');
  eq(r.cdH.textContent, '00', 'hours');
  eq(r.cdM.textContent, '00', 'minutes');
  eq(r.cdS.textContent, '01', 'seconds');
});

t('the digits are revealed and the lead reads "Launching in"', () => {
  const r = run(TARGET - 5 * DAY);
  eq(r.cdGrid.hidden, false, 'grid hidden');
  eq(r.cdLead.textContent, 'Launching in', 'lead');
  eq(r.cd.hidden, false, 'root hidden');
});

t('ticks are aligned to the second, not a fixed 1000ms interval', () => {
  const r = run(TARGET - 5 * DAY - 300); // 300ms past a second boundary
  if (!r.timeouts.length) throw new Error('no tick scheduled');
  const ms = r.timeouts[0];
  if (ms >= 1000) throw new Error(`scheduled ${ms}ms — that is a drifting interval, not an aligned tick`);
});

console.log();
console.log('=== AT AND AFTER ZERO — where a countdown goes wrong ===');

t('exactly at the target: switches to the launch message, no 00:00 left on screen', () => {
  const r = run(TARGET);
  eq(r.cdGrid.hidden, true, 'grid must be hidden');
  eq(r.cdLead.textContent, 'Launching', 'lead');
  eq(r.cdWhen.textContent, 'Today. Refresh in a moment.', 'when');
  eq(r.cd.hidden, false, 'block still visible');
});

t('two hours late: still shows the launch message and polls for the real site', () => {
  const r = run(TARGET + 2 * HOUR);
  eq(r.cd.hidden, false, 'still visible');
  eq(r.cdGrid.hidden, true, 'digits hidden');
  if (!r.intervals.length) throw new Error('no reload poll scheduled — a tab left open never sees the real site');
});

t('23 hours late: still inside the grace window', () => {
  const r = run(TARGET + 23 * HOUR);
  eq(r.cd.hidden, false, 'still visible');
});

t('25 hours late: the countdown REMOVES ITSELF', () => {
  // The important one. A timer that sits at zero, or says "launching today"
  // two days running, advertises a missed deadline to every visitor. Past the
  // grace window the page must look exactly as it did before the timer existed.
  const r = run(TARGET + 25 * HOUR);
  eq(r.cd.hidden, true, 'root must be hidden');
});

t('a month late: still hidden, and no reload loop left running', () => {
  const r = run(TARGET + 30 * DAY);
  eq(r.cd.hidden, true, 'root hidden');
  eq(r.intervals.length, 0, 'reload interval count');
  eq(r.timeouts.length, 0, 'tick count');
});

console.log();
console.log('=== INTERNATIONAL AUDIENCE ===');

t('the date line is rewritten into the viewer local timezone', () => {
  const r = run(TARGET - 3 * DAY);
  if (!/your local time/.test(r.cdWhen.textContent)) {
    throw new Error('date line was not localised: ' + r.cdWhen.textContent);
  }
});

t('the localised line names a month and a time', () => {
  const r = run(TARGET - 3 * DAY);
  const text = r.cdWhen.textContent;
  if (!/September/i.test(text)) throw new Error('no month in: ' + text);
  if (!/\d{1,2}:\d{2}/.test(text)) throw new Error('no time in: ' + text);
});

t('the target is a fixed UTC instant, not a local wall-clock time', () => {
  // If the target were built from local components, this file would resolve to
  // a different moment for every visitor and the countdown would be wrong for
  // everyone outside IST.
  const src = SOURCE;
  if (!/Date\.UTC\(/.test(src)) throw new Error('target is not defined with Date.UTC');
  if (/new Date\(\s*['"]20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\s*['"]\s*\)/.test(src)) {
    throw new Error('target parsed from a string without a timezone — that is local time');
  }
});

t('the baked-in target really is 12:00 IST on Wed 16 Sept 2026', () => {
  const ist = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(TARGET));
  // "Sept" vs "Sep" varies with the ICU version Node was built against, so
  // match the part that is stable rather than the abbreviation.
  if (!/Wed/.test(ist) || !/16 Sept? 2026/.test(ist) || !/12:00/.test(ist)) {
    throw new Error('target is ' + ist);
  }
});

/**
 * The test above formats TARGET — this file's own constant. On its own that
 * proves nothing about countdown.js, and for a while it proved nothing very
 * convincingly: the page and this file both said 12:00 IST while countdown.js
 * counted to 13:00, and this test passed throughout. Read the real value out
 * of the source so the two can never drift apart again.
 */
t('countdown.js counts to exactly the TARGET this file tests against', () => {
  const m = SOURCE.match(/var TARGET = Date\.UTC\(([^)]*)\)/);
  if (!m) throw new Error('could not find TARGET in countdown.js');
  const [y, mo, d, h, mi] = m[1].split(',').map((n) => parseInt(n.trim(), 10));
  const baked = Date.UTC(y, mo, d, h, mi || 0);
  if (baked !== TARGET) {
    throw new Error(
      `countdown.js counts to ${new Date(baked).toISOString()} but this file expects ${new Date(TARGET).toISOString()}`
    );
  }
});

/**
 * And the page itself must say the same thing in words. The countdown is the
 * machine-readable half of a promise; #cdWhen is the half a visitor reads.
 */
t('index.html tells visitors the same time the countdown counts to', () => {
  const html = fs.readFileSync(path.join(HERE, 'public', 'index.html'), 'utf-8');
  const m = html.match(/id="cdWhen"[^>]*>([^<]+)</);
  if (!m) throw new Error('could not find #cdWhen in index.html');
  const shown = m[1].replace(/&middot;/g, '·').trim();
  const ist = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(TARGET));
  if (!shown.includes(ist)) {
    throw new Error(`page says "${shown}" but the countdown targets ${ist} IST`);
  }
});

console.log();
console.log('=== ACCESSIBILITY (markup) ===');

const html = fs.readFileSync(path.join(HERE, 'public', 'index.html'), 'utf-8');

t('the ticking digits are aria-hidden', () => {
  const grid = html.match(/<ol class="cd-grid"[^>]*>/)[0];
  if (!/aria-hidden="true"/.test(grid)) {
    throw new Error('a screen reader would announce a new number every second');
  }
});

t('an accessible, non-ticking date is present in the markup', () => {
  if (!/class="cd-when"[^>]*>[^<]*September 2026/.test(html)) {
    throw new Error('no static date for assistive tech, or for JS-off visitors');
  }
});

t('the date is readable with JavaScript disabled', () => {
  // The digits start hidden and are revealed by JS; the date line must not be.
  const when = html.match(/<p class="cd-when"[^>]*>/)[0];
  if (/hidden/.test(when)) throw new Error('the fallback date is hidden by default');
});

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
