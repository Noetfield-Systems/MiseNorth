import {requireUser,destroySession} from "../../../../../lib/auth";
import {query,audit,uid} from "../../../../../lib/db";
import {fail,json,sameOrigin} from "../../../../../lib/api";
import {enforceRateLimit} from "../../../../../lib/rate-limit";

export const runtime="nodejs";

export async function POST(req:Request){
 try{
  sameOrigin(req);
  const user=await requireUser();
  await enforceRateLimit(req,"auth.revoke_sessions",5,3600,user.id);
  const result=await query("DELETE FROM sessions WHERE user_id=$1",[user.id]);
  await audit(user.restaurant_id,user.id,"user.sessions_revoked","user",user.id,{reason:"self_service",revoked_sessions:result.rowCount||0});
  await destroySession();
  return json({ok:true,signedOut:true});
 }catch(e){return fail(e);}
}
