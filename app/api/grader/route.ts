import {z} from "zod";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {enforceRateLimit} from "../../../lib/rate-limit";
import {normalizeWebsiteUrl,buildWebsiteReport} from "../../../lib/grader-core.mjs";
import {fetchPublicHtml,buildHtmlReport} from "../../../lib/public-html-audit.mjs";
import {saveAudit} from "../../../lib/grader-store";
import type {WebsiteReport} from "../../../lib/grader-core.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({website:z.string().min(4).max(600)});

export async function POST(req:Request){
 try{
  sameOrigin(req);
  const {website}=schema.parse(await body(req));
  const normalized=normalizeWebsiteUrl(website);
  await enforceRateLimit(req,"growth-grader",6,3600);
  let report:WebsiteReport|undefined;
  const params=new URLSearchParams({url:normalized,strategy:"mobile"});
  for(const c of ["performance","seo","accessibility","best-practices"])params.append("category",c);
  const key=process.env.GOOGLE_PAGESPEED_API_KEY;
  if(key)params.set("key",key);
  try{
   const upstream=await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?"+params.toString(),{cache:"no-store",signal:AbortSignal.timeout(key?25000:10000)});
   if(upstream.ok)report=buildWebsiteReport(normalized,await upstream.json());
   else console.warn("[Grader] PageSpeed unavailable; using HTML checks",upstream.status);
  }catch(error){console.warn("[Grader] PageSpeed unavailable; using HTML checks",error instanceof Error?error.message:"provider error");}
  if(!report){
   try{
    const page=await fetchPublicHtml(normalized);
    report=buildHtmlReport(normalized,page.finalUrl,page.html);
   }catch(error){
    console.warn("[Grader] HTML fallback failed",error instanceof Error?error.message:"request failed");
    return json({error:"The public website could not be inspected. Verify the address and try again.",code:"PUBLIC_SITE_UNAVAILABLE"},503);
   }
  }
  const id=await saveAudit(report);
  return json({ok:true,id,report});
 }catch(error){return fail(error);}
}
