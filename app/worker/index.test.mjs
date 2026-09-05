const mod = (await import('./index.js')).default;

const calls = [];
globalThis.fetch = async (url, opts) => {
  calls.push({ url: String(url), body: opts?.body });
  if (String(url).includes('web3forms')) return { ok:true, json:async()=>({success:true}) };
  if (String(url).includes('resend'))    return { ok:true, text:async()=>'' };
  return { ok:false, json:async()=>({}), text:async()=>'' };
};
const env = { WEB3FORMS_ACCESS_KEY:'key-123', RESEND_API_KEY:'re_123',
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
  const r = await mod.fetch(new Request('https://x.com/about'), env);
  eq(await r.text(),'static','body');
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
await t('called Web3Forms AND Resend', async()=>{
  eq(calls.length,2,'call count');
  if(!calls[0].url.includes('web3forms')) throw new Error('web3forms not first');
  if(!calls[1].url.includes('resend')) throw new Error('resend not second');
});
await t('Web3Forms payload has all fields + key', async()=>{
  const b=JSON.parse(calls[0].body);
  eq(b.access_key,'key-123','access_key');
  eq(b.replyto,'priya@northwind.example','replyto');
  for(const k of ['Summary','Full name','Email','Company','Project type','Estimated budget','Timeline','Project overview','Submitted'])
    if(!b[k]) throw new Error('missing '+k);
});
await t('Resend sends to the client, not to Hardik', async()=>{
  const b=JSON.parse(calls[1].body);
  eq(b.to[0],'priya@northwind.example','to');
  if(!b.html || !b.text) throw new Error('missing html/text part');
});

console.log();
console.log('=== RESILIENCE ===');
await t('Resend failure still reports success (enquiry did arrive)', async()=>{
  globalThis.fetch = async(u)=> String(u).includes('web3forms')
    ? {ok:true,json:async()=>({success:true})}
    : {ok:false,status:500,text:async()=>'boom'};
  const r = await mod.fetch(post(valid), env);
  const j = await r.json(); eq(j.success,true,'success');
});
await t('Web3Forms failure -> 502', async()=>{
  globalThis.fetch = async()=>({ok:false,json:async()=>({success:false}),text:async()=>''});
  const r = await mod.fetch(post(valid), env);
  eq(r.status,502,'status');
});
await t('missing RESEND_API_KEY does not break submission', async()=>{
  globalThis.fetch = async()=>({ok:true,json:async()=>({success:true}),text:async()=>''});
  const r = await mod.fetch(post(valid), {...env, RESEND_API_KEY:undefined});
  const j = await r.json(); eq(j.success,true,'success');
});

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
