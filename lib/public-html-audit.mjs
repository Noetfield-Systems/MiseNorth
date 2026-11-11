import {lookup as dnsLookup} from "node:dns/promises";
import {isIP} from "node:net";
import http from "node:http";
import https from "node:https";
import {normalizeWebsiteUrl} from "./grader-core.mjs";

// A 512 KiB cap rejected legitimate modern restaurant sites with large server-rendered pages.
// Keep a strict 2 MiB cap for bounded public HTML inspection, with SSRF and redirect controls unchanged.
export const MAX_HTML_AUDIT_BYTES=2*1024*1024;

export function isPublicAddress(address){
 const family=isIP(address);
 if(family===4){
  const [a,b,c]=address.split(".").map(Number);
  if(a===0||a===10||a===127||a>=224)return false;
  if(a===100&&b>=64&&b<=127)return false;
  if(a===169&&b===254)return false;
  if(a===172&&b>=16&&b<=31)return false;
  if(a===192&&b===168)return false;
  if(a===192&&b===0)return false;
  if(a===192&&b===88&&c===99)return false;
  if(a===198&&b>=18&&b<=19)return false;
  if(a===192&&b===0&&c===2)return false;
  if(a===198&&b===51&&c===100)return false;
  if(a===203&&b===0&&c===113)return false;
  return true;
 }
 if(family===6){
  const first=Number.parseInt(address.split(":")[0],16);
  return first>=0x2000&&first<=0x3fff&&!address.toLowerCase().startsWith("2001:db8");
 }
 return false;
}
async function singleFetch(normalized){
 const target=new URL(normalized);
 const resolved=await dnsLookup(target.hostname,{all:true,verbatim:true});
 if(!resolved.length||resolved.some(row=>!isPublicAddress(row.address)))throw new Error("PRIVATE_NETWORK_TARGET");
 const chosen=resolved.find(row=>row.family===4)||resolved[0];
 const adapter=target.protocol==="https:"?https:http;
 return await new Promise((resolve,reject)=>{
  let settled=false;
  const fail=e=>{if(settled)return;settled=true;reject(e);};
  const req=adapter.request(target,{
   method:"GET",timeout:9000,
   headers:{"user-agent":"MiseNorthWebsiteAudit/1.0 (+https://misenorth-growth-production.up.railway.app/grader)","accept":"text/html,application/xhtml+xml;q=0.8","accept-encoding":"identity"},
   autoSelectFamily:false,
   family:chosen.family,
   lookup:(_hostname,options,callback)=>{
    if(options?.all)callback(null,[{address:chosen.address,family:chosen.family}]);
    else callback(null,chosen.address,chosen.family);
   }
  },response=>{
   const status=response.statusCode||0;
   if([301,302,303,307,308].includes(status)){
    const location=response.headers.location;
    response.resume();
    if(!location)return fail(new Error("MISSING_REDIRECT_LOCATION"));
    settled=true;return resolve({redirect:new URL(location,normalized).toString()});
   }
   if(status!==200){response.resume();return fail(new Error("HTTP_"+status));}
   const contentType=String(response.headers["content-type"]||"");
   if(contentType&&!/html/i.test(contentType)){response.resume();return fail(new Error("NON_HTML_CONTENT"));}
   const chunks=[];let size=0;
   response.on("data",chunk=>{
    size+=chunk.length;
    if(size>MAX_HTML_AUDIT_BYTES){response.destroy(new Error("HTML_TOO_LARGE"));return;}
    chunks.push(chunk);
   });
   response.on("error",fail);
   response.on("end",()=>{if(!settled){settled=true;resolve({html:Buffer.concat(chunks).toString("utf8"),finalUrl:normalized});}});
  });
  req.on("timeout",()=>req.destroy(new Error("HTML_AUDIT_TIMEOUT")));
  req.on("error",fail);
  req.end();
 });
}
export async function fetchPublicHtml(input){
 let url=normalizeWebsiteUrl(input);
 for(let redirect=0;redirect<=3;redirect++){
  const result=await singleFetch(url);
  if(result.html!==undefined)return result;
  if(!result.redirect||redirect===3)throw new Error("TOO_MANY_REDIRECTS");
  url=normalizeWebsiteUrl(result.redirect);
 }
 throw new Error("HTML_AUDIT_FAILED");
}
function hasMeta(html,key,attr="name"){
 const metaTags=html.match(/<meta\b[^>]*>/gi)||[];
 return metaTags.some(tag=>new RegExp("\\b"+attr+"\\s*=\\s*['\"]?"+key+"(?:['\"\\s>])","i").test(tag));
}
function metaRobotsNoindex(html){
 const metaTags=html.match(/<meta\b[^>]*>/gi)||[];
 return metaTags.some(tag=>/name\s*=\s*["']?robots\b/i.test(tag)&&/noindex/i.test(tag));
}
export function buildHtmlReport(inputUrl,finalUrl,html){
 if(typeof html!=="string"||!html.trim())throw new Error("HTML_AUDIT_UNAVAILABLE");
 const checks=[
  {id:"document-title",group:"seo",pass:/<title\b[^>]*>\s*[^<\s][^<]*<\/title>/i.test(html),title:"Add a descriptive page title",description:"The initial HTML did not contain a non-empty title tag. A clear title helps guests and search engines understand the page."},
  {id:"meta-description",group:"seo",pass:hasMeta(html,"description"),title:"Add a meta description",description:"The initial HTML did not contain a meta description. Write a concise, accurate description of your restaurant."},
  {id:"h1",group:"seo",pass:/<h1\b[^>]*>/i.test(html),title:"Give the page a primary heading",description:"No H1 tag was found in the initial HTML. A readable heading helps establish what this page is about."},
  {id:"canonical",group:"seo",pass:/<link\b(?=[^>]*\brel\s*=\s*["']?canonical\b)[^>]*>/i.test(html),title:"Review canonical URL markup",description:"A canonical link was not detected. Consider a canonical URL when the same content may appear at multiple URLs."},
  {id:"structured-data",group:"seo",pass:/<script\b[^>]*type\s*=\s*["']application\/ld\+json["']/i.test(html),title:"Consider structured business data",description:"No JSON-LD structured data was detected. Relevant LocalBusiness or Restaurant markup may help describe public business information."},
  {id:"viewport",group:"best-practices",pass:hasMeta(html,"viewport"),title:"Add a mobile viewport declaration",description:"A viewport meta tag was not detected. Verify that the page renders correctly on mobile devices."},
  {id:"secure-transport",group:"best-practices",pass:finalUrl.startsWith("https://"),title:"Serve the site using HTTPS",description:"The inspected page was not delivered over HTTPS. Use HTTPS for integrity and guest trust."},
  {id:"indexable",group:"best-practices",pass:!metaRobotsNoindex(html),title:"Check noindex instructions",description:"The page declares robots noindex. If this is your public restaurant homepage, check whether you intended to exclude it from indexing."}
 ];
 const percent=group=>{
  const items=checks.filter(c=>c.group===group);
  return Math.round(items.filter(c=>c.pass).length/items.length*100);
 };
 const seo=percent("seo"),practices=percent("best-practices");
 const score=Math.round((seo*35+practices*15)/50);
 return {
  auditedUrl:inputUrl,finalUrl,hostname:new URL(inputUrl).hostname,source:"MiseNorth direct public-HTML diagnostics",
  sourceVersion:"1",auditedAt:new Date().toISOString(),strategy:"initial HTML (no JavaScript)",
  score,grade:score>=90?"A":score>=80?"B":score>=70?"C":score>=60?"D":"F",
  categories:[
   {key:"performance",label:"Mobile performance",weight:35,score:null},
   {key:"seo",label:"On-page SEO markup",weight:35,score:seo},
   {key:"accessibility",label:"Accessibility",weight:15,score:null},
   {key:"best-practices",label:"HTML technical foundations",weight:15,score:practices}
  ],
  findings:checks.filter(c=>!c.pass).sort((x,y)=>(["secure-transport","indexable","document-title","meta-description","viewport"].indexOf(x.id)<0?99:["secure-transport","indexable","document-title","meta-description","viewport"].indexOf(x.id))- (["secure-transport","indexable","document-title","meta-description","viewport"].indexOf(y.id)<0?99:["secure-transport","indexable","document-title","meta-description","viewport"].indexOf(y.id))).slice(0,6).map(c=>({id:c.id,title:c.title,description:c.description,status:"needs-attention",measuredScore:0})),
  coverage:"2/4",
  advisory:"Partial HTML markup checks, not a Google Lighthouse performance audit or verified search ranking. Performance and accessibility are not measured in this fallback. A missing tag may be injected by JavaScript and should be checked manually. No revenue, conversion rate or repeat visits are inferred."
 };
}
