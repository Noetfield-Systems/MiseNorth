import {z} from "zod";
import {requireUser} from "../../../../lib/auth";
import {query,uid,audit} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 try{
  const user=await requireUser();
  if(user.role!=="owner")throw new Error("FORBIDDEN");
  const rows=await query<any>(
   "SELECT id,request_type,subject,details,status,outcome_summary,created_at,updated_at,completed_at FROM privacy_requests WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 50",
   [user.restaurant_id]
  );
  return json({items:rows.rows});
 }catch(e){return fail(e);}
}
export async function POST(req:Request){
 try{
  sameOrigin(req);
  const user=await requireUser();
  if(user.role!=="owner")throw new Error("FORBIDDEN");
  await enforceRateLimit(req,"privacy.request",8,3600,user.restaurant_id);
  const input=z.object({
   requestType:z.enum(["data_export","erasure","correction","access"]),
   subject:z.string().trim().min(3).max(160),
   details:z.string().trim().min(10).max(3000)
  }).parse(await body(req));
  const id=uid();
  await query(
   "INSERT INTO privacy_requests(id,restaurant_id,requester_user_id,request_type,subject,details) VALUES($1,$2,$3,$4,$5,$6)",
   [id,user.restaurant_id,user.id,input.requestType,input.subject,input.details]
  );
  await audit(user.restaurant_id,user.id,"privacy.request_created","privacy_request",id,{request_type:input.requestType});
  return json({ok:true,request:{id,status:"received",requestType:input.requestType}},201);
 }catch(e){return fail(e);}
}
