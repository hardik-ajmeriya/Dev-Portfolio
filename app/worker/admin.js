/**
 * Admin API for the enquiries panel.
 *
 * Every route here is protected by Cloudflare Access, which runs at the edge
 * *before* the Worker. An unauthenticated request is rejected by Cloudflare
 * and never reaches this file.
 *
 * requireAccess() below is defence in depth, not the primary control: if the
 * Access policy were ever removed or misconfigured, these routes would still
 * refuse to serve data rather than silently exposing every client's details.
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const VALID_STATUSES = ['new', 'replied', 'won', 'lost', 'archived'];

/**
 * Confirms Cloudflare Access authenticated the request.
 *
 * Access injects Cf-Access-Authenticated-User-Email once it has verified the
 * user. The header cannot be forged from outside because Access terminates
 * the request first and strips any client-supplied copy.
 *
 * ADMIN_EMAIL narrows it further: even if someone else is added to the Access
 * policy by mistake, only this address can read the data.
 */
export function requireAccess(request, env) {
  // ---- local development bypass ----------------------------------------
  // Cloudflare Access does not exist in `wrangler dev`, so without this the
  // panel is unreachable locally.
  //
  // TWO independent conditions must hold, and neither can be true in
  // production:
  //   1. the request hostname is localhost/127.0.0.1 — on the live site it is
  //      always hardikajmeriya.com, so this alone blocks it
  //   2. DEV_ADMIN_EMAIL is set, which only exists in .dev.vars — a file that
  //      is gitignored and never uploaded by `wrangler deploy`
  //
  // Requiring both means forgetting to remove something cannot expose the
  // panel. This is deliberately not a commented-out auth check, which is the
  // pattern that gets accidentally shipped.
  const { hostname } = new URL(request.url);
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost && env.DEV_ADMIN_EMAIL) {
    return { ok: true, email: env.DEV_ADMIN_EMAIL, dev: true };
  }

  const email = request.headers.get('cf-access-authenticated-user-email');

  if (!email) {
    return { ok: false, response: json({ error: 'Not authenticated.' }, 401) };
  }
  if (env.ADMIN_EMAIL && email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
    return { ok: false, response: json({ error: 'Not authorised.' }, 403) };
  }
  return { ok: true, email, dev: false };
}

/** Store a submission. Never throws — a DB failure must not lose the email. */
export async function saveEnquiry(data, request, env) {
  if (!env.DB) return { ok: false, skipped: 'no D1 binding' };

  try {
    const result = await env.DB.prepare(
      `INSERT INTO enquiries
         (name, email, company, project_type, budget, timeline, message, ip_country, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        data.name,
        data.email,
        data.company || null,
        data.projectType,
        data.budget,
        data.timeline,
        data.message,
        request.headers.get('cf-ipcountry') || null,
        (request.headers.get('user-agent') || '').slice(0, 300) || null
      )
      .run();

    return { ok: true, id: result.meta?.last_row_id };
  } catch (err) {
    console.error('Failed to save enquiry to D1', err.message);
    return { ok: false, error: err.message };
  }
}

/** GET /api/admin/enquiries?status=&q=&limit= */
async function listEnquiries(url, env) {
  const status = url.searchParams.get('status');
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);

  const where = [];
  const binds = [];

  if (status && VALID_STATUSES.includes(status)) {
    where.push('status = ?');
    binds.push(status);
  }
  if (q) {
    // Parameterised LIKE — the term never becomes part of the SQL string.
    where.push('(name LIKE ? OR email LIKE ? OR company LIKE ? OR message LIKE ?)');
    const term = `%${q}%`;
    binds.push(term, term, term, term);
  }

  const sql =
    `SELECT id, name, email, company, project_type, budget, timeline, message,
            status, notes, follow_up_on, created_at, updated_at, ip_country
       FROM enquiries` +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ` ORDER BY created_at DESC LIMIT ?`;

  binds.push(limit);

  const { results } = await env.DB.prepare(sql).bind(...binds).all();

  const counts = await env.DB.prepare(
    `SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status`
  ).all();

  const byStatus = Object.fromEntries(VALID_STATUSES.map((s) => [s, 0]));
  for (const row of counts.results || []) byStatus[row.status] = row.n;

  return json({ enquiries: results || [], counts: byStatus, total: results?.length || 0 });
}

/** PATCH /api/admin/enquiries/:id  { status?, notes?, follow_up_on? } */
async function updateEnquiry(id, body, env) {
  const sets = [];
  const binds = [];

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` }, 422);
    }
    sets.push('status = ?');
    binds.push(body.status);
  }

  if (body.notes !== undefined) {
    sets.push('notes = ?');
    binds.push(String(body.notes).slice(0, 10000));
  }

  if (body.follow_up_on !== undefined) {
    const value = body.follow_up_on;
    if (value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return json({ error: 'follow_up_on must be YYYY-MM-DD or null' }, 422);
    }
    sets.push('follow_up_on = ?');
    binds.push(value || null);
  }

  if (!sets.length) return json({ error: 'Nothing to update.' }, 422);

  binds.push(id);

  // This is the only place a query string is assembled rather than fixed, so
  // it deserves the scrutiny: every element of `sets` is a hardcoded literal
  // above ('status = ?', 'notes = ?', 'follow_up_on = ?'). Only column names
  // are interpolated; every user-supplied value goes through `binds`. Keep it
  // that way — never push a caller-controlled string into `sets`.
  const result = await env.DB.prepare(
    `UPDATE enquiries SET ${sets.join(', ')} WHERE id = ?`
  )
    .bind(...binds)
    .run();

  if (!result.meta?.changes) return json({ error: 'Not found.' }, 404);
  return json({ success: true });
}

/** DELETE /api/admin/enquiries/:id — for genuine erasure requests. */
async function deleteEnquiry(id, env) {
  const result = await env.DB.prepare('DELETE FROM enquiries WHERE id = ?').bind(id).run();
  if (!result.meta?.changes) return json({ error: 'Not found.' }, 404);
  return json({ success: true });
}

/** GET /api/admin/export.csv */
async function exportCsv(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, name, email, company, project_type, budget, timeline,
            status, follow_up_on, notes, message
       FROM enquiries ORDER BY created_at DESC`
  ).all();

  // Prefix cells that a spreadsheet would treat as a formula. Without this,
  // a value like "=cmd|..." becomes an executable formula on open — CSV
  // injection, and the reason this is not just a join(',').
  const cell = (v) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const headers = [
    'id', 'created_at', 'name', 'email', 'company', 'project_type', 'budget',
    'timeline', 'status', 'follow_up_on', 'notes', 'message',
  ];

  const csv = [
    headers.join(','),
    ...(results || []).map((r) => headers.map((h) => cell(r[h])).join(',')),
  ].join('\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="enquiries-${date}.csv"`,
      'cache-control': 'no-store',
    },
  });
}

/** Router for everything under /api/admin/. */
export async function handleAdminApi(request, env, url) {
  const auth = requireAccess(request, env);
  if (!auth.ok) return auth.response;

  if (!env.DB) {
    return json({ error: 'Database not configured. See ADMIN.md.' }, 503);
  }

  const path = url.pathname.replace(/^\/api\/admin\/?/, '');

  try {
    if (path === 'enquiries' && request.method === 'GET') {
      return await listEnquiries(url, env);
    }

    if (path === 'export.csv' && request.method === 'GET') {
      return await exportCsv(env);
    }

    const match = path.match(/^enquiries\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      if (request.method === 'PATCH') {
        const body = await request.json().catch(() => ({}));
        return await updateEnquiry(id, body, env);
      }
      if (request.method === 'DELETE') {
        return await deleteEnquiry(id, env);
      }
    }

    return json({ error: 'Not found.' }, 404);
  } catch (err) {
    console.error('Admin API error', err.message);
    return json({ error: 'Server error.' }, 500);
  }
}

export { VALID_STATUSES };
