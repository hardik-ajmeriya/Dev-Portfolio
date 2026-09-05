const mod = (await import('./index.js')).default;

const calls = [];
globalThis.fetch = async (url, opts) => {
  calls.push({ url: String(url), body: opts?.body });
  if (String(url).includes('resend')) return { ok:true, text:async()=>'' };
  return { ok:false, json:async()=>({}), text:async()=>'' };
};
const env = { RESEND_API_KEY:'re_123', PUBLIC_HOST:'hardikajmeriya.com',
  ASSETS:{ fetch:async()=>new Response('static',{status:200}) } };

const post = (body, origin='https://hardikajmeriya.com') => new Request(
  'https://hardikajmeriya.com/api/enquiry',
  { method:'POST', headers:{'content-type':'application/json', origin}, body: JSON.stringify(body) });

const valid = { name:'Priya Sharma', email:'priya@northwind.example', company:'Northwind',
  projectType:'New web application', budget:'$3,000 – $5,000', timeline:'Within 1 month',
  message:'We track deliveries in spreadsheets and need a proper dashboard for dispatch.' };

let pass=0, fail=0;
const t = async (name, fn) => {
  try { await fn(); console.log('  PASS  '+name); pass++; }
  catch(e){ console.log('  FAIL  '+name+' -> '+e.message); fail++; }
};
const eq = (a,b,m) => { if(a!==b) throw new Error(`${m}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); };

console.log('=== ROUTING ===');
await t('non-API path serves static assets', async()=>{
  const r = await mod.fetch(new Request('https://hardikajmeriya.com/about'), env);
  eq(await r.text(),'static','body');
});
await t('public host serves the site with no noindex header', async()=>{
  const r = await mod.fetch(new Request('https://hardikajmeriya.com/'), env);
  eq(r.headers.get('x-robots-tag'),null,'x-robots-tag');
});
await t('GET /api/enquiry rejected (405)', async()=>{
  const r = await mod.fetch(new Request('https://hardikajmeriya.com/api/enquiry'), env);
  eq(r.status,405,'status');
});
await t('cross-origin POST rejected (403)', async()=>{
  const r = await mod.fetch(post(valid,'https://evil.example'), env);
  eq(r.status,403,'status');
});

console.log();
console.log('=== VALIDATION (server-side, independent of the browser) ===');
await t('empty body -> 422', async()=>{
  const r = await mod.fetch(post({}), env); eq(r.status,422,'status');
});
await t('bad email -> 422 listing email', async()=>{
  const r = await mod.fetch(post({...valid,email:'nope'}), env);
  const j = await r.json(); eq(r.status,422,'status');
  if(!j.errors.includes('email')) throw new Error('email not flagged');
});
await t('short message -> 422', async()=>{
  const r = await mod.fetch(post({...valid,message:'too short'}), env);
  eq(r.status,422,'status');
});
await t('honeypot -> 200 but nothing sent', async()=>{
  calls.length=0;
  const r = await mod.fetch(post({...valid,botcheck:'i am a bot'}), env);
  eq(r.status,200,'status'); eq(calls.length,0,'upstream calls');
});

console.log();
console.log('=== HAPPY PATH ===');
calls.length=0;
await t('valid submission -> 200', async()=>{
  const r = await mod.fetch(post(valid), env);
  const j = await r.json(); eq(r.status,200,'status'); eq(j.success,true,'success');
});
await t('called Resend twice (owner, then client)', async()=>{
  eq(calls.length,2,'call count');
  if(!calls[0].url.includes('resend')) throw new Error('owner send not first');
  if(!calls[1].url.includes('resend')) throw new Error('client send not second');
});
await t('owner email sent to Hardik, reply-to the enquirer', async()=>{
  const b=JSON.parse(calls[0].body);
  eq(b.to[0],'hardik.ajmeriya89@gmail.com','to');
  eq(b.reply_to,'priya@northwind.example','reply_to');
  if(!b.html.includes('Priya Sharma')) throw new Error('name missing from body');
  for(const field of [valid.email, valid.company, valid.projectType, valid.budget, valid.timeline])
    if(!b.html.includes(field)) throw new Error('missing field: '+field);
});
await t('client auto-reply sent to the enquirer, reply-to Hardik', async()=>{
  const b=JSON.parse(calls[1].body);
  eq(b.to[0],'priya@northwind.example','to');
  eq(b.reply_to,'hardik.ajmeriya89@gmail.com','reply_to');
  if(!b.html || !b.text) throw new Error('missing html/text part');
});

console.log();
console.log('=== RESILIENCE ===');
await t('client auto-reply failure still reports success (owner already notified)', async()=>{
  let n = 0;
  globalThis.fetch = async()=> { n++; return n === 1
    ? { ok:true, text:async()=>'' }
    : { ok:false, status:500, text:async()=>'boom' }; };
  const r = await mod.fetch(post(valid), env);
  const j = await r.json(); eq(j.success,true,'success');
});
await t('owner notification failure -> 503 (distinct from proxy 502)', async()=>{
  globalThis.fetch = async()=>({ok:false,status:500,text:async()=>'boom'});
  const r = await mod.fetch(post(valid), env);
  const j = await r.json(); eq(r.status,503,'status'); eq(j.code,'upstream_failed','code');
});
await t('missing RESEND_API_KEY -> 503 with a clear code', async()=>{
  globalThis.fetch = async()=>({ok:true,text:async()=>''});
  const r = await mod.fetch(post(valid), {...env, RESEND_API_KEY:undefined});
  const j = await r.json();
  eq(r.status,503,'status');
  eq(j.code,'missing_api_key','code');
});

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
