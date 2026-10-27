import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const apiSource=fs.readFileSync(path.join(root,'api/career-application.js'),'utf8');
const appSource=fs.readFileSync(path.join(root,'karriere/assets/app.js'),'utf8');
const valid={name:'ASU mock contract',email:'qa@example.invalid',career_role:'Sales Development Representative (SDR)',privacy_consent:true,linkedin:'https://www.linkedin.com/in/valid-profile',submission_id:'stable-submission-id'};
const pdfBytes=Buffer.from('%PDF-1.4');
const validPdf={name:'cv.pdf',type:'application/pdf',size:pdfBytes.length,data:pdfBytes.toString('base64')};
const invalidProfiles=[
 'https://www.linkedin.com/in/',
 'https://linkedin.com/pub/',
 'https://www.linkedin.com/in/%20',
 'https://www.linkedin.com/in/%2F',
 'http://www.linkedin.com/in/person',
 'https://linkedin.com.evil.example/in/person',
 'https://evil.example/in/person',
 'https://user:password@linkedin.com/in/person',
 'https://www.linkedin.com:8443/in/person',
 'https://www.linkedin.com/company/example'
];

function apiFixture(){
 const calls=[];
 const fakeFetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,status:200,text:async()=>JSON.stringify({ok:true,reference:'MOCK-REFERENCE'})};};
 const module={exports:{}};
 new Function('module','fetch','Buffer','AbortController','setTimeout','clearTimeout',apiSource)(module,fakeFetch,Buffer,AbortController,setTimeout,clearTimeout);
 return {
  calls,
  async submit(body={},headers={}){
   const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(text){this.body=JSON.parse(text);}};
   await module.exports({method:'POST',headers:{host:'jobs.lengacher-partner.ch',origin:'https://jobs.lengacher-partner.ch','content-type':'application/json',...headers},body:{...valid,...body}},res);
   return res;
  }
 };
}

function clientFixture(options={}){
 const listeners={},requests=[],attributes={};
 const values={name:'ASU mock contract',email:'qa@example.invalid',career_role:valid.career_role,privacy_consent:'yes',linkedin:options.linkedin??valid.linkedin,source_offer:'career-initiative',submission_id:'',website:''};
 const fields=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value,focus(){this.focused=true;},addEventListener(){}}]));
 fields.resumePdfFile={files:options.file?[options.file]:[]};
 const status={hidden:true,dataset:{},textContent:''};
 const button={textContent:'Bewerbung sicher senden →',disabled:false};
 let resetCount=0;
 const form={
  elements:{namedItem:name=>fields[name]||null},
  querySelector:selector=>selector==='.submit'?button:selector==='.form-status'?status:null,
  addEventListener:(event,callback)=>{listeners[event]=callback;},
  reportValidity:()=>true,
  setAttribute:(name,value)=>{attributes[name]=value;},
  removeAttribute:name=>{delete attributes[name];},
  reset(){resetCount++;fields.submission_id.value='';}
 };
 const document={querySelectorAll:()=>[],getElementById:id=>id==='application'?form:null};
 class MockFormData{entries(){return Object.entries(fields).filter(([,field])=>typeof field.value==='string').map(([key,field])=>[key,field.value])[Symbol.iterator]();}}
 class MockFileReader{readAsDataURL(){this.result='data:application/pdf;base64,'+pdfBytes.toString('base64');this.onload();}}
 const fakeFetch=async(url,init)=>{
  requests.push({url,body:JSON.parse(init.body)});
  if(options.fetch)return options.fetch(requests.length);
  return {ok:true,json:async()=>({ok:true,reference:'MOCK-REFERENCE'})};
 };
 vm.runInNewContext(appSource,{document,URL,URLSearchParams,TextDecoder,AbortController,setTimeout,clearTimeout,FileReader:MockFileReader,FormData:MockFormData,location:{href:'https://jobs.lengacher-partner.ch/karriere',search:''},crypto:{randomUUID:()=> 'mock-stable-id'},fetch:fakeFetch});
 return {fields,status,button,attributes,requests,get resetCount(){return resetCount;},submit:()=>listeners.submit({preventDefault(){}})};
}

test('API rejects empty, unrelated and credential-bearing LinkedIn URLs before upstream, even with a PDF',async()=>{
 const fixture=apiFixture();
 for(const linkedin of invalidProfiles){
  for(const resumePdf of [null,validPdf]){
   const response=await fixture.submit({linkedin,resumePdf});
   assert.equal(response.statusCode,400,linkedin);
   assert.equal(response.body.ok,false,linkedin);
  }
 }
 assert.equal(fixture.calls.length,0,'all upstream effects are stubbed and invalid requests never reach the stub');
});

test('API keeps valid public profiles, removes fragments and supports a PDF without LinkedIn',async()=>{
 const fixture=apiFixture();
 for(const linkedin of ['https://linkedin.com/in/valid-person','https://ch.linkedin.com/in/person-name#details','https://www.linkedin.com/pub/person/12/345']){
  assert.equal((await fixture.submit({linkedin})).statusCode,200);
  assert.equal(fixture.calls.at(-1).body.linkedin,new URL(linkedin).href.split('#')[0]);
 }
 assert.equal((await fixture.submit({linkedin:'',resumePdf:validPdf})).statusCode,200);
 assert.equal(fixture.calls.at(-1).body.linkedin,'');
});

test('API rejects lookalike localhost authorities and foreign origins without forwarding',async()=>{
 const fixture=apiFixture();
 for(const host of ['localhost.evil.example','127.0.0.1.evil.example','localhost-other.example','evil.example','jobs.lengacher-partner.ch.evil.example','localhost:3000/path']){
  const response=await fixture.submit({}, {host,origin:'http://'+host});
  assert.equal(response.statusCode,403,host);
 }
 assert.equal((await fixture.submit({}, {origin:'https://evil.example'})).statusCode,403);
 assert.equal(fixture.calls.length,0);
});

test('API allows exact development hosts and the existing production proxy contract',async()=>{
 const fixture=apiFixture();
 for(const [host,origin]of [['localhost:3000','http://localhost:3000'],['127.0.0.1:3000','http://127.0.0.1:3000'],['jobs-app.lengacher-partner.ch','https://jobs.lengacher-partner.ch']]){
  assert.equal((await fixture.submit({}, {host,origin})).statusCode,200,host);
 }
 assert.equal(fixture.calls.length,3);
});

test('API preserves the stable submission ID and derives source_offer from the selected role',async()=>{
 const fixture=apiFixture();
 assert.equal((await fixture.submit({source_offer:'wrong-value'})).statusCode,200);
 assert.equal(fixture.calls[0].body.submission_id,valid.submission_id);
 assert.equal(fixture.calls[0].body.source_offer,'career-sdr');
 assert.equal(fixture.calls[0].url,'https://www.lengacher-partner.ch/api/career-application');
});

test('client refuses the same invalid profile URLs without a fetch or a form reset',async()=>{
 for(const linkedin of invalidProfiles){
  const fixture=clientFixture({linkedin});
  await fixture.submit();
  assert.equal(fixture.requests.length,0,linkedin);
  assert.equal(fixture.resetCount,0,linkedin);
  assert.equal(fixture.status.dataset.state,'error',linkedin);
  assert.equal(fixture.button.disabled,false,linkedin);
 }
});

test('client prevents a second submission while PDF signature reading is pending',async()=>{
 let release;
 const signature=new Promise(resolve=>{release=resolve;});
 const file={name:'cv.pdf',size:pdfBytes.length,type:'application/pdf',slice:()=>({arrayBuffer:()=>signature})};
 const fixture=clientFixture({linkedin:'',file});
 const first=fixture.submit();
 assert.equal(fixture.button.disabled,true);
 assert.equal(fixture.attributes['aria-busy'],'true');
 await fixture.submit();
 assert.equal(fixture.requests.length,0);
 release(pdfBytes.subarray(0,5));
 await first;
 assert.equal(fixture.requests.length,1);
 assert.equal(fixture.resetCount,1);
 assert.equal(fixture.button.disabled,false);
 assert.equal(fixture.attributes['aria-busy'],undefined);
});

test('client restores controls after invalid PDF data so the applicant can correct it',async()=>{
 const file={name:'cv.pdf',size:5,type:'application/pdf',slice:()=>({arrayBuffer:async()=>Buffer.from('WRONG')})};
 const fixture=clientFixture({linkedin:'',file});
 await fixture.submit();
 assert.equal(fixture.requests.length,0);
 assert.equal(fixture.status.dataset.state,'error');
 assert.equal(fixture.button.disabled,false);
 assert.equal(fixture.attributes['aria-busy'],undefined);
 fixture.fields.resumePdfFile.files=[];
 fixture.fields.linkedin.value=valid.linkedin;
 await fixture.submit();
 assert.equal(fixture.requests.length,1);
});

test('client retains the submission ID for a retry and resets it only after confirmation',async()=>{
 const fixture=clientFixture({fetch:async attempt=>({ok:attempt>1,json:async()=>attempt>1?{ok:true}:{ok:false,message:'Vorübergehend nicht erreichbar.'}})});
 await fixture.submit();
 const key=fixture.fields.submission_id.value;
 assert.equal(key,'mock-stable-id');
 assert.equal(fixture.resetCount,0);
 await fixture.submit();
 assert.equal(fixture.requests.length,2);
 assert.equal(fixture.requests[0].body.submission_id,key);
 assert.equal(fixture.requests[1].body.submission_id,key);
 assert.equal(fixture.fields.submission_id.value,'');
 assert.equal(fixture.resetCount,1);
});

test('client recognizes AbortError by its name and keeps the retry message in German',async()=>{
 const fixture=clientFixture({fetch:async()=>{const error=new Error('Browser-specific abort wording');error.name='AbortError';throw error;}});
 await fixture.submit();
 assert.equal(fixture.status.dataset.state,'error');
 assert.equal(fixture.status.textContent,'Zeitüberschreitung. Bitte nochmals versuchen.');
 assert.equal(fixture.resetCount,0);
 assert.equal(fixture.button.disabled,false);
});

test('client gives a German retry message after a network TypeError',async()=>{
 const fixture=clientFixture({fetch:async()=>{throw new TypeError('Failed to fetch');}});
 await fixture.submit();
 assert.equal(fixture.status.dataset.state,'error');
 assert.match(fixture.status.textContent,/Internetverbindung/);
 assert.equal(fixture.resetCount,0);
 assert.equal(fixture.button.disabled,false);
});
