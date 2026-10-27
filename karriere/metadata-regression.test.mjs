import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,'public');
const all=[];
function walk(dir){for(const x of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,x.name);if(x.isDirectory())walk(p);else if(x.name==='index.html')all.push([p,fs.readFileSync(p,'utf8')]);}}
walk(path.join(publicDir,'karriere'));
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
test('all22 pages declare the proven main-site180px original icon with truthful fallback sizes',()=>{
 assert.equal(all.length,22);
 for(const [p,h]of all){const icons=[...h.matchAll(/<link\s+[^>]*>/g)].map(x=>Object.fromEntries([...x[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]))).filter(x=>x.rel==='icon');assert.equal(icons.find(x=>x.href==='/favicon.ico')?.sizes,'16x16',p);assert.equal(icons.find(x=>x.href==='https://www.lengacher-partner.ch/apple-touch-icon.png')?.sizes,'180x180',p);assert.equal(icons.at(-1)?.href,'https://www.lengacher-partner.ch/apple-touch-icon.png',p);}
});
test('all22 pages expose the complete original platform package and share-preview metadata',()=>{
 const required=['site.webmanifest','browserconfig.xml','android-chrome-192x192.png','android-chrome-512x512.png','mstile-150x150.png','assets/og/og-home-v2.jpg'];
 for(const file of required)assert.ok(fs.existsSync(path.join(publicDir,file)),file);
 const manifest=JSON.parse(fs.readFileSync(path.join(publicDir,'site.webmanifest'),'utf8'));
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(publicDir,icon.src)),icon.src);
 for(const [p,h]of all){for(const value of ['rel="manifest"','name="msapplication-config"','property="og:image"','property="og:image:width"','property="og:image:height"','property="og:locale"','name="twitter:card"','name="twitter:image"','name="twitter:title"','name="twitter:description"'])assert.ok(h.includes(value),p+' '+value);assert.ok(h.includes('https://jobs.lengacher-partner.ch/assets/og/og-home-v2.jpg'),p);}
});
test('every published JobPosting includes the actual visible tasks, focus and work conditions',()=>{
 let jobs=0;
 for(const [p,h]of all){const j=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);if(j['@type']!=='JobPosting')continue;jobs++;
  const copy=h.match(/<div class="lp-jobs-detail-copy">([\s\S]*?)<\/div><aside class="lp-jobs-facts">/)[1];
  const tasks=[...copy.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x=>strip(x[1]));
  assert.ok(tasks.length>=3,p);for(const task of tasks)assert.ok(strip(j.description).includes(task),p+' missing '+task);
  assert.match(j.description,/<p>/,p);assert.match(j.description,/<ul>/,p);
  for(const label of ['Dein fachlicher Fokus','Pensum:','Arbeitsort:','Level:','Beginn:'])assert.ok(j.description.includes(label),p+' '+label);
  assert.equal(j.datePosted,'2026-10-21','do not invent newer posting dates');
  assert.equal(j.hiringOrganization.name,'Lengacher & Partner GmbH');
  assert.equal(j.hiringOrganization.logo,'https://www.lengacher-partner.ch/assets/lengacher-partner-logo.webp');
 }
 assert.equal(jobs,21);
 const account=all.find(([p])=>p.includes('account-executive-b2b-luzern'))[1];
 const schema=JSON.parse(account.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual(schema.employmentType,['FULL_TIME'],'100% role is not advertised part time');
});
test('all22 routes expose a keyboard skip link and keep page-specific preview identity',()=>{
 for(const [p,h]of all){assert.ok(h.includes('class="lp-skip-link" href="#main-content"'),p);assert.match(h,/<main id="main-content" tabindex="-1"/,p);
 const title=h.match(/<title>([\s\S]*?)<\/title>/)[1];assert.ok(h.includes('name="twitter:title" content="'+title+'"'),p);
 const canonical=h.match(/rel="canonical" href="([^"]+)"/)[1];assert.ok(h.includes('property="og:url" content="'+canonical+'"'),p);
 }
});
