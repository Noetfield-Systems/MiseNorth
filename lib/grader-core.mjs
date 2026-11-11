import {isIP} from "node:net";

/** Public-website URLs only; no local networks, userinfo, raw IPs or custom ports. */
export function normalizeWebsiteUrl(input){
  if(typeof input!=="string"||input.trim().length<4||input.length>600)throw new Error("VALIDATION:Enter a valid public restaurant website");
  const raw=input.trim();
  let parsed;
  try{parsed=new URL(/^https?:\/\//i.test(raw)?raw:"https://"+raw);}
  catch{throw new Error("VALIDATION:Enter a valid website address");}
  if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password||parsed.port)throw new Error("VALIDATION:Use a standard public HTTP or HTTPS website");
  const host=parsed.hostname.toLowerCase();
  if(host.length>253||!host.includes(".")||isIP(host)||host.endsWith(".local")||host.endsWith(".internal")||host.endsWith(".localhost")||host==="localhost"||!host.split(".").every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part)))throw new Error("VALIDATION:Use a public website domain");
  parsed.hash="";parsed.username="";parsed.password="";
  return parsed.toString();
}
const FIELDS=[
 {key:"performance",label:"Mobile performance",weight:35},
 {key:"seo",label:"Search visibility foundations",weight:35},
 {key:"accessibility",label:"Accessibility",weight:15},
 {key:"best-practices",label:"Website best practices",weight:15}
];
const IMPORTANT=["document-title","meta-description","is-crawlable","viewport","robots-txt","link-text","image-alt","uses-text-compression","render-blocking-resources","uses-responsive-images","modern-image-formats","server-response-time","largest-contentful-paint","total-blocking-time","cumulative-layout-shift","tap-targets"];
export function buildWebsiteReport(url,raw){
 const lh=raw?.lighthouseResult;
 if(!lh||!lh.categories)throw new Error("AUDIT_UNAVAILABLE");
 const categories=FIELDS.map(f=>{
   const number=lh.categories[f.key]?.score;
   return {...f,score:typeof number==="number"&&Number.isFinite(number)&&number>=0&&number<=1?Math.round(number*100):null};
 });
 const present=categories.filter(c=>c.score!==null);
 if(!present.length)throw new Error("AUDIT_UNAVAILABLE");
 const total=Math.round(present.reduce((v,c)=>v+c.score*c.weight,0)/present.reduce((v,c)=>v+c.weight,0));
 const findings=IMPORTANT.map(id=>{
   const a=lh.audits?.[id];
   if(!a||typeof a.score!=="number"||a.score>=0.9||a.scoreDisplayMode==="notApplicable")return null;
   return {id,title:String(a.title||id).slice(0,150),description:String(a.description||"").replace(/\[[^\]]*\]\([^)]*\)/g,"").replace(/<[^>]*>/g,"").slice(0,280),status:a.score<0.5?"needs-attention":"improvable",measuredScore:Math.round(a.score*100)};
 }).filter(Boolean).sort((a,b)=>a.measuredScore-b.measuredScore).slice(0,6);
 return {
  auditedUrl:url,finalUrl:String(lh.finalDisplayedUrl||lh.finalUrl||url).slice(0,600),
  hostname:new URL(url).hostname,source:"Google PageSpeed Insights / Lighthouse",
  sourceVersion:String(lh.lighthouseVersion||"").slice(0,35),
  auditedAt:new Date().toISOString(),strategy:"mobile",
  score:total,grade:total>=90?"A":total>=80?"B":total>=70?"C":total>=60?"D":"F",
  categories,findings,
  coverage:present.length+"/"+FIELDS.length,
  advisory:"Technical website audit only. It does not measure real sales, Google search rankings, conversion rate or actual customer retention."
 };
}
