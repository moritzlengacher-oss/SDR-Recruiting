'use strict';
const UPSTREAM='https://www.lengacher-partner.ch/api/career-application';
const MAX_BYTES=4*1024*1024;
const say=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));};
const validHost=h=>h==='jobs.lengacher-partner.ch'||/^(?:lp-karriere|sdr-recruiting)-[a-z0-9-]+\.vercel\.app$/.test(h)||h==='lp-karriere.vercel.app'||h==='lp-karriere-lengacher-partner.vercel.app'||h==='localhost:3000'||h==='127.0.0.1:3000';
module.exports=async function handler(req,res){
if(req.method!=='POST')return say(res,405,{ok:false,message:'Methode nicht erlaubt.'});
const host=String(req.headers.host||'').toLowerCase().split(':')[0];
const origin=String(req.headers.origin||'');
const expected='https://'+String(req.headers.host||'');
const local=String(req.headers.host||'').startsWith('localhost')||String(req.headers.host||'').startsWith('127.0.0.1');
if(!validHost(host)&&!local)return say(res,403,{ok:false,message:'Host nicht erlaubt.'});
if(!origin||origin!==(local?'http://'+req.headers.host:expected))return say(res,403,{ok:false,message:'Ursprung nicht erlaubt.'});
if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return say(res,415,{ok:false,message:'JSON erforderlich.'});
if(Number(req.headers['content-length']||0)>MAX_BYTES)return say(res,413,{ok:false,message:'Anfrage zu gross.'});
let payload;try{if(typeof req.body==='object'&&req.body)payload=req.body;else{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>MAX_BYTES)return say(res,413,{ok:false,message:'Anfrage zu gross.'});}payload=JSON.parse(raw||'{}');}}catch{return say(res,400,{ok:false,message:'Ungültiges JSON.'});}
if(!payload||typeof payload!=='object'||Array.isArray(payload))return say(res,400,{ok:false,message:'Ungültiges Formular.'});
if(payload.website)return say(res,400,{ok:false,message:'Ungültige Anfrage.'});
const str=(x,n)=>String(x||'').trim().slice(0,n);
const email=str(payload.email,254);
if(!str(payload.name,160)||!/^\S+@\S+\.\S+$/.test(email)||!str(payload.career_role,160)||payload.privacy_consent!==true)return say(res,400,{ok:false,message:'Bitte Pflichtangaben und Einwilligung prüfen.'});
const hasLinkedIn=/^https:\/\/(?:[a-z0-9-]+\.)?linkedin\.com\/(in|pub)\//i.test(str(payload.linkedin,500));
let resume=payload.resumePdf||null;
if(!hasLinkedIn&&!resume)return say(res,400,{ok:false,message:'LinkedIn-Profil oder PDF-CV erforderlich.'});
if(resume){if(typeof resume!=='object'||!String(resume.name||'').toLowerCase().endsWith('.pdf')||resume.type!=='application/pdf'||!Number.isSafeInteger(resume.size)||resume.size>2097152||resume.size<=0||!resume.data||typeof resume.data!=='string')return say(res,400,{ok:false,message:'Ungültiger PDF-CV.'});
let raw;try{raw=Buffer.from(resume.data,'base64');}catch{return say(res,400,{ok:false,message:'Ungültiger PDF-CV.'});}
if(raw.length!==resume.size||raw.subarray(0,5).toString()!=='%PDF-')return say(res,400,{ok:false,message:'Ungültiger PDF-CV.'});}
if(Buffer.byteLength(JSON.stringify(payload))>MAX_BYTES)return say(res,413,{ok:false,message:'Anfrage zu gross.'});
try{const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),22000);let upstream;try{upstream=await fetch(UPSTREAM,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','User-Agent':'LP-Jobs-Application-Relay/1.0'},body:JSON.stringify(payload),signal:ctrl.signal});}finally{clearTimeout(timer);}
const text=await upstream.text();let answer;try{answer=JSON.parse(text)}catch{answer={ok:false,message:'Keine gültige Bestätigung vom Bewerbungssystem.'};}
if(upstream.ok&&answer.ok===true)return say(res,200,{ok:true,reference:typeof answer.reference==='string'?answer.reference:''});
if(upstream.status>=400&&upstream.status<500)return say(res,upstream.status,{ok:false,message:String(answer.message||'Bitte Angaben prüfen.').slice(0,250)});
return say(res,502,{ok:false,message:'Der Bewerbungsdienst ist derzeit nicht erreichbar. Bitte später erneut versuchen.'});
}catch{return say(res,502,{ok:false,message:'Übertragung an das Bewerbungssystem fehlgeschlagen. Bitte später erneut versuchen.'});}
};