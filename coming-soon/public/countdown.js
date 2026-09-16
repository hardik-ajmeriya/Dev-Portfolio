/*
 * Launch countdown.
 *
 * Lives in its own file rather than inline because the CSP on this page is
 * `script-src 'self'` with no 'unsafe-inline' — an inline <script> would be
 * silently refused by the browser.
 *
 * Progressive enhancement: the HTML already contains a readable launch date.
 * This script adds the ticking digits on top of it, so a visitor with no
 * JavaScript still sees when the site opens rather than an empty box.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * THE ONE THING TO EDIT IF THE DATE MOVES.
   *
   * Written as a UTC instant on purpose. The audience is international, so
   * "22:00" alone is meaningless — this is one fixed moment in time that
   * every visitor's browser converts into their own clock.
   *
  * 2026-09-16T06:30:00Z  =  Wed 16 Sept 2026, 12:00 IST
  *                       =  07:30 London, 08:30 Berlin, 02:30 New York
   *
   * This MUST match the human-readable time in index.html (#cdWhen) and the
   * TARGET in ../countdown.test.mjs. They disagreed once — the page promised
   * 12:00 IST while this counted to 13:00 — and the only symptom was an hour
   * still showing on the clock at the moment the page said the site was live.
   * ------------------------------------------------------------------ */
  var TARGET = Date.UTC(2026, 8, 16, 6, 30, 0); // month is 0-indexed: 8 = September

  /* How long after the target we keep saying "launching today" before giving
   * up and hiding the countdown entirely.
   *
   * This exists because a countdown that has hit zero and stayed there is
   * worse than no countdown at all — it advertises a missed deadline to every
   * visitor. After this window the block removes itself and the page looks
   * exactly as it did before the timer was added. */
  var GRACE_MS = 24 * 60 * 60 * 1000;

  /* Once the target has passed, re-check periodically so a tab left open
   * lands on the real site after the domain is swapped, instead of showing a
   * stale placeholder indefinitely. */
  var RELOAD_EVERY_MS = 3 * 60 * 1000;

  var root = document.getElementById('cd');
  if (!root) return;

  var grid = document.getElementById('cdGrid');
  var lead = document.getElementById('cdLead');
  var when = document.getElementById('cdWhen');
  var cells = {
    d: document.getElementById('cdD'),
    h: document.getElementById('cdH'),
    m: document.getElementById('cdM'),
    s: document.getElementById('cdS'),
  };
  if (!grid || !lead || !when || !cells.d) return;

  var pad = function (n) {
    return n < 10 ? '0' + n : String(n);
  };

  /* Write only when the value actually changed. Assigning textContent every
   * second on every cell makes the browser re-layout four elements a second
   * for no reason; days and hours change very rarely. */
  var last = {};
  var set = function (key, value) {
    if (last[key] === value) return;
    last[key] = value;
    cells[key].textContent = value;
  };

  /* Show the launch moment in the visitor's OWN timezone, named.
   *
   * The whole point of a countdown for an international audience is that
   * nobody has to do the arithmetic. Falls back silently to the IST text
   * already in the HTML if Intl is unavailable or the timezone cannot be
   * resolved. */
  function localiseWhen() {
    try {
      var opts = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      };
      var text = new Intl.DateTimeFormat(undefined, opts).format(new Date(TARGET));
      when.textContent = text + ' · your local time';
    } catch (err) {
      /* keep the server-rendered IST string */
    }
  }

  function finish(pastBy) {
    grid.hidden = true;
    if (pastBy > GRACE_MS) {
      // Slipped by more than a day. Remove the countdown rather than display
      // a broken promise.
      root.hidden = true;
      return false;
    }
    lead.textContent = 'Launching';
    when.textContent = 'Today. Refresh in a moment.';
    return true;
  }

  var reloadTimer = null;

  function tick() {
    var remaining = TARGET - Date.now();

    if (remaining <= 0) {
      var live = finish(-remaining);
      if (live && !reloadTimer) {
        reloadTimer = setInterval(function () {
          window.location.reload();
        }, RELOAD_EVERY_MS);
      }
      return;
    }

    var totalSeconds = Math.floor(remaining / 1000);
    set('d', pad(Math.floor(totalSeconds / 86400)));
    set('h', pad(Math.floor(totalSeconds / 3600) % 24));
    set('m', pad(Math.floor(totalSeconds / 60) % 60));
    set('s', pad(totalSeconds % 60));

    /* Align the next tick to the next real second boundary rather than
     * firing every 1000ms. setInterval drifts, and a drifting clock visibly
     * skips or repeats a second every minute or so. */
    setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
  }

  // Nothing to show if the date is already long gone.
  if (Date.now() - TARGET > GRACE_MS) {
    root.hidden = true;
    return;
  }

  grid.hidden = false;
  lead.textContent = 'Launching in';
  localiseWhen();
  tick();

  /* Re-sync when the tab comes back. A backgrounded tab has its timers
   * throttled to once a minute or so, so without this the digits are visibly
   * stale for a moment on return. */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tick();
  });
})();
