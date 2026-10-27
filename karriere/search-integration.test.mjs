import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const relaySource=fs.readFileSync(path.join(root,'api/career-search.js'),'utf8');
const shellSource=fs.readFileSync(path.join(root,'karriere/assets/brand-shell.js'),'utf8');
const MAIN='https://www.lengacher-partner.ch';
const JOBS='https://jobs.lengacher-partner.ch';
const article={type:'Blog',title:'Aktuelle Prozessoptimierung',description:'Prozesse mit vorhandenen Daten verbessern.',url:'/blog/aktuelle-prozessoptimierung',canonical:MAIN+'/blog/aktuelle-prozessoptimierung',keywords:'Prozessanalyse Daten'};

async function invokeRelay(options={}){
 const calls=[];
 const fakeFetch=async(url,init)=>{
  calls.push({url,init});
  if(options.error)throw options.error;
  return {ok:options.ok??true,headers:{get:name=>name==='content-type'?(options.contentType??'application/json; charset=utf-8'):null},text:async()=>options.raw??JSON.stringify(options.data??[article])};
 };
 const module={exports:{}};
 new Function('module','fetch','Buffer','AbortController','setTimeout','clearTimeout',relaySource)(module,fakeFetch,Buffer,AbortController,setTimeout,clearTimeout);
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(raw){this.body=JSON.parse(raw);}};
 await module.exports({method:options.method??'GET',url:'/api/career-search?url=https://evil.example',headers:{cookie:'must-not-forward',authorization:'must-not-forward'}},res);
 return {...res,calls};
}

function clientFixture(sources={}){
 const listeners={};let document;
 function element(tag='div'){
  const classes=new Set();
  const value={tag,children:[],listeners:{},hidden:false,style:{},isConnected:true,textContent:'',value:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);if(on)classes.add(x);else classes.delete(x);}},
   setAttribute(){},removeAttribute(){},addEventListener:(event,fn)=>{value.listeners[event]=fn;},focus(){document.activeElement=value;},append(...children){value.children.push(...children);},replaceChildren(...children){value.children=[...children];},querySelector:()=>null,querySelectorAll:()=>value.children};
  Object.defineProperty(value,'innerHTML',{set(){throw Error('Search results must use textContent, not HTML insertion');}});
  return value;
 }
 const overlay=element(),input=element('input'),results=element(),empty=element(),hint=element(),trigger=element('button'),close=element('button');
 overlay.hidden=true;overlay.querySelector=selector=>selector==='.search-close'?close:null;
 const fallback=[{textContent:'Kontakt Original',href:MAIN+'/kontakt'}];
 const ids={'search-overlay':overlay,'search-input':input,'search-results':results,'search-empty':empty,'search-hint':hint};
 document={body:element(),getElementById:id=>ids[id]||null,querySelector:()=>null,querySelectorAll:selector=>selector==='.nav-search-btn'?[trigger]:selector.includes('.site-nav a[href]')?fallback:[],createElement:element,addEventListener:(event,fn)=>{listeners[event]=fn;}};
 const requests=[];
 const defaultSources={'/assets/lp-brand/search-index.json':[{type:'Leistung',title:'Original Beratung',desc:'Statischer Inhalt',url:MAIN+'/beratung'}],'/karriere/assets/jobs-search.json':[{type:'Stelle',title:'Software Engineer',desc:'Karriere',url:'/karriere/software-engineer'}],'/api/career-search':[]};
 const fakeFetch=async(url)=>{
  requests.push(url);const value=Object.prototype.hasOwnProperty.call(sources,url)?sources[url]:defaultSources[url];
  if(value instanceof Error)throw value;
  const data=typeof value==='function'?await value():await value;
  return {ok:true,json:async()=>data};
 };
 vm.runInNewContext(shellSource,{window:{matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){},scrollY:0},document,location:{origin:JOBS,hostname:'jobs.lengacher-partner.ch'},URL,AbortController,setTimeout,clearTimeout,fetch:fakeFetch});
 return {input,results,empty,hint,requests,async query(text){overlay.hidden=false;input.value=text;await input.listeners.input();},async settle(){await new Promise(setImmediate);},titles:()=>results.children.map(link=>link.children[1].textContent),urls:()=>results.children.map(link=>link.href)};
}

test('public relay reads only the fixed original source, normalizes URLs and removes unsafe or duplicate entries',async()=>{
 const response=await invokeRelay({data:[article,{...article,url:'/blog/aktuelle-prozessoptimierung/',canonical:MAIN+'/blog/aktuelle-prozessoptimierung/'},{...article,canonical:'https://evil.example/blog/evil'},{...article,canonical:'https://user:password@www.lengacher-partner.ch/blog/secret'},{...article,canonical:'javascript:alert(1)'},{...article,canonical:MAIN+'/api/private'},null,{url:'/blog/no-title'}]});
 assert.equal(response.statusCode,200);
 assert.equal(response.body.length,1);
 assert.equal(response.body[0].url,MAIN+'/blog/aktuelle-prozessoptimierung');
 assert.equal(response.body[0].desc,article.description);
 assert.deepEqual(response.calls[0].init.headers,{Accept:'application/json'});
 assert.equal(response.calls[0].init.method,'GET');
 assert.equal(response.calls[0].init.redirect,'error');
 assert.equal(response.calls[0].url,MAIN+'/api/scheduled-content?kind=search');
 assert.match(response.headers['Cache-Control'],/s-maxage=60/);
});

test('public relay is GET-only and never forwards mutation methods',async()=>{
 for(const method of ['POST','PUT','PATCH','DELETE']){
  const response=await invokeRelay({method});
  assert.equal(response.statusCode,405,method);assert.equal(response.headers.Allow,'GET');assert.equal(response.calls.length,0);
 }
});

test('public relay reports source failure honestly and does not cache unavailable or invalid data',async()=>{
 for(const options of [{ok:false},{contentType:'text/html'},{raw:'not json'},{data:{items:[article]}},{raw:' '.repeat(1024*1024+1)},{error:Object.assign(new Error('timeout'),{name:'AbortError'})}]){
  const response=await invokeRelay(options);assert.equal(response.statusCode,503);assert.equal(response.body.ok,false);assert.equal(response.headers['Cache-Control'],'no-store');
 }
});

test('career global search includes all dynamic articles and canonical deduplication preserves updated text',async()=>{
 const dynamic=Array.from({length:12},(_,i)=>({type:'Blog',title:'Aktueller Artikel '+i,desc:'Öffentlicher Inhalt',url:MAIN+'/blog/aktuell-'+i,keywords:'aktuell'}));
 const fixture=clientFixture({'/assets/lp-brand/search-index.json':[{type:'Blog',title:'Alter Titel',url:MAIN+'/blog/aktuell-0/'}],'/api/career-search':dynamic});
 await fixture.query('aktuell');await fixture.settle();
 assert.equal(fixture.titles().length,12);
 assert.deepEqual(fixture.titles(),dynamic.map(item=>item.title));
 assert.equal(new Set(fixture.urls()).size,12);
 assert.equal(fixture.requests.filter(url=>url==='/api/career-search').length,1);
 await fixture.query('Software');assert.deepEqual(fixture.titles(),['Software Engineer']);
});

test('static and career search remain usable while the live source is still pending',async()=>{
 let release;const pending=new Promise(resolve=>{release=resolve;});
 const fixture=clientFixture({'/api/career-search':pending});
 await fixture.query('Original');assert.deepEqual(fixture.titles(),['Original Beratung']);
 await fixture.query('Software');assert.deepEqual(fixture.titles(),['Software Engineer']);
 release([{type:'Blog',title:'Frischer Artikel',url:MAIN+'/blog/frisch'}]);await fixture.settle();
 await fixture.query('Frischer');assert.deepEqual(fixture.titles(),['Frischer Artikel']);
});

test('live source outage preserves static and career results',async()=>{
 const fixture=clientFixture({'/api/career-search':new Error('upstream unavailable')});
 await fixture.query('Original');await fixture.settle();assert.deepEqual(fixture.titles(),['Original Beratung']);
 await fixture.query('Software');assert.deepEqual(fixture.titles(),['Software Engineer']);
});

test('one broken local index does not discard the other index, DOM fallback or current articles',async()=>{
 const fixture=clientFixture({'/assets/lp-brand/search-index.json':new Error('static unavailable'),'/api/career-search':[{type:'Blog',title:'Frischer Artikel',url:MAIN+'/blog/frisch'}]});
 await fixture.query('Software');await fixture.settle();assert.deepEqual(fixture.titles(),['Software Engineer']);
 await fixture.query('Kontakt');assert.deepEqual(fixture.titles(),['Kontakt Original']);
 await fixture.query('Frischer');assert.deepEqual(fixture.titles(),['Frischer Artikel']);
});

test('search renders source text as text and refuses script, foreign or credential-bearing destinations',async()=>{
 const title='<img src=x onerror=alert(1)> Aktuell';
 const fixture=clientFixture({'/api/career-search':[{type:'Blog',title,url:MAIN+'/blog/text-only'},{title:'Aktuell Fremd',url:'https://evil.example/'},{title:'Aktuell Skript',url:'javascript:alert(1)'},{title:'Aktuell Zugang',url:'https://user:secret@www.lengacher-partner.ch/blog/secret'}]});
 await fixture.query('Aktuell');await fixture.settle();
 assert.deepEqual(fixture.titles(),[title]);
 assert.deepEqual(fixture.urls(),[MAIN+'/blog/text-only']);
 assert.equal(fixture.results.children[0].children[1].tag,'span');
});

test('DOM navigation fallback remains searchable if every index source fails',async()=>{
 const failure=new Error('offline');
 const fixture=clientFixture({'/assets/lp-brand/search-index.json':failure,'/karriere/assets/jobs-search.json':failure,'/api/career-search':failure});
 await fixture.query('Kontakt');await fixture.settle();assert.deepEqual(fixture.titles(),['Kontakt Original']);
});
