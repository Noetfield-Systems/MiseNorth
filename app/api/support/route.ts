import {z} from "zod";
import {requireUser} from "../../../lib/auth";
import {query,uid,audit} from "../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {enforceRateLimit} from "../../../lib/rate-limit";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 try{
  const user=await requireUser();
  const rows=await query<any>(
   "SELECT id,subject,category,severity,status,assigned_department,first_response_at,resolved_at,created_at,updated_at FROM support_tickets WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 100",
   [user.restaurant_id]
  );
  return json({items:rows.rows});
 }catch(e){return fail(e);}
}
export async function POST(req:Request){
 try{
  sameOrigin(req);
  const user=await requireUser();
  await enforceRateLimit(req,"support.create",20,3600,user.restaurant_id);
  const input=z.object({
   subject:z.string().trim().min(4).max(160),
   category:z.enum(["product","billing","security","privacy","data","other"]),
   severity:z.enum(["low","normal","high","critical"]).default("normal"),
   description:z.string().trim().min(10).max(5000)
  }).parse(await body(req));
  const id=uid();
  const department=input.category==="billing"?"finance":input.category==="security"?"security":input.category==="privacy"||input.category==="data"?"privacy":"support";
  await query(
   "INSERT INTO support_tickets(id,restaurant_id,requester_user_id,subject,category,severity,description,assigned_department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
   [id,user.restaurant_id,user.id,input.subject,input.category,input.severity,input.description,department]
  );
  await audit(user.restaurant_id,user.id,"support.ticket_created","support_ticket",id,{category:input.category,severity:input.severity,department});
  return json({ok:true,ticket:{id,status:"open",department}},201);
 }catch(e){return fail(e);}
}
