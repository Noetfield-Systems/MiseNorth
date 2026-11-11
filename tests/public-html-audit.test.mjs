import test from "node:test";
import assert from "node:assert/strict";
import {isPublicAddress,buildHtmlReport} from "../lib/public-html-audit.mjs";

test("denies localhost, RFC1918, link local, internal IPv6 and documentation addresses",()=>{
 for(const ip of ["127.0.0.1","10.1.2.3","192.168.0.1","172.16.0.1","169.254.169.254","100.100.100.100","192.0.2.1","203.0.113.9","::1","fc00::1","fe80::1","2001:db8::1"]){
  assert.equal(isPublicAddress(ip),false,ip);
 }
 assert.equal(isPublicAddress("8.8.8.8"),true);
 assert.equal(isPublicAddress("2606:4700:4700::1111"),true);
});
test("HTML fallback provides evidence-based partial score and leaves untested categories N/A",()=>{
 const html='<html lang="en"><head><title>Our Restaurant</title><meta name="description" content="Food"><meta name="viewport" content="width=device-width"></head><body><h1>Our menu</h1></body></html>';
 const r=buildHtmlReport("https://example.com/","https://example.com/",html);
 assert.equal(r.categories[0].score,null);
 assert.equal(r.categories[2].score,null);
 assert.equal(r.coverage,"2/4");
 assert.equal(r.categories[1].score,60);
 assert.ok(r.findings.some(x=>x.id==="canonical"));
 assert.match(r.advisory,/not a Google Lighthouse/);
});
test("noindex and insecure transport surface as specific findings",()=>{
 const html='<html><head><title>Test</title><meta name="robots" content="noindex"></head><body></body></html>';
 const r=buildHtmlReport("http://example.com/","http://example.com/",html);
 assert.ok(r.findings.some(x=>x.id==="secure-transport"));
 assert.ok(r.findings.some(x=>x.id==="indexable"));
});
