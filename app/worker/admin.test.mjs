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

globalThis.fetch = async () => ({ ok:true, json:async()=>({success:true}), text:async()=>'' });
const env = { RESEND_API_KEY:'re_1', ADMIN_EMAIL:'hardikpt95@gmail.com', DB:db,
  ASSETS:{ fetch:async()=>new Response('static') } };

const ADMIN = { 'cf-access-authenticated-user-email':'hardikpt95@gmail.com' };
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
await t('a different authenticated user -> 403', async()=>{
  const r = await mod.fetch(req('/api/admin/enquiries',
    {headers:{'cf-access-authenticated-user-email':'someone@else.com'}}), env);
  eq(r.status,403,'status');
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
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
