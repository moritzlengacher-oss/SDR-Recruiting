import fs from 'node:fs';
import path from 'node:path';
// Preview-only viewport fixtures. Never included in the production output.
export function writePreviewFixtures(output){
 const dir=path.join(output,'__qa');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'viewport.css'),'body{margin:0;background:#dedede}iframe{display:block;height:900px;border:0;margin:0 auto}.w390{width:390px}.w320{width:320px}');
 fs.writeFileSync(path.join(dir,'prevent-submissions.js'),`(()=>{const originalFetch=window.fetch.bind(window);window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.origin);if(url.pathname==='/api/career-application')return Promise.resolve(new Response(JSON.stringify({ok:false,message:'QA-Vorschau: keine echte Bewerbung gesendet.'}),{status:503,headers:{'Content-Type':'application/json'}}));return originalFetch(input,options);};})();`);
 for(const width of [320,390])for(const detail of [false,true]){
  const source=detail?'karriere/sales-development-representative-luzern/index.html':'karriere/index.html';
  let html=fs.readFileSync(path.join(output,source),'utf8').replace('<head>','<head><base href="/"><script src="/__qa/prevent-submissions.js"></script>');
  html=html.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const page='<!doctype html><html lang="de"><head><meta name="robots" content="noindex,nofollow"><meta charset="utf-8"><title>Karriere QA '+width+'</title><link rel="stylesheet" href="/__qa/viewport.css"></head><body><iframe class="w'+width+'" title="Karriere Mobilansicht" srcdoc="'+html+'"></iframe></body></html>';
  fs.writeFileSync(path.join(dir,(detail?'detail-':'overview-')+width+'.html'),page);
 }
}
