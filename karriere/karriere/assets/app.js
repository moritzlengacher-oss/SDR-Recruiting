(()=>{
'use strict';
const cards=[...document.querySelectorAll('.job-card')];
const filters=[...document.querySelectorAll('.filter')];
const search=document.getElementById('job-search');
const locationFilter=document.getElementById('job-location');
const levelFilter=document.getElementById('job-level');
let category='Alle';
function norm(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-CH');}
function renderFilter(){let c=0;const q=norm(search?.value).trim().split(/\s+/).filter(Boolean);for(const card of cards){const ok=(category==='Alle'||card.dataset.category===category)&&(!locationFilter?.value||norm(card.dataset.location).includes(norm(locationFilter.value)))&&(!levelFilter?.value||norm(card.dataset.level)===norm(levelFilter.value))&&q.every(x=>norm([card.dataset.search,card.dataset.level].join(' ')).includes(x));card.hidden=!ok;if(ok)c++;}const count=document.getElementById('job-count');if(count)count.textContent=c+' Stellen verfügbar';const empty=document.getElementById('no-results');if(empty)empty.hidden=c!==0;}
filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;filters.forEach(x=>{const a=x===b;x.classList.toggle('active',a);x.setAttribute('aria-pressed',String(a));});renderFilter();}));
search?.addEventListener('input',renderFilter);
locationFilter?.addEventListener('change',renderFilter);
levelFilter?.addEventListener('change',renderFilter);
document.getElementById('job-reset')?.addEventListener('click',()=>{category='Alle';if(search)search.value='';if(locationFilter)locationFilter.value='';if(levelFilter)levelFilter.value='';filters.forEach(b=>{const active=b.dataset.filter==='Alle';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderFilter();});
const form=document.getElementById('application');if(!form)return;
const careerOfferMap={"Initiativbewerbung":"career-initiative","Sales Development Representative (SDR)":"career-sdr","Business Development Representative (BDR)":"career-bdr","Account Executive B2B":"career-account-executive","Social Media Manager":"career-social-media-manager","Content Creator":"career-content-creator","Ads Specialist / Performance Marketing":"career-ads-specialist","Executive Assistant / Operations Assistant":"career-executive-assistant","Senior Full-Stack Software Engineer":"career-senior-full-stack-engineer","Backend Software Engineer":"career-backend-engineer","Frontend Software Engineer":"career-frontend-engineer","Mobile App Developer":"career-mobile-app-developer","DevOps & Cloud Engineer":"career-devops-cloud-engineer","QA Automation Engineer":"career-qa-automation-engineer","Cyber Security & Cloud Security Engineer":"career-cyber-cloud-security-engineer","Solution Architect / Technical Lead":"career-solution-architect-technical-lead","Data & AI Engineer":"career-data-ai-engineer","Microsoft Power Platform & CRM Developer":"career-power-platform-crm-developer","BIM/CAD Automation Engineer":"career-bim-cad-automation-engineer","ERP & Abacus Integration Specialist":"career-erp-abacus-integration-specialist","Technical Product Owner / Business Analyst":"career-technical-product-owner","UI/UX Product Designer":"career-ui-ux-product-designer"};
const roleSelect=form.elements.namedItem('career_role');
const sourceOfferField=form.elements.namedItem('source_offer');
function syncCareerOffer(){if(roleSelect&&sourceOfferField){sourceOfferField.value=careerOfferMap[roleSelect.value]||'career-initiative';}}
roleSelect?.addEventListener('change',syncCareerOffer);
syncCareerOffer();
document.querySelectorAll('[data-quick-role]').forEach(a=>a.addEventListener('click',()=>{if(roleSelect){roleSelect.value=a.dataset.quickRole;syncCareerOffer();}}));
const status=form.querySelector('.form-status');const button=form.querySelector('.submit');const link=form.elements.namedItem('linkedin');const file=form.elements.namedItem('resumePdfFile');
const say=(state,message)=>{status.hidden=false;status.dataset.state=state;status.textContent=message;};
const normalizeLinkedIn=(raw)=>{if(!raw?.trim())return '';try{const u=new URL(raw.trim());const host=u.hostname.toLowerCase();if(u.protocol!=='https:'||!(host==='linkedin.com'||host.endsWith('.linkedin.com'))||!/^\/(in|pub)\//.test(u.pathname))return '';u.hash='';return u.toString();}catch{return '';}};
const toBase64=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=()=>reject(new Error('PDF kann nicht gelesen werden.'));r.readAsDataURL(f);});
function uid(){return globalThis.crypto?.randomUUID?.()||('career-'+Date.now()+'-'+Math.random().toString(36).slice(2));}
form.addEventListener('submit',async(e)=>{e.preventDefault();if(!form.reportValidity())return;
const lnk=normalizeLinkedIn(link.value);const f=file.files?.[0]||null;
if(link.value&& !lnk){say('error','Bitte gib eine gültige LinkedIn-Profiladresse mit https://linkedin.com/in/... an.');link.focus();return;}
if(!lnk&&!f){say('error','Bitte gib ein LinkedIn-Profil an oder lade einen PDF-CV hoch.');return;}
let resumePdf=null;
if(f){if(f.size>2*1024*1024||!f.name.toLowerCase().endsWith('.pdf')||(f.type&&f.type!=='application/pdf')){say('error','Der CV muss eine PDF-Datei mit maximal 2 MB sein.');return;}
try{const signature=new TextDecoder().decode(await f.slice(0,5).arrayBuffer());if(signature!=='%PDF-'){say('error','Der CV hat keine gültige PDF-Signatur.');return;}
resumePdf={name:f.name,type:'application/pdf',size:f.size,data:await toBase64(f)};}catch{say('error','Die PDF-Datei konnte nicht gelesen werden. Bitte wähle sie erneut aus.');return;}}
const entries=[...new FormData(form).entries()].filter(([,v])=>typeof v==='string');
const data=Object.fromEntries(entries);data.linkedin=lnk;data.privacy_consent=data.privacy_consent==='yes';const submissionInput=form.elements.namedItem('submission_id');data.submission_id=submissionInput?.value||uid();if(submissionInput)submissionInput.value=data.submission_id;data.source_url=location.href;data.source_offer=String(data.source_offer||'career-initiative');data.resumePdf=resumePdf;
for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const value=new URLSearchParams(location.search).get(key);if(value)data[key]=value.slice(0,200);}
const label=button.textContent;button.disabled=true;button.textContent='Wird sicher gesendet …';say('loading','Deine Bewerbung wird übermittelt …');
try{const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),25000);let res;try{res=await fetch('/api/career-application',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:ctrl.signal});}finally{clearTimeout(timeout);}
const body=await res.json().catch(()=>({}));if(!res.ok||body.ok!==true)throw Error(body.message||'Die Bewerbung konnte nicht bestätigt werden.');
say('success','Vielen Dank! Deine Bewerbung wurde übermittelt.'+(body.reference?' Referenz: '+body.reference:'')+' Wir melden uns persönlich.');form.reset();syncCareerOffer();
}catch(err){say('error',err?.message==='This operation was aborted'?'Zeitüberschreitung. Bitte nochmals versuchen.':(err?.message||'Übermittlung fehlgeschlagen. Bitte versuche es erneut.'));}
finally{button.disabled=false;button.textContent=label;}
});
})();