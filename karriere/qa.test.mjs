import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const root = path.dirname(fileURLToPath(import.meta.url));
const careerDir = path.join(root, "karriere");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const jobFolders = fs.readdirSync(careerDir, {withFileTypes:true})
  .filter(d=>d.isDirectory()&&d.name!=="assets"&&fs.existsSync(path.join(careerDir,d.name,"index.html")))
  .map(x=>x.name).sort();
const listing = read("karriere/index.html");

test("exactly 21 unique career detail pages", () => {
  assert.equal(jobFolders.length,21);
  assert.equal(new Set(jobFolders).size,21);
});
test("overview has 21 links/cards and same-origin form", () => {
  assert.equal((listing.match(/class="job-card"/g)||[]).length,21);
  for (const s of jobFolders) assert.ok(listing.includes('href="/karriere/'+s+'"'),s);
  assert.ok(listing.includes('action="/api/career-application"'));
});
test("all 21 job details have correct canonical, JSON-LD and consent", () => {
  for (const slug of jobFolders) {
    const html=read("karriere/"+slug+"/index.html");
    assert.ok(html.includes('rel="canonical" href="https://jobs.lengacher-partner.ch/karriere/'+slug+'"'),slug);
    assert.ok(html.includes('"@type":"JobPosting"'),slug);
    assert.ok(html.includes('action="/api/career-application"'),slug);
    assert.ok(html.includes('name="privacy_consent"'),slug);
    assert.ok(!/name="privacy_consent"[^>]*checked/.test(html),slug);
    assert.ok(!html.toLowerCase().includes("voxflow.ch"),slug);
  }
});
test("sitemap 22 entries, robots and security headers", () => {
  assert.equal((read("sitemap.xml").match(/<loc>/g)||[]).length,22);
  assert.ok(read("robots.txt").includes("Sitemap: https://jobs.lengacher-partner.ch/sitemap.xml"));
  const cfg=JSON.parse(read("vercel.json"));
  assert.ok(cfg.headers.some(x=>x.headers.some(h=>h.key==="Content-Security-Policy")));
  assert.ok(cfg.functions["api/career-application.js"]);
});
test("existing SDR landing is not overwritten", () => {
  assert.ok(read("../index.html").includes("SDR Karriere"));
});
test("form uses a stable idempotency key across retries", () => {
  assert.ok(read("karriere/assets/app.js").includes("submissionInput?.value||uid()"));
});
const require=createRequire(import.meta.url);
const handler=require("./api/career-application.js");
const valid={name:"ASU QA CONTRACT TEST",email:"qa@example.invalid",career_role:"Sales Development Representative (SDR)",privacy_consent:true,linkedin:"https://linkedin.com/in/qa-test"};
async function invoke(o={}){
  const old=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;let status=o.upstreamStatus||200;return {status,ok:status<400,text:async()=>JSON.stringify(o.upstreamBody||{ok:true,reference:"KARR-00000001"})};};
  const req={method:o.method||"POST",headers:{host:o.host||"jobs.lengacher-partner.ch",origin:o.origin===undefined?"https://jobs.lengacher-partner.ch":o.origin,"content-type":"application/json"},body:{...valid,...o.body}};
  const res={statusCode:200,setHeader(){},end(x){this.payload=JSON.parse(x)}};
  try{await handler(req,res);return {status:res.statusCode,payload:res.payload,calls};}finally{global.fetch=old;}
}
test("GET prohibited; foreign origin denied",async()=>{
  assert.equal((await invoke({method:"GET"})).status,405);
  assert.equal((await invoke({origin:"https://evil.example"})).status,403);
  assert.equal((await invoke({host:"evil.example",origin:"https://evil.example"})).status,403);
});
test("validates required fields before upstream network call",async()=>{
  for(const body of [{name:""},{email:"bad"},{privacy_consent:false},{linkedin:""}]){
    const r=await invoke({body});
    assert.equal(r.status,400);
    assert.equal(r.calls,0);
  }
});
test("upstream success required before candidate success",async()=>{
  const success=await invoke();assert.equal(success.status,200);assert.equal(success.calls,1);assert.equal(success.payload.ok,true);
  const error=await invoke({upstreamStatus:503,upstreamBody:{ok:false}});assert.equal(error.status,502);assert.equal(error.payload.ok,false);
});
test("invalid PDF rejected",async()=>{
  const fakePdf={name:"cv.pdf",type:"application/pdf",size:5,data:Buffer.from("HELLO").toString("base64")};
  const x=await invoke({body:{resumePdf:fakePdf}});assert.equal(x.status,400);assert.equal(x.calls,0);
});
