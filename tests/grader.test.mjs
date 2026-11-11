import test from "node:test";
import assert from "node:assert/strict";
import {normalizeWebsiteUrl,buildWebsiteReport} from "../lib/grader-core.mjs";

test("normalizes a restaurant website",()=>{
 assert.equal(normalizeWebsiteUrl("Example.com/menu#order"),"https://example.com/menu");
});
test("blocks private targets and unsafe protocols",()=>{
 for(const x of ["localhost","127.0.0.1","10.0.0.1","http://[::1]","file:///etc/passwd","https://user:pass@example.com","http://example.com:8080","https://shop.local"]){
  assert.throws(()=>normalizeWebsiteUrl(x),/VALIDATION:/,x);
 }
});
test("keeps missing audit categories unknown and renormalizes actual score",()=>{
 const result=buildWebsiteReport("https://example.com/",{lighthouseResult:{categories:{performance:{score:.8},seo:{score:.6}},audits:{"meta-description":{title:"Missing meta description",description:"Add a description",score:0}}}});
 assert.equal(result.score,70);
 assert.equal(result.categories[2].score,null);
 assert.equal(result.coverage,"2/4");
 assert.equal(result.findings[0].id,"meta-description");
});
test("does not invent a grade without upstream measurements",()=>{
 assert.throws(()=>buildWebsiteReport("https://example.com/",{lighthouseResult:{categories:{}}}),/AUDIT_UNAVAILABLE/);
});
