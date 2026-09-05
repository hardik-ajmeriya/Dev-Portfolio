const mod = (await import('./index.js')).default;

// --- minimal D1 stand-in -------------------------------------------------
const rows = [];
let nextId = 1;
const db = {
  prepare(sql) {
    const q = { sql, binds: [] };
    q.bind = (...b) => { q.binds = b; return q; };
    q.run = async () => {
      if (/^INSERT/i.test(sql)) {
        const [name,email,company,pt,budget,tl,msg,cc,ua] = q.binds;
        rows.push({ id:nextId, name, email, company, project_type:pt, budget, timeline:tl,
          message:msg, status:'new', notes:'', follow_up_on:null,
          created_at:'2026-09-05 10:00:00', updated_at:'2026-09-05 10:00:00', ip_country:cc, user_agent:ua });
        return { meta:{ last_row_id: nextId++ } };
      }
      if (/^UPDATE/i.test(sql)) {
        const id = q.binds[q.binds.length-1];
        const r = rows.find(x=>x.id===id);
        if (!r) return { meta:{ changes:0 } };
        if (/status = \?/.test(sql)) r.status = q.binds[0];
        return { meta:{ changes:1 } };
      }
      if (/^DELETE/i.test(sql)) {
        const id = q.binds[0]; const i = rows.findIndex(x=>x.id===id);
        if (i<0) return { meta:{changes:0} };
        rows.splice(i,1); return { meta:{changes:1} };
      }
      return { meta:{} };
    };
    q.all = async () => {
      if (/GROUP BY status/.test(sql)) {
        const m = {}; rows.forEach(r=>m[r.status]=(m[r.status]||0)+1);
        return { results: Object.entries(m).map(([status,n])=>({status,n})) };
      }
      return { results: [...rows] };
    };
    return q;
  },
};

const { publicJwk, sign } = await (async () => {
  const kp = await crypto.subtle.generateKey(
    { name:'RSASSA-PKCS1-v1_5', modulusLength:2048, publicExponent:new Uint8Array([1,0,1]), hash:'SHA-256' },
    true, ['sign','verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  return {
    publicJwk: { ...jwk, kid:'test-key', alg:'RS256' },
    sign: async (payload, header={}) => {
      const h = enc({ alg:'RS256', kid:'test-key', typ:'JWT', ...header });
      const p = enc(payload);
      const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey,
        new TextEncoder().encode(h+'.'+p));
      return h+'.'+p+'.'+b64u(sig);
    },
  };
})();

const TEAM = 'testteam.cloudflareaccess.com';
const AUD  = 'test-aud-tag';
const now = () => Math.floor(Date.now()/1000);

const goodClaims = (over={}) => ({
  email:'hardikpt95@gmail.com', aud:[AUD], iss:'https://'+TEAM,
  exp: now()+3600, iat: now()-10, ...over });

// Intercept the certs fetch so no network is needed.
const realFetch = globalThis.fetch;
const withCerts = fn => async (...a) => {
  const url = String(a[0]);
  if (url.includes('/cdn-cgi/access/certs'))
    return { ok:true, json:async()=>({ keys:[publicJwk] }) };
  return fn(...a);
};

const tokenHeaders = async (over={}, header={}) =>
  ({ 'cf-access-jwt-assertion': await sign(goodClaims(over), header) });

let ADMIN;  // assigned after env is defined

globalThis.fetch = withCerts(async () => ({ ok:true, json:async()=>({success:true}), text:async()=>'' }));
ADMIN = await tokenHeaders();

const env = { RESEND_API_KEY:'re_1', ADMIN_EMAIL:'hardikpt95@gmail.com', DB:db,
  ACCESS_TEAM_DOMAIN:TEAM, ACCESS_AUD:AUD,
  ASSETS:{ fetch:async()=>new Response('static') } };

// A REAL signed Access token, minted with a throwaway RSA key. The Worker
// verifies the signature, so tests must sign properly — a hand-written header
// no longer authenticates, which is precisely the vulnerability being closed.
const req = (path, opts={}) => new Request('https://hardikajmeriya.com'+path, opts);

let pass=0, fail=0;
const t = async (n, fn) => { try { await fn(); console.log('  PASS  '+n); pass++; }
  catch(e){ console.log('  FAIL  '+n+' -> '+e.message); fail++; } };
const eq=(a,b,m)=>{ if(a!==b) throw new Error(`${m}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); };

const valid = { name:'Priya Sharma', email:'priya@northwind.example', company:'Northwind',
  projectType:'SaaS product', budget:'$3,000 – $5,000', timeline:'Within 1 month',
  message:'We need a multi-tenant dashboard for our dispatch team and drivers.' };

console.log('=== ACCESS CONTROL (the part that matters) ===');
await t('no Access header -> 401, no data leaked', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries'), env);
  eq(r.status,401,'status');
  const body = await r.text();
  if (body.includes('@')) throw new Error('response leaked an email address');
});
await t('/admin page without Access -> 401', async()=>{
  const r = await mod.fetch(req('/admin'), env);
  eq(r.status,401,'status');
});
await t('unsigned header claiming another user -> 401 (not 403)', async()=>{
  // Pre-JWT this returned 403, because the email header was trusted and only
  // ADMIN_EMAIL rejected it. Now an unsigned request never authenticates at
  // all, so it stops one step earlier. The 403 path is covered below by
  // 'valid token but NOT ADMIN_EMAIL'.
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers:{'cf-access-authenticated-user-email':'someone@else.com'}}), env);
  eq(r.status,401,'status');
});
await t('/admin with Access -> HTML, noindex, no-store', async()=>{
  const r = await mod.fetch(req('/admin',{headers:ADMIN}), env);
  eq(r.status,200,'status');
  if(!r.headers.get('cache-control').includes('no-store')) throw new Error('missing no-store');
  if(!r.headers.get('x-robots-tag').includes('noindex')) throw new Error('missing noindex');
});

console.log();
console.log('=== PERSISTENCE ===');
await t('submitting the form stores a row', async()=>{
  const r = await mod.fetch(req('/api/enquiry',{method:'POST',
    headers:{'content-type':'application/json',origin:'https://hardikajmeriya.com'},
    body:JSON.stringify(valid)}), env);
  eq(r.status,200,'status'); eq(rows.length,1,'row count');
  eq(rows[0].project_type,'SaaS product','project_type');
  eq(rows[0].status,'new','default status');
});
await t('honeypot submission stores nothing', async()=>{
  const before = rows.length;
  await mod.fetch(req('/api/enquiry',{method:'POST',
    headers:{'content-type':'application/json',origin:'https://hardikajmeriya.com'},
    body:JSON.stringify({...valid,botcheck:'bot'})}), env);
  eq(rows.length,before,'row count unchanged');
});
await t('a DB failure does not break the submission', async()=>{
  const broken = {...env, DB:{ prepare(){ return { bind(){return this}, run(){throw new Error('db down')},
    all(){throw new Error('db down')} }; } }};
  const r = await mod.fetch(req('/api/enquiry',{method:'POST',
    headers:{'content-type':'application/json',origin:'https://hardikajmeriya.com'},
    body:JSON.stringify(valid)}), broken);
  const j = await r.json(); eq(j.success,true,'still succeeds — losing the email would be worse');
});

console.log();
console.log('=== ADMIN OPERATIONS ===');
await t('list returns rows and counts', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',{headers:ADMIN}), env);
  const j = await r.json();
  if(!j.enquiries.length) throw new Error('no rows');
  if(typeof j.counts.new !== 'number') throw new Error('no counts');
});
await t('status update works', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries/1',{method:'PATCH',headers:{...ADMIN,
    'content-type':'application/json'},body:JSON.stringify({status:'replied'})}), env);
  eq(r.status,200,'status'); eq(rows[0].status,'replied','stored');
});
await t('invalid status rejected (422)', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries/1',{method:'PATCH',headers:{...ADMIN,
    'content-type':'application/json'},body:JSON.stringify({status:'banana'})}), env);
  eq(r.status,422,'status');
});
await t('bad follow-up date rejected (422)', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries/1',{method:'PATCH',headers:{...ADMIN,
    'content-type':'application/json'},body:JSON.stringify({follow_up_on:'next tuesday'})}), env);
  eq(r.status,422,'status');
});
await t('CSV export escapes formula injection', async()=>{
  rows.push({...rows[0], id:99, name:'=cmd|calc', notes:'', message:'x', created_at:'2026-09-05 11:00:00'});
  const r = await mod.fetch(req('/api/admin/export.csv',{headers:ADMIN}), env);
  const csv = await r.text();
  if(!csv.includes('"\'=cmd|calc"')) throw new Error('formula not neutralised: '+csv.split('\n')[1]);
  if(!r.headers.get('content-disposition').includes('attachment')) throw new Error('not a download');
});
await t('delete removes the row', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries/99',{method:'DELETE',headers:ADMIN}), env);
  eq(r.status,200,'status');
  if(rows.find(x=>x.id===99)) throw new Error('still present');
});

console.log();
console.log('=== LOCAL DEV BYPASS (must be impossible in production) ===');
const devEnv = {...env, DEV_ADMIN_EMAIL:'hardikpt95@gmail.com'};

await t('localhost + DEV_ADMIN_EMAIL -> allowed', async()=>{
  const r = await mod.fetch(new Request('http://localhost:8787/api/admin/enquiries'), devEnv);
  eq(r.status,200,'status');
});
await t('127.0.0.1 also allowed', async()=>{
  const r = await mod.fetch(new Request('http://127.0.0.1:8787/api/admin/enquiries'), devEnv);
  eq(r.status,200,'status');
});
await t('PRODUCTION hostname + DEV_ADMIN_EMAIL set -> still 401', async()=>{
  // the dangerous case: variable leaked into production config
  const r = await mod.fetch(new Request('https://hardikajmeriya.com/api/admin/enquiries'), devEnv);
  eq(r.status,401,'status');
});
await t('localhost WITHOUT DEV_ADMIN_EMAIL -> 401', async()=>{
  const r = await mod.fetch(new Request('http://localhost:8787/api/admin/enquiries'), env);
  eq(r.status,401,'status');
});
await t('a lookalike hostname is not treated as local', async()=>{
  const r = await mod.fetch(new Request('https://localhost.evil.com/api/admin/enquiries'), devEnv);
  eq(r.status,401,'status');
});
await t('dev panel carries the LOCAL DEV warning banner', async()=>{
  const r = await mod.fetch(new Request('http://localhost:8787/admin'), devEnv);
  const html = await r.text();
  if(!html.includes('LOCAL DEV')) throw new Error('missing dev banner');
});
await t('production panel has NO dev banner', async()=>{
  const r = await mod.fetch(new Request('https://hardikajmeriya.com/admin',{headers:ADMIN}), env);
  const html = await r.text();
  if(html.includes('LOCAL DEV')) throw new Error('dev banner leaked into production');
});

console.log();
console.log('=== ROUTING CONFIG (a code-correct Worker is useless if unrouted) ===');
await t('wrangler.jsonc routes /admin through the Worker first', async()=>{
  const fs = await import('node:fs');
  const raw = fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  // strip // comments so JSON.parse can read the jsonc file
  const cfg = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''));
  const first = cfg.assets?.run_worker_first || [];
  if (!first.includes('/admin'))
    throw new Error("'/admin' missing from run_worker_first — the asset layer would serve index.html instead of the panel. Got: " + JSON.stringify(first));
  if (!first.some(p => p.startsWith('/api')))
    throw new Error("'/api/*' missing from run_worker_first — the enquiry endpoint would be shadowed");
});

console.log();
console.log('=== JWT VERIFICATION (the header alone must not authenticate) ===');

await t('FORGED header with no token -> 401', async()=>{
  // This is the exact attack the JWT change closes.
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers:{'cf-access-authenticated-user-email':'hardikpt95@gmail.com'}}), env);
  eq(r.status,401,'status');
});
await t('valid signed token -> 200', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',{headers: await tokenHeaders()}), env);
  eq(r.status,200,'status');
});
await t('expired token -> 401', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers: await tokenHeaders({exp: now()-60})}), env);
  eq(r.status,401,'status');
});
await t('token for a DIFFERENT Access app (wrong aud) -> 401', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers: await tokenHeaders({aud:['some-other-app']})}), env);
  eq(r.status,401,'status');
});
await t('wrong issuer -> 401', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers: await tokenHeaders({iss:'https://evil.cloudflareaccess.com'})}), env);
  eq(r.status,401,'status');
});
await t('alg:none downgrade -> 401', async()=>{
  const b64u = o => btoa(JSON.stringify(o)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const tok = b64u({alg:'none',kid:'test-key',typ:'JWT'})+'.'+b64u(goodClaims())+'.';
  const r = await mod.fetch(req('/api/admin/enquiries',{headers:{'cf-access-jwt-assertion':tok}}), env);
  eq(r.status,401,'status');
});
await t('tampered payload (valid sig, altered claims) -> 401', async()=>{
  const good = await sign(goodClaims());
  const [h,,sg] = good.split('.');
  const b64u = o => btoa(JSON.stringify(o)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const tok = h+'.'+b64u(goodClaims({email:'attacker@evil.com'}))+'.'+sg;
  const r = await mod.fetch(req('/api/admin/enquiries',{headers:{'cf-access-jwt-assertion':tok}}), env);
  eq(r.status,401,'status');
});
await t('valid token but NOT ADMIN_EMAIL -> 403', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers: await tokenHeaders({email:'someone@else.com'})}), env);
  eq(r.status,403,'status');
});
await t('token via CF_Authorization cookie also works', async()=>{
  const tok = await sign(goodClaims());
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers:{cookie:'CF_Authorization='+tok}}), env);
  eq(r.status,200,'status');
});
await t('FAILS CLOSED when ACCESS_AUD is unconfigured', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',{headers: await tokenHeaders()}),
    {...env, ACCESS_AUD:undefined});
  eq(r.status,401,'status');
});
await t('401 body never leaks the reason', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers: await tokenHeaders({exp: now()-60})}), env);
  const body = await r.text();
  if (/expired|signature|audience|issuer/i.test(body))
    throw new Error('response disclosed why auth failed: '+body);
});

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
