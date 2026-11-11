import {z} from "zod";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {enforceRateLimit} from "../../../lib/rate-limit";
import {readAudit,saveInquiry} from "../../../lib/grader-store";
export const runtime="nodejs";
const schema=z.object({
 auditId:z.string().uuid().nullable().optional(),
 name:z.string().trim().min(2).max(120),
 email:z.email().max(254),
 restaurantName:z.string().trim().max(180).default(""),
 message:z.string().trim().max(2000).default(""),
 intent:z.enum(["restaurant","partner","investor"]).default("restaurant"),
 website:z.string().optional() // honeypot field, must remain empty
});
export async function POST(req:Request){
 try{
  sameOrigin(req);
  const data=schema.parse(await body(req));
  await enforceRateLimit(req,"growth-inquiry",4,3600,data.email);
  if(data.website)return json({ok:true});
  if(data.auditId&&!(await readAudit(data.auditId)))return json({error:"Audit no longer available"},404);
  const id=await saveInquiry({auditId:data.auditId,name:data.name,email:data.email,restaurantName:data.restaurantName,message:data.message,intent:data.intent});
  return json({ok:true,id,message:"Your request was received. We will contact you using the email provided."},201);
 }catch(error){return fail(error);}
}
