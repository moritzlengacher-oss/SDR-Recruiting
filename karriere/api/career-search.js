'use strict';
// Public search content only. Caller input never changes the upstream URL or headers.
const MAIN_ORIGIN='https://www.lengacher-partner.ch';
const UPSTREAM=MAIN_ORIGIN+'/api/scheduled-content?kind=search';
const MAX_BYTES=1024*1024;
const text=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
function respond(res,status,data){
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control',status===200?'public, max-age=0, s-maxage=60, stale-while-revalidate=300':'no-store');
 res.end(JSON.stringify(data));
}
function normalizeItem(item){
 if(!item||typeof item!=='object'||!text(item.title,300))return null;
 const raw=item.canonical||item.url;
 if(typeof raw!=='string')return null;
 try{
  const url=new URL(raw,MAIN_ORIGIN);
  if(url.origin!==MAIN_ORIGIN||url.username||url.password||!/^\/blog\/[^/]+\/?$/.test(url.pathname))return null;
  url.hash='';url.search='';url.pathname=url.pathname.replace(/\/$/,'');
  return {type:'Blog',title:text(item.title,300),desc:text(item.description,2000),url:url.href,keywords:text(item.keywords,3000)};
 }catch{return null;}
}
module.exports=async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return respond(res,405,{ok:false,message:'Methode nicht erlaubt.'});}
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),4000);
 try{
  const upstream=await fetch(UPSTREAM,{method:'GET',headers:{Accept:'application/json'},redirect:'error',signal:controller.signal});
  if(!upstream.ok||!String(upstream.headers.get('content-type')||'').toLowerCase().includes('application/json')||Number(upstream.headers.get('content-length')||0)>MAX_BYTES)throw Error('Invalid public search response');
  const raw=await upstream.text();
  if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Public search response too large');
  const data=JSON.parse(raw);
  if(!Array.isArray(data))throw Error('Invalid public search data');
  const unique=new Map();
  for(const item of data){const entry=normalizeItem(item);if(entry)unique.set(entry.url,entry);}
  return respond(res,200,[...unique.values()]);
 }catch{return respond(res,503,{ok:false,message:'Die ergänzenden Suchinhalte sind vorübergehend nicht verfügbar.'});}
 finally{clearTimeout(timeout);}
};
