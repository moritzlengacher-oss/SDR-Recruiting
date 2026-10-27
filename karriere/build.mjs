import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const output=path.join(root,'public');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('brand/source-manifest.json'));
const assets=JSON.parse(gunzipSync(Buffer.from(read('brand/original-assets.b64').trim(),'base64')).toString('utf8'));
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const [relative,encoded] of Object.entries(assets)){
 if(!manifest.assets[relative]||relative.includes('..')||path.isAbsolute(relative))throw Error('Unexpected brand asset '+relative);
 const bytes=Buffer.from(encoded,'base64'), expected=manifest.assets[relative];
 if(bytes.length!==expected.bytes||createHash('sha256').update(bytes).digest('hex')!==expected.sha256)throw Error('Brand asset checksum mismatch '+relative);
 const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
}
if(Object.keys(assets).length!==Object.keys(manifest.assets).length)throw Error('Missing original brand assets');
fs.cpSync(path.join(root,'karriere'),path.join(output,'karriere'),{recursive:true});
const header=read('brand/header.html'),footer=read('brand/footer.html'),search=read('brand/search.html'),brandHead=read('brand/head.html');
const careerSearch=[{type:'Karriere',title:'Karriere bei Lengacher & Partner',desc:'Alle offenen Stellen, Arbeitsalltag und Bewerbung bei L&P.',url:'/karriere',keywords:'Karriere Jobs Stellen Bewerbung Luzern Hybrid Remote'}];
let pageCount=0;
const stripTags=value=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const jsonForHtml=value=>JSON.stringify(value).replace(/</g,'\\u003c');
function completeJobSchema(html,job,file){
 const copy=html.match(/<div class="lp-jobs-detail-copy">([\s\S]*?)<\/div><aside class="lp-jobs-facts">/);
 const facts=html.match(/<aside class="lp-jobs-facts">[\s\S]*?<dl>([\s\S]*?)<\/dl>/);
 if(!copy||!facts)throw Error('Missing visible job content '+file);
 // The visible advert is authoritative. Never invent requirements, pay or new posting dates.
 const description=copy[1].replace(/<h[23]\b[^>]*>/g,'<p>').replace(/<\/h[23]>/g,'</p>')
  .replace(/<\/?(?:div|span)\b[^>]*>/g,'').replace(/<(p|ul|li|br|b)\b[^>]*>/g,'<$1>');
 const entries=[...facts[1].matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)];
 if(entries.length!==5)throw Error('Incomplete visible job facts '+file);
 job.description=description+entries.map(([,key,value])=>'<p>'+key+': '+value+'</p>').join('');
 const workload=entries.find(([,key])=>key==='Pensum')?.[2];
 const percentages=(workload?.match(/\d+/g)||[]).map(Number);
 if(!percentages.length)throw Error('Missing job workload '+file);
 job.employmentType=[...(percentages.includes(100)?['FULL_TIME']:[]),...(percentages.some(n=>n<100)?['PART_TIME']:[])];
 job.hiringOrganization.logo='https://www.lengacher-partner.ch/assets/lengacher-partner-logo.webp';
 return job;
}
function render(dir){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){render(file);continue;}
  if(!item.name.endsWith('.html'))continue;
  let html=fs.readFileSync(file,'utf8');
  for(const [marker,partial]of [['<!-- LP_BRAND_HEAD -->',brandHead],['<!-- LP_HEADER -->',header],['<!-- LP_SEARCH -->',search],['<!-- LP_FOOTER -->',footer]]){
   if(html.split(marker).length!==2)throw Error('Missing/duplicate shared brand marker '+file+' '+marker);
   html=html.replace(marker,partial);
  }
  const title=html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if(!title||!description)throw Error('Missing page metadata '+file);
  html=html.replace('</head>','<meta name="twitter:title" content="'+title+'"><meta name="twitter:description" content="'+description+'"></head>');
  html=html.replace(/(<body\b[^>]*>)/,'$1<a class="lp-skip-link" href="#main-content">Zum Inhalt springen</a>');
  html=html.replace('<main id="main-content"','<main id="main-content" tabindex="-1"');
  const schema=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const canonical=html.match(/<link rel="canonical" href="([^"]+)"/);
  if(!schema||!canonical)throw Error('Missing canonical/schema '+file);
  const job=JSON.parse(schema[1]);
  if(job['@type']==='JobPosting'){
   const teaser=job.description;
   completeJobSchema(html,job,file);
   html=html.replace(schema[0],'<script type="application/ld+json">'+jsonForHtml(job)+'</script>');
   careerSearch.push({type:'Stelle',title:job.title,desc:stripTags(teaser).slice(0,260),url:new URL(canonical[1]).pathname,keywords:'Karriere Bewerbung '+job.title+' '+stripTags(job.description)});
  }
  fs.writeFileSync(file,html);pageCount++;
 }
}
render(path.join(output,'karriere'));
if(pageCount!==22||careerSearch.length!==22)throw Error('Expected overview and 21 job pages');
fs.writeFileSync(path.join(output,'karriere/assets/jobs-search.json'),JSON.stringify(careerSearch,null,2)+'\n');
for(const file of ['robots.txt','sitemap.xml'])fs.copyFileSync(path.join(root,file),path.join(output,file));
if(process.env.VERCEL_ENV==='preview'){
 const {writePreviewFixtures}=await import('./qa-preview.mjs');
 writePreviewFixtures(output);
}
console.log('Built '+pageCount+' career pages with '+Object.keys(assets).length+' verified original L&P brand assets.');

