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

export function adminPage(email) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Enquiries — Hardik Ajmeriya</title>
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

  header{border-bottom:1px solid var(--line);background:var(--paper);position:sticky;top:0;z-index:20}
  .bar{max-width:1400px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
  .bar h1{font-size:20px}
  .who{margin-left:auto;font-size:12px;color:var(--muted)}
  .who a{color:var(--muted)}

  .wrap{max-width:1400px;margin:0 auto;padding:24px}

  .filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:20px}
  .chip{border:1px solid var(--line);background:#fff;border-radius:99px;padding:8px 15px;
    font-family:'JetBrains Mono',monospace;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;
    color:var(--muted);cursor:pointer;transition:.2s}
  .chip:hover{border-color:var(--ink);color:var(--ink)}
  .chip.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .chip .n{opacity:.6;margin-left:6px}
  input[type=search]{flex:1;min-width:220px;border:1px solid var(--line);border-radius:10px;
    padding:10px 14px;font-size:14px;background:#fff;outline:none}
  input[type=search]:focus{border-color:var(--ink);box-shadow:0 0 0 4px rgba(61,46,245,.10)}
  .btn{border:1px solid var(--line);background:#fff;border-radius:10px;padding:10px 16px;
    font-size:13px;font-weight:600;cursor:pointer;color:var(--ink);text-decoration:none;display:inline-block}
  .btn:hover{background:var(--paper-2)}

  .layout{display:grid;grid-template-columns:minmax(320px,420px) 1fr;gap:20px;align-items:start}
  @media(max-width:900px){.layout{grid-template-columns:1fr}}

  .list{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;max-height:calc(100vh - 220px);overflow-y:auto}
  .row{padding:16px 18px;border-bottom:1px solid var(--line);cursor:pointer;transition:background .15s}
  .row:last-child{border-bottom:none}
  .row:hover{background:var(--paper-2)}
  .row.sel{background:var(--paper-2);box-shadow:inset 3px 0 0 var(--accent)}
  .row .top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
  .row .nm{font-weight:600;font-size:15px}
  .row .dt{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--muted);white-space:nowrap}
  .row .meta{font-size:12.5px;color:var(--muted);margin-top:4px}

  .tag{display:inline-block;border-radius:99px;padding:3px 9px;font-family:'JetBrains Mono',monospace;
    font-size:10px;text-transform:uppercase;letter-spacing:.07em;border:1px solid}
  .t-new{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 35%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}
  .t-replied{color:#0369a1;border-color:#bae6fd;background:#f0f9ff}
  .t-won{color:#047857;border-color:#a7f3d0;background:#ecfdf5}
  .t-lost{color:var(--muted);border-color:var(--line);background:var(--paper)}
  .t-archived{color:var(--muted);border-color:var(--line);background:var(--paper)}
  .due{color:var(--warn);font-family:'JetBrains Mono',monospace;font-size:10.5px}

  .detail{border:1px solid var(--line);border-radius:14px;background:#fff;padding:28px;min-height:400px}
  .detail h2{font-size:24px;margin-bottom:6px}
  .detail .sub{color:var(--muted);font-size:14px;margin-bottom:22px}
  .detail .sub a{color:var(--accent)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;
    padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:20px}
  .grid dt{font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;
    letter-spacing:.1em;color:var(--muted);margin-bottom:4px}
  .grid dd{font-size:14px}
  .brief{white-space:pre-wrap;line-height:1.7;font-size:14.5px;background:var(--paper);
    border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:22px}
  label.f{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;
    letter-spacing:.1em;color:var(--muted);margin:0 0 6px}
  textarea,select,input[type=date]{width:100%;border:1px solid var(--line);border-radius:10px;
    padding:10px 12px;font-size:14px;font-family:inherit;background:#fff;outline:none}
  textarea:focus,select:focus,input[type=date]:focus{border-color:var(--ink);box-shadow:0 0 0 4px rgba(61,46,245,.10)}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
  @media(max-width:520px){.two{grid-template-columns:1fr}}
  .actions{display:flex;gap:10px;align-items:center;margin-top:18px;flex-wrap:wrap}
  .primary{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .primary:hover{background:var(--accent)}
  .danger{color:var(--danger);border-color:#fecaca}
  .danger:hover{background:#fef2f2}
  .saved{color:var(--accent2);font-size:13px;opacity:0;transition:opacity .3s}
  .saved.on{opacity:1}
  .empty{color:var(--muted);text-align:center;padding:70px 20px;font-size:14px}
</style>
</head>
<body>

<header>
  <div class="bar">
    <h1 class="display">Enquiries</h1>
    <a class="btn" href="/api/admin/export.csv">Export CSV</a>
    <a class="btn" href="/" target="_blank" rel="noopener">View site</a>
    <div class="who">Signed in as ${email.replace(/[<>&"]/g, '')}</div>
  </div>
</header>

<div class="wrap">
  <div class="filters">
    <button class="chip on" data-status="">All</button>
    <button class="chip" data-status="new">New<span class="n" id="c-new">0</span></button>
    <button class="chip" data-status="replied">Replied<span class="n" id="c-replied">0</span></button>
    <button class="chip" data-status="won">Won<span class="n" id="c-won">0</span></button>
    <button class="chip" data-status="lost">Lost<span class="n" id="c-lost">0</span></button>
    <button class="chip" data-status="archived">Archived<span class="n" id="c-archived">0</span></button>
    <input type="search" id="q" placeholder="Search name, email, company or brief…">
  </div>

  <div class="layout">
    <div class="list" id="list"><div class="empty">Loading…</div></div>
    <div class="detail" id="detail"><div class="empty">Select an enquiry to view it.</div></div>
  </div>
</div>

<script>
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let state = { items: [], status: '', q: '', selected: null };

const fmtDate = iso => {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
};

const overdue = d => d && d <= new Date().toISOString().slice(0,10);

async function load() {
  const p = new URLSearchParams();
  if (state.status) p.set('status', state.status);
  if (state.q) p.set('q', state.q);
  const res = await fetch('/api/admin/enquiries?' + p, { headers:{accept:'application/json'} });
  if (!res.ok) {
    document.getElementById('list').innerHTML =
      '<div class="empty">Could not load enquiries (' + res.status + ').</div>';
    return;
  }
  const data = await res.json();
  state.items = data.enquiries;
  for (const [k,v] of Object.entries(data.counts || {})) {
    const el = document.getElementById('c-' + k);
    if (el) el.textContent = v;
  }
  renderList();
}

function renderList() {
  const el = document.getElementById('list');
  if (!state.items.length) { el.innerHTML = '<div class="empty">No enquiries yet.</div>'; return; }
  el.innerHTML = state.items.map(e => \`
    <div class="row \${state.selected===e.id?'sel':''}" data-id="\${e.id}">
      <div class="top">
        <span class="nm">\${esc(e.name)}</span>
        <span class="dt">\${fmtDate(e.created_at)}</span>
      </div>
      <div class="meta">\${esc(e.company || e.email)} · \${esc(e.budget)}</div>
      <div class="meta" style="margin-top:8px">
        <span class="tag t-\${e.status}">\${e.status}</span>
        \${overdue(e.follow_up_on) ? '<span class="due"> ⚑ due '+esc(e.follow_up_on)+'</span>' : ''}
      </div>
    </div>\`).join('');
  el.querySelectorAll('.row').forEach(r =>
    r.onclick = () => { state.selected = Number(r.dataset.id); renderList(); renderDetail(); });
}

function renderDetail() {
  const e = state.items.find(x => x.id === state.selected);
  const el = document.getElementById('detail');
  if (!e) { el.innerHTML = '<div class="empty">Select an enquiry to view it.</div>'; return; }

  el.innerHTML = \`
    <h2 class="display">\${esc(e.name)}</h2>
    <p class="sub">
      <a href="mailto:\${esc(e.email)}">\${esc(e.email)}</a>
      \${e.company ? ' · ' + esc(e.company) : ''}
      \${e.ip_country ? ' · ' + esc(e.ip_country) : ''}
    </p>
    <dl class="grid">
      <div><dt>Project type</dt><dd>\${esc(e.project_type)}</dd></div>
      <div><dt>Budget</dt><dd>\${esc(e.budget)}</dd></div>
      <div><dt>Timeline</dt><dd>\${esc(e.timeline)}</dd></div>
      <div><dt>Received</dt><dd>\${fmtDate(e.created_at)}</dd></div>
    </dl>
    <label class="f">Brief</label>
    <div class="brief">\${esc(e.message)}</div>
    <div class="two">
      <div>
        <label class="f" for="st">Status</label>
        <select id="st">
          \${['new','replied','won','lost','archived'].map(s =>
            \`<option value="\${s}" \${s===e.status?'selected':''}>\${s}</option>\`).join('')}
        </select>
      </div>
      <div>
        <label class="f" for="fu">Follow up on</label>
        <input type="date" id="fu" value="\${e.follow_up_on || ''}">
      </div>
    </div>
    <label class="f" for="nt">Private notes</label>
    <textarea id="nt" rows="5" placeholder="Call notes, quote sent, next step…">\${esc(e.notes)}</textarea>
    <div class="actions">
      <button class="btn primary" id="save">Save</button>
      <a class="btn" href="mailto:\${esc(e.email)}?subject=Re: your project enquiry">Reply by email</a>
      <button class="btn danger" id="del">Delete</button>
      <span class="saved" id="saved">Saved</span>
    </div>\`;

  document.getElementById('save').onclick = async () => {
    const body = {
      status: document.getElementById('st').value,
      notes: document.getElementById('nt').value,
      follow_up_on: document.getElementById('fu').value || null,
    };
    const res = await fetch('/api/admin/enquiries/' + e.id, {
      method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) {
      const s = document.getElementById('saved');
      s.classList.add('on'); setTimeout(()=>s.classList.remove('on'), 1600);
      await load(); renderDetail();
    } else {
      alert('Could not save (' + res.status + ').');
    }
  };

  document.getElementById('del').onclick = async () => {
    if (!confirm('Delete this enquiry permanently? This cannot be undone.')) return;
    const res = await fetch('/api/admin/enquiries/' + e.id, { method:'DELETE' });
    if (res.ok) { state.selected = null; await load(); renderDetail(); }
    else alert('Could not delete (' + res.status + ').');
  };
}

document.querySelectorAll('.chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  state.status = c.dataset.status;
  load();
});

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
