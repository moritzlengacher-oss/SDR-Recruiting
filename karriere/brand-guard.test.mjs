import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const output=path.join(root,'public');
const pageFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))pageFiles.push(p);}}
walk(path.join(output,'karriere'));
const manifest=JSON.parse(read('brand/source-manifest.json'));
test('original L&P logo, all six fonts and stylesheet have verified byte hashes',()=>{
 assert.equal(manifest.fonts.join('|'),'Cormorant Garamond|DM Mono');
 assert.equal(Object.keys(manifest.assets).filter(x=>x.endsWith('.woff2')).length,6);
 for(const [relative,asset]of Object.entries(manifest.assets)){const bytes=fs.readFileSync(path.join(output,relative));assert.equal(bytes.length,asset.bytes,relative);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,relative);}
 assert.equal(manifest.assets['assets/lengacher-partner-logo.webp'].sha256,'191dfdb82d0bf035de020f1e50b878a8c96c3634a57b304ffbe65a162efe92ed');
});
test('all 22 pages use the same complete original header and footer',()=>{
 assert.equal(pageFiles.length,22);
 const header=read('brand/header.html'),footer=read('brand/footer.html');
 for(const file of pageFiles){const html=fs.readFileSync(file,'utf8');assert.ok(html.includes(header),file);assert.ok(html.includes(footer),file);assert.ok(html.includes('src="/assets/lengacher-partner-logo.webp"'),file);assert.ok(!html.includes('class="mark"'),file);assert.ok(html.includes('assets/lp-brand/styles.css?v=20261027'),file);assert.ok(html.includes('brand-shell.js?v=20261027'),file);assert.ok(!/<!-- LP_(HEADER|FOOTER|SEARCH) -->/.test(html),file);}
 for(const expected of ['Leistungen','Branchen','Pilotlösungen','Wissen','Über uns','nav-toggle','nav-search-btn'])assert.ok(header.includes(expected),expected);
 for(const expected of ['footer-social-linkedin','footer-social-instagram','footer-social-x','CHE-113.192.820','CH-100-4786870-6','Ritterstrasse 16','/impressum','/datenschutz','/agb'])assert.ok(footer.includes(expected),expected);
});
test('career presentation uses original typography and palette without the green replacement identity',()=>{
 const css=read('karriere/assets/styles.css');
 assert.ok(css.includes("'Cormorant Garamond'"));assert.ok(css.includes("'DM Mono'"));
 assert.ok(!/\bInter\b|#194a3e|#326456|#182923|#cf9e58/i.test(css));
 const original=read('public/assets/lp-brand/styles.css');
 for(const color of ['#0d0d0d','#f5f2ec','#b8975a','#1a2744'])assert.ok(original.includes(color),color);
 assert.ok(css.includes('var(--site-nav-height'));
});
test('all local assets and career links resolve in the built output',()=>{
 for(const file of pageFiles){const html=fs.readFileSync(file,'utf8');for(const [,attribute,value]of html.matchAll(/\b(src|href)="(\/[^"]*)"/g)){const clean=value.split(/[?#]/)[0];if(!clean)continue;const target=path.join(output,clean);if(attribute==='src'||/\.(css|js|ico|png|svg|woff2)$/.test(clean))assert.ok(fs.existsSync(target),file+' '+clean);else if(clean.startsWith('/karriere'))assert.ok(fs.existsSync(path.join(target,'index.html'))||fs.existsSync(target+'.html'),file+' '+clean);}}
});
test('legacy discovery and Quick Apply functions exist for every role',()=>{
 const hub=read('public/karriere/index.html');
 assert.equal((hub.match(/class="job-card"/g)||[]).length,21);
 assert.equal((hub.match(/data-quick-role=/g)||[]).length,21);
 assert.equal((hub.match(/<article class="job-card"[^>]*data-location=/g)||[]).length,21);
 assert.equal((hub.match(/<article class="job-card"[^>]*data-level=/g)||[]).length,21);
 for(const id of ['job-search','job-location','job-level','job-reset','stellen','vorteile','arbeitsalltag','ablauf','faq','quick-apply','bewerben'])assert.ok(hub.includes('id="'+id+'"'),id);
 for(const file of pageFiles){const html=fs.readFileSync(file,'utf8');assert.ok(html.includes('id="quick-apply"'));assert.ok(html.includes('name="privacy_consent" required'));assert.ok(!/name="privacy_consent"[^>]*checked/.test(html));assert.ok(html.includes('action="/api/career-application"'));}
});
test('shared shell and application JavaScript parse; no unsafe search HTML insertion',()=>{
 const shell=read('karriere/assets/brand-shell.js'),app=read('karriere/assets/app.js');
 assert.doesNotThrow(()=>new Function(shell));assert.doesNotThrow(()=>new Function(app));
 assert.ok(shell.includes("title.textContent=item.title"));
 assert.ok(shell.includes("e.key==='Escape'"));assert.ok(shell.includes("e.key==='Tab'"));
 assert.ok(app.includes('locationFilter'));assert.ok(app.includes('levelFilter'));assert.ok(app.includes('data-quick-role'));
});
