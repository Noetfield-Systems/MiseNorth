import {z} from "zod";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {enforceRateLimit} from "../../../lib/rate-limit";
import {normalizeWebsiteUrl,buildWebsiteReport} from "../../../lib/grader-core.mjs";
import {saveAudit} from "../../../lib/grader-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({website:z.string().min(4).max(600)});
export async function POST(req:Request){
 try{
  sameOrigin(req);
  const {website}=schema.parse(await body(req));
  const normalized=normalizeWebsiteUrl(website);
  await enforceRateLimit(req,"growth-grader",6,3600);
  const params=new URLSearchParams({url:normalized,strategy:"mobile"});
  for(const c of ["performance","seo","accessibility","best-practices"])params.append("category",c);
  if(process.env.GOOGLE_PAGESPEED_API_KEY)params.set("key",process.env.GOOGLE_PAGESPEED_API_KEY);
  let raw:unknown;
  try{
   const upstream=await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?"+params.toString(),{cache:"no-store",signal:AbortSignal.timeout(25000)});
   if(!upstream.ok){console.warn("[Grader] PageSpeed unavailable",upstream.status);return json({error:"Website audit is temporarily unavailable. Please try again shortly.",code:"AUDIT_PROVIDER_UNAVAILABLE"},503);}
   raw=await upstream.json();
  }catch{ return json({error:"Website audit timed out. Please try again.",code:"AUDIT_PROVIDER_TIMEOUT"},503); }
  const report=buildWebsiteReport(normalized,raw);
  const id=await saveAudit(report);
  return json({ok:true,id,report});
 }catch(error){
  if(error instanceof Error&&error.message==="AUDIT_UNAVAILABLE")return json({error:"The audit provider did not return measurable scores for this website.",code:"AUDIT_INCOMPLETE"},422);
  return fail(error);
 }
}
