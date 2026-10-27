'use strict';
const UPSTREAM='https://www.lengacher-partner.ch/api/career-application';
const MAX_BYTES=4*1024*1024;
const ROLE_OFFERS=Object.freeze({"Initiativbewerbung":"career-initiative","Sales Development Representative (SDR)":"career-sdr","Business Development Representative (BDR)":"career-bdr","Account Executive B2B":"career-account-executive","Social Media Manager":"career-social-media-manager","Content Creator":"career-content-creator","Ads Specialist / Performance Marketing":"career-ads-specialist","Executive Assistant / Operations Assistant":"career-executive-assistant","Senior Full-Stack Software Engineer":"career-senior-full-stack-engineer","Backend Software Engineer":"career-backend-engineer","Frontend Software Engineer":"career-frontend-engineer","Mobile App Developer":"career-mobile-app-developer","DevOps & Cloud Engineer":"career-devops-cloud-engineer","QA Automation Engineer":"career-qa-automation-engineer","Cyber Security & Cloud Security Engineer":"career-cyber-cloud-security-engineer","Solution Architect / Technical Lead":"career-solution-architect-technical-lead","Data & AI Engineer":"career-data-ai-engineer","Microsoft Power Platform & CRM Developer":"career-power-platform-crm-developer","BIM/CAD Automation Engineer":"career-bim-cad-automation-engineer","ERP & Abacus Integration Specialist":"career-erp-abacus-integration-specialist","Technical Product Owner / Business Analyst":"career-technical-product-owner","UI/UX Product Designer":"career-ui-ux-product-designer"});
const say=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));};
const validHost=h=>h==='jobs.lengacher-partner.ch'||h==='jobs-app.lengacher-partner.ch'||/^(?:lp-karriere|sdr-recruiting)-[a-z0-9-]+\.vercel\.app$/.test(h)||h==='lp-karriere.vercel.app'||h==='lp-karriere-lengacher-partner.vercel.app';
const normalizeLinkedIn=raw=>{
 if(typeof raw!=='string'||!raw.trim()||raw.trim().length>500)return '';
 try{const u=new URL(raw.trim());const slug=decodeURIComponent(u.pathname.split('/')[2]||'');
  if(u.protocol!=='https:'||! /^(?:[a-z0-9-]+\.)?linkedin\.com$/i.test(u.hostname)||u.username||u.password||u.port||!/^\/(in|pub)\//i.test(u.pathname)||!slug||/[\s/\\]/u.test(slug))return '';
  u.hash='';return u.toString();
 }catch{return '';}
};
module.exports=async function handler(req,res){
if(req.method!=='POST')return say(res,405,{ok:false,message:'Methode nicht erlaubt.'});
const hostHeader=String(req.headers.host||'').toLowerCase();
let authority;try{authority=new URL('http://'+hostHeader);if(authority.host!==hostHeader||authority.username||authority.password||authority.pathname!=='/'||authority.search||authority.hash)throw Error('host');}catch{return say(res,403,{ok:false,message:'Host nicht erlaubt.'});}
const host=authority.hostname;
const origin=String(req.headers.origin||'');
const local=host==='localhost'||host==='127.0.0.1';
const expected=new URL((local?'http://':'https://')+hostHeader).origin;
if(!validHost(host)&&!local)return say(res,403,{ok:false,message:'Host nicht erlaubt.'});
if(!origin||(origin!==expected&&!(host==='jobs-app.lengacher-partner.ch'&&origin==='https://jobs.lengacher-partner.ch')))return say(res,403,{ok:false,message:'Ursprung nicht erlaubt.'});
if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return say(res,415,{ok:false,message:'JSON erforderlich.'});
if(Number(req.headers['content-length']||0)>MAX_BYTES)return say(res,413,{ok:false,message:'Anfrage zu gross.'});
let payload;try{if(typeof req.body==='object'&&req.body)payload=req.body;else{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>MAX_BYTES)return say(res,413,{ok:false,message:'Anfrage zu gross.'});}payload=JSON.parse(raw||'{}');}}catch{return say(res,400,{ok:false,message:'Ungültiges JSON.'});}
if(!payload||typeof payload!=='object'||Array.isArray(payload))return say(res,400,{ok:false,message:'Ungültiges Formular.'});
if(payload.website)return say(res,400,{ok:false,message:'Ungültige Anfrage.'});
const str=(x,n)=>String(x||'').trim().slice(0,n);
const email=str(payload.email,254);
if(!str(payload.name,160)||!/^\S+@\S+\.\S+$/.test(email)||!str(payload.career_role,160)||payload.privacy_consent!==true)return say(res,400,{ok:false,message:'Bitte Pflichtangaben und Einwilligung prüfen.'});
const chosenRole=str(payload.career_role,160);
if(!Object.prototype.hasOwnProperty.call(ROLE_OFFERS,chosenRole))return say(res,400,{ok:false,message:'Bitte eine gültige Rolle auswählen.'});
payload.source_offer=ROLE_OFFERS[chosenRole];
const linkedin=normalizeLinkedIn(payload.linkedin);
if(String(payload.linkedin||'').trim()&&!linkedin)return say(res,400,{ok:false,message:'Bitte ein gültiges LinkedIn-Profil angeben oder das Feld leer lassen.'});
payload.linkedin=linkedin;
const hasLinkedIn=Boolean(linkedin);
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
