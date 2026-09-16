/**
 * The admin panel, served as a single self-contained HTML document.
 *
 * Deliberately not part of the React app:
 *  - it would be bundled into the public build, so the markup and logic of a
 *    private tool would ship to every visitor
 *  - it needs no SEO, no prerendering and no shared components
 *  - one file the Worker returns means it can never be reached without
 *    passing through the Access check first
 *
 * Styling mirrors the site's design tokens so it feels like the same product.
 */

export function adminPage(email, isDev = false) {
  const safeEmail = String(email).replace(/[<>&"]/g, '');

  const devBanner = isDev
    ? `<div class="devbar">
         LOCAL DEV — Cloudflare Access is NOT protecting this page.
         Anyone who can reach this port can read your enquiries.
       </div>`
    : '';

  // Cloudflare Access exposes a logout endpoint on every protected hostname.
  // It has no equivalent in wrangler dev, so locally it is shown disabled
  // rather than as a link that would 404.
  const signOut = isDev
    ? `<span class="btn is-disabled" title="Cloudflare Access is not running locally">Sign out</span>`
    : `<a class="btn" href="/cdn-cgi/access/logout">Sign out</a>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Enquiries — Hardik Ajmeriya</title>
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#f4f4f1; --paper-2:#ebebe7; --ink:#0b0b0d; --muted:#6b6b73;
    --line:#e2e2dd; --accent:#3d2ef5; --accent2:#00d4a0; --warn:#c2410c; --danger:#dc2626;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased}
  .mono{font-family:'JetBrains Mono',monospace}
  .display{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;letter-spacing:-.03em}
  button{font-family:inherit}

  .devbar{background:#fef3c7;border-bottom:1px solid #fcd34d;color:#92400e;
    padding:10px 24px;font:600 12.5px/1.4 'JetBrains Mono',monospace;letter-spacing:.03em;text-align:center}

  header{border-bottom:1px solid var(--line);background:var(--paper);position:sticky;top:0;z-index:30}
  .bar{max-width:1500px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .bar h1{font-size:20px}
  .spacer{margin-left:auto}
  .who{font-size:12px;color:var(--muted)}

  .btn{border:1px solid var(--line);background:#fff;border-radius:9px;padding:9px 15px;
    font-size:13px;font-weight:600;cursor:pointer;color:var(--ink);text-decoration:none;display:inline-block;white-space:nowrap}
  .btn:hover{background:var(--paper-2)}
  .btn.is-disabled{opacity:.45;cursor:not-allowed}
  .btn.primary{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .btn.primary:hover{background:var(--accent)}
  .btn.danger{color:var(--danger);border-color:#fecaca}
  .btn.danger:hover{background:#fef2f2}

  .wrap{max-width:1500px;margin:0 auto;padding:24px}

  /* ---- status tracker ---- */
  .tracker{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:22px}
  .stat{border:1px solid var(--line);background:#fff;border-radius:12px;padding:16px 18px;cursor:pointer;
    transition:border-color .2s,box-shadow .2s;text-align:left}
  .stat:hover{border-color:var(--ink)}
  .stat.on{border-color:var(--ink);box-shadow:inset 0 -3px 0 var(--accent)}
  .stat .k{font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;
    letter-spacing:.1em;color:var(--muted)}
  .stat .v{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:28px;letter-spacing:-.03em;margin-top:4px}
  .stat.s-new .v{color:var(--accent)}
  .stat.s-won .v{color:#047857}
  .stat.s-overdue .v{color:var(--warn)}

  .toolbar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
  input[type=search]{flex:1;min-width:240px;border:1px solid var(--line);border-radius:10px;
    padding:10px 14px;font-size:14px;background:#fff;outline:none;font-family:inherit}
  input[type=search]:focus{border-color:var(--ink);box-shadow:0 0 0 4px rgba(61,46,245,.10)}

  /* ---- table ---- */
  .tablewrap{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:auto}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.09em;
    color:var(--muted);text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);
    background:var(--paper);position:sticky;top:0;white-space:nowrap}
  th.sortable{cursor:pointer;user-select:none}
  th.sortable:hover{color:var(--ink)}
  td{padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tbody tr{cursor:pointer;transition:background .12s}
  tbody tr:hover{background:var(--paper-2)}
  .nm{font-weight:600}
  .sub{font-size:12.5px;color:var(--muted)}
  .nowrap{white-space:nowrap}

  .tag{display:inline-block;border-radius:99px;padding:3px 10px;font-family:'JetBrains Mono',monospace;
    font-size:10px;text-transform:uppercase;letter-spacing:.07em;border:1px solid;white-space:nowrap}
  .t-new{color:var(--accent);border-color:#c7c2fd;background:#f0efff}
  .t-replied{color:#0369a1;border-color:#bae6fd;background:#f0f9ff}
  .t-won{color:#047857;border-color:#a7f3d0;background:#ecfdf5}
  .t-lost{color:var(--muted);border-color:var(--line);background:var(--paper)}
  .t-archived{color:var(--muted);border-color:var(--line);background:var(--paper)}
  .flag{color:var(--warn);font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}

  .empty{color:var(--muted);text-align:center;padding:60px 20px;font-size:14px}
  .empty code{background:var(--paper-2);padding:2px 6px;border-radius:4px;font-size:12.5px}

  /* ---- drawer ---- */
  .scrim{position:fixed;inset:0;background:rgba(11,11,13,.35);opacity:0;visibility:hidden;
    transition:opacity .25s,visibility .25s;z-index:40}
  .scrim.on{opacity:1;visibility:visible}
  .drawer{position:fixed;top:0;right:0;bottom:0;width:min(560px,100%);background:#fff;
    border-left:1px solid var(--line);z-index:50;transform:translateX(100%);
    transition:transform .3s cubic-bezier(.16,1,.3,1);overflow-y:auto}
  .drawer.on{transform:none}
  .dhead{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);
    padding:20px 24px;display:flex;align-items:flex-start;gap:14px;z-index:2}
  .dhead h2{font-size:21px;line-height:1.25}
  .close{margin-left:auto;border:none;background:none;font-size:24px;line-height:1;
    color:var(--muted);cursor:pointer;padding:0 4px}
  .close:hover{color:var(--ink)}
  .dbody{padding:24px}

  /* ---- status stepper ---- */
  .stepper{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
  .step{flex:1;min-width:74px;border:1px solid var(--line);background:#fff;border-radius:8px;
    padding:9px 6px;font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;
    letter-spacing:.06em;color:var(--muted);cursor:pointer;transition:.2s;text-align:center}
  .step:hover{border-color:var(--ink);color:var(--ink)}
  .step.done{background:var(--paper-2);color:var(--ink);border-color:var(--line)}
  .step.cur{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .step.cur.won{background:#047857;border-color:#047857}
  .step.cur.lost{background:var(--muted);border-color:var(--muted)}

  dl.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px 0;
    border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:20px 0}
  dl.grid dt{font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;
    letter-spacing:.1em;color:var(--muted);margin-bottom:3px}
  dl.grid dd{font-size:14px}
  .brief{white-space:pre-wrap;line-height:1.7;font-size:14.5px;background:var(--paper);
    border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:20px}
  label.f{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;
    letter-spacing:.1em;color:var(--muted);margin:0 0 6px}
  textarea,input[type=date]{width:100%;border:1px solid var(--line);border-radius:10px;
    padding:10px 12px;font-size:14px;font-family:inherit;background:#fff;outline:none}
  textarea:focus,input[type=date]:focus{border-color:var(--ink);box-shadow:0 0 0 4px rgba(61,46,245,.10)}
  .actions{display:flex;gap:10px;align-items:center;margin-top:18px;flex-wrap:wrap}
  .saved{color:var(--accent2);font-size:13px;opacity:0;transition:opacity .3s}
  .saved.on{opacity:1}
</style>
</head>
<body>

${devBanner}

<header>
  <div class="bar">
    <h1 class="display">Enquiries</h1>
    <a class="btn" href="/api/admin/export.csv">Export CSV</a>
    <a class="btn" href="/" target="_blank" rel="noopener">View site</a>
    <div class="spacer"></div>
    <div class="who">${safeEmail}</div>
    ${signOut}
  </div>
</header>

<div class="wrap">
  <div class="tracker" id="tracker"></div>

  <div class="toolbar">
    <input type="search" id="q" placeholder="Search name, email, company or brief…">
  </div>

  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th class="sortable" data-sort="created_at">Received</th>
          <th class="sortable" data-sort="name">Name</th>
          <th>Company</th>
          <th>Project</th>
          <th class="sortable" data-sort="budget">Budget</th>
          <th>Timeline</th>
          <th class="sortable" data-sort="status">Status</th>
          <th>Follow up</th>
        </tr>
      </thead>
      <tbody id="rows"><tr><td colspan="8" class="empty">Loading…</td></tr></tbody>
    </table>
  </div>
</div>

<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" aria-label="Enquiry detail"></aside>

<script>
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const STATUSES = ['new','replied','won','lost','archived'];
const FLOW = ['new','replied','won','lost'];

let state = { items: [], counts: {}, status: '', q: '', selected: null,
              sort: 'created_at', dir: 'desc' };

const fmt = iso => {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
};
const fmtShort = iso => {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', timeZone:'Asia/Kolkata' });
};
const today = () => new Date().toISOString().slice(0,10);
const overdue = d => d && d <= today();

async function load() {
  const p = new URLSearchParams();
  if (state.status) p.set('status', state.status);
  if (state.q) p.set('q', state.q);
  let res;
  try { res = await fetch('/api/admin/enquiries?' + p, { headers:{accept:'application/json'} }); }
  catch { return showError('Could not reach the API. Is <code>npm run dev:api</code> running?'); }
  if (!res.ok) return showError('The API returned ' + res.status + '.');
  const data = await res.json();
  state.items = data.enquiries;
  state.counts = data.counts || {};
  renderTracker();
  renderRows();
}

function showError(msg) {
  document.getElementById('rows').innerHTML =
    '<tr><td colspan="8" class="empty">' + msg + '</td></tr>';
}

function renderTracker() {
  const c = state.counts;
  const total = STATUSES.reduce((n,s)=>n+(c[s]||0), 0);
  const dueCount = state.items.filter(e => overdue(e.follow_up_on)).length;
  const cells = [
    { key:'',        label:'All',      value:total,        cls:'' },
    { key:'new',     label:'New',      value:c.new||0,     cls:'s-new' },
    { key:'replied', label:'Replied',  value:c.replied||0, cls:'' },
    { key:'won',     label:'Won',      value:c.won||0,     cls:'s-won' },
    { key:'lost',    label:'Lost',     value:c.lost||0,    cls:'' },
    { key:'archived',label:'Archived', value:c.archived||0,cls:'' },
  ];
  let html = cells.map(x => \`
    <button class="stat \${x.cls} \${state.status===x.key?'on':''}" data-status="\${x.key}">
      <div class="k">\${x.label}</div><div class="v">\${x.value}</div>
    </button>\`).join('');
  if (dueCount) html += \`
    <div class="stat s-overdue" style="cursor:default">
      <div class="k">Follow-up due</div><div class="v">\${dueCount}</div>
    </div>\`;
  const el = document.getElementById('tracker');
  el.innerHTML = html;
  el.querySelectorAll('.stat[data-status]').forEach(b =>
    b.onclick = () => { state.status = b.dataset.status; load(); });
}

function sorted(items) {
  const { sort, dir } = state;
  return [...items].sort((a,b) => {
    const A = (a[sort] ?? '').toString().toLowerCase();
    const B = (b[sort] ?? '').toString().toLowerCase();
    return (A < B ? -1 : A > B ? 1 : 0) * (dir === 'asc' ? 1 : -1);
  });
}

function renderRows() {
  const tb = document.getElementById('rows');
  if (!state.items.length) {
    tb.innerHTML = \`<tr><td colspan="8" class="empty">
      No enquiries\${state.status || state.q ? ' match this filter' : ' yet'}.
      \${state.status || state.q ? '' : '<br><br>Submit the contact form, or seed a row — see ADMIN.md.'}
    </td></tr>\`;
    return;
  }
  tb.innerHTML = sorted(state.items).map(e => \`
    <tr data-id="\${e.id}">
      <td class="nowrap sub">\${fmtShort(e.created_at)}</td>
      <td><div class="nm">\${esc(e.name)}</div><div class="sub">\${esc(e.email)}</div></td>
      <td class="sub">\${esc(e.company || '—')}</td>
      <td class="sub">\${esc(e.project_type)}</td>
      <td class="nowrap">\${esc(e.budget)}</td>
      <td class="nowrap sub">\${esc(e.timeline)}</td>
      <td><span class="tag t-\${e.status}">\${e.status}</span></td>
      <td class="nowrap">\${e.follow_up_on
          ? (overdue(e.follow_up_on) ? '<span class="flag">⚑ '+esc(e.follow_up_on)+'</span>'
                                     : '<span class="sub">'+esc(e.follow_up_on)+'</span>')
          : '<span class="sub">—</span>'}</td>
    </tr>\`).join('');
  tb.querySelectorAll('tr[data-id]').forEach(r =>
    r.onclick = () => openDrawer(Number(r.dataset.id)));
}

document.querySelectorAll('th.sortable').forEach(th => th.onclick = () => {
  const key = th.dataset.sort;
  state.dir = state.sort === key && state.dir === 'desc' ? 'asc' : 'desc';
  state.sort = key;
  renderRows();
});

/* ---------- drawer ---------- */
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('scrim');

function closeDrawer() {
  drawer.classList.remove('on'); scrim.classList.remove('on'); state.selected = null;
}
scrim.onclick = closeDrawer;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

function openDrawer(id) {
  const e = state.items.find(x => x.id === id);
  if (!e) return;
  state.selected = id;

  const stepIndex = FLOW.indexOf(e.status);
  const steps = FLOW.map((s, i) => {
    const cur = s === e.status;
    const done = stepIndex > -1 && i < stepIndex && s !== 'lost';
    return \`<button class="step \${cur?'cur '+s:''} \${done?'done':''}" data-set="\${s}">\${s}</button>\`;
  }).join('');

  drawer.innerHTML = \`
    <div class="dhead">
      <div>
        <h2 class="display">\${esc(e.name)}</h2>
        <div class="sub" style="margin-top:4px">
          <a href="mailto:\${esc(e.email)}">\${esc(e.email)}</a>
          \${e.company ? ' · ' + esc(e.company) : ''}
        </div>
      </div>
      <button class="close" id="x" aria-label="Close">×</button>
    </div>
    <div class="dbody">
      <label class="f">Status</label>
      <div class="stepper">\${steps}</div>
      <button class="step" data-set="archived" style="max-width:110px;margin-bottom:4px">archived</button>

      <dl class="grid">
        <div><dt>Project type</dt><dd>\${esc(e.project_type)}</dd></div>
        <div><dt>Budget</dt><dd>\${esc(e.budget)}</dd></div>
        <div><dt>Timeline</dt><dd>\${esc(e.timeline)}</dd></div>
        <div><dt>Received</dt><dd>\${fmt(e.created_at)}</dd></div>
      </dl>

      <label class="f">Brief</label>
      <div class="brief">\${esc(e.message)}</div>

      <label class="f" for="fu">Follow up on</label>
      <input type="date" id="fu" value="\${e.follow_up_on || ''}" style="margin-bottom:16px">

      <label class="f" for="nt">Private notes</label>
      <textarea id="nt" rows="5" placeholder="Call notes, quote sent, next step…">\${esc(e.notes)}</textarea>

      <div class="actions">
        <button class="btn primary" id="save">Save</button>
        <a class="btn" href="mailto:\${esc(e.email)}?subject=Re: your project enquiry">Reply</a>
        <button class="btn danger" id="del">Delete</button>
        <span class="saved" id="saved">Saved</span>
      </div>
    </div>\`;

  drawer.classList.add('on'); scrim.classList.add('on');
  document.getElementById('x').onclick = closeDrawer;

  drawer.querySelectorAll('[data-set]').forEach(b =>
    b.onclick = () => patch(e.id, { status: b.dataset.set }));

  document.getElementById('save').onclick = () => patch(e.id, {
    notes: document.getElementById('nt').value,
    follow_up_on: document.getElementById('fu').value || null,
  });

  document.getElementById('del').onclick = async () => {
    if (!confirm('Delete this enquiry permanently? This cannot be undone.')) return;
    const res = await fetch('/api/admin/enquiries/' + e.id, { method:'DELETE' });
    if (res.ok) { closeDrawer(); load(); } else alert('Could not delete (' + res.status + ').');
  };
}

async function patch(id, body) {
  const res = await fetch('/api/admin/enquiries/' + id, {
    method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
  if (!res.ok) { alert('Could not save (' + res.status + ').'); return; }
  const s = document.getElementById('saved');
  if (s) { s.classList.add('on'); setTimeout(()=>s.classList.remove('on'), 1500); }
  await load();
  if (state.selected) openDrawer(state.selected);
}

let timer;
document.getElementById('q').oninput = ev => {
  clearTimeout(timer);
  timer = setTimeout(() => { state.q = ev.target.value.trim(); load(); }, 250);
};

load();
</script>
</body>
</html>`;
}
