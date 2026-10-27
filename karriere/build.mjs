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
const header=read('brand/header.html'),footer=read('brand/footer.html'),search=read('brand/search.html');
let pageCount=0;
function render(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())render(file);else if(item.name.endsWith('.html')){let html=fs.readFileSync(file,'utf8');for(const [marker,partial]of [['<!-- LP_HEADER -->',header],['<!-- LP_SEARCH -->',search],['<!-- LP_FOOTER -->',footer]]){if(html.split(marker).length!==2)throw Error('Missing/duplicate shared brand marker '+file+' '+marker);html=html.replace(marker,partial);}fs.writeFileSync(file,html);pageCount++;}}}
render(path.join(output,'karriere'));
if(pageCount!==22)throw Error('Expected overview and 21 job pages');
for(const file of ['robots.txt','sitemap.xml'])fs.copyFileSync(path.join(root,file),path.join(output,file));
console.log('Built '+pageCount+' career pages with '+Object.keys(assets).length+' verified original L&P brand assets.');
