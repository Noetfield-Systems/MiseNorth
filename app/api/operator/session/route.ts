import {z} from "zod";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";
import {startOperatorSession,requireOperator,endOperatorSession,validateOperatorKey} from "../../../../lib/operator-auth";
export const runtime="nodejs";
export async function POST(req:Request){
 try{
  sameOrigin(req);
  await enforceRateLimit(req,"operator.login",6,900);
  const input=z.object({password:z.string().min(1).max(256)}).parse(await body(req));
  if(!validateOperatorKey(input.password))return json({error:"Invalid access key"},401);
  await startOperatorSession();return json({ok:true});
 }catch(e){return fail(e);}
}
export async function GET(){try{await requireOperator();return json({ok:true});}catch{return json({ok:false},401);}}
export async function DELETE(req:Request){try{sameOrigin(req);await endOperatorSession();return json({ok:true});}catch(e){return fail(e);}}
