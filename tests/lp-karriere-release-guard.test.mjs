import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=path.join(root,'karriere');
const publicDir=path.join(app,'karriere');
const read=p=>fs.readFileSync(path.join(app,p),'utf8');
const slugs=fs.readdirSync(publicDir,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name!=='assets').map(x=>x.name).sort();

test('Separate, versionierte Karriereplattform mit 21 Rollen',()=>{
  assert.equal(slugs.length,21);
  assert.equal(new Set(slugs).size,21);
  assert.ok(fs.existsSync(path.join(root,'index.html')),'SDR original root remains untouched');
  const hub=read('karriere/index.html');
  assert.equal((hub.match(/class="job-card"/g)||[]).length,21);
  assert.ok(hub.includes('id="application"'));
  assert.ok(hub.includes('name="privacy_consent" required'));
  assert.ok(!hub.includes('name="privacy_consent" checked'));
  assert.ok(hub.includes('https://jobs.lengacher-partner.ch/karriere'));
  for(const slug of slugs){
    const html=read(`karriere/${slug}/index.html`);
    assert.ok(html.includes(`https://jobs.lengacher-partner.ch/karriere/${slug}`),slug+' canonical');
    assert.ok(html.includes('"@type":"JobPosting"'),slug+' JobPosting');
    assert.ok(html.includes('action="/api/career-application"'),slug+' form');
    assert.ok(html.includes('name="privacy_consent" required'),slug+' consent');
    assert.ok(hub.includes(`href="/karriere/${slug}"`),slug+' index link');
  }
  const sitemap=read('sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,22);
  assert.ok(read('robots.txt').includes('https://jobs.lengacher-partner.ch/sitemap.xml'));
  const config=JSON.parse(read('vercel.json'));
  assert.deepEqual(config.redirects.find(x=>x.source==='/')?.destination,'/karriere');
  assert.ok(!config.rewrites?.length,'native static paths must work without rewrites');
  assert.ok(config.functions['api/career-application.js']);
  assert.ok(read('karriere/assets/app.js').includes('careerOfferMap'));
});

function newHandler(){
  const source=read('api/career-application.js');
  const mod={exports:{}},calls=[];
  const fakeFetch=async(url,options)=>{calls.push({url,payload:JSON.parse(options.body),origin:options.headers.Origin});return {ok:true,status:200,text:async()=>JSON.stringify({ok:true,reference:'KARR-TESTQA'})};};
  new Function('module','fetch','Buffer','AbortController','setTimeout','clearTimeout',source)(mod,fakeFetch,Buffer,AbortController,setTimeout,clearTimeout);
  return {handler:mod.exports,calls};
}
async function submit(handler,data,origin='https://jobs.lengacher-partner.ch'){
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(s){this.json=JSON.parse(s);}};
  const req={method:'POST',headers:{host:'jobs-app.lengacher-partner.ch',origin,'content-type':'application/json'},body:data};
  await handler(req,res);
  return {http:res.statusCode,data:res.json,headers:res.headers};
}
const valid={name:'L&P ASU QA',email:'qa@example.com',career_role:'Business Development Representative (BDR)',privacy_consent:true,linkedin:'https://www.linkedin.com/in/qa-recruiting/',source_offer:'career-initiative',resumePdf:null};
test('Bewerbungs-API: richtige Rolle, abgesicherter Ursprung, kein falscher Erfolg',async()=>{
  const {handler,calls}=newHandler();
  let r=await submit(handler,valid);
  assert.equal(r.http,200);
  assert.equal(r.data.ok,true);
  assert.equal(calls.length,1);
  assert.equal(calls[0].payload.source_offer,'career-bdr','server overrides stale client value');
  assert.equal(calls[0].url,'https://www.lengacher-partner.ch/api/career-application');
  r=await submit(handler,valid,'https://evil.example');
  assert.equal(r.http,403);
  r=await submit(handler,{...valid,privacy_consent:false});
  assert.equal(r.http,400);
  r=await submit(handler,{...valid,career_role:'unbekannt'});
  assert.equal(r.http,400);
  r=await submit(handler,{...valid,linkedin:'',resumePdf:{name:'fake.pdf',type:'application/pdf',size:11,data:'QUJDRA=='}});
  assert.equal(r.http,400);
  assert.equal(calls.length,1,'bad submissions never call upstream');
  assert.equal(r.headers['Cache-Control'],'no-store');
});

test('HTML, JS und Security-Gates sind syntaktisch prüfbar',()=>{
  const js=read('karriere/assets/app.js');
  assert.doesNotThrow(()=>new Function(js));
  assert.doesNotThrow(()=>new Function('module','fetch','Buffer','AbortController','setTimeout','clearTimeout',read('api/career-application.js')));
  assert.ok(!js.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(!js.includes('RESEND_API_KEY'));
});
