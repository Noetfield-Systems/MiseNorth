import {createHash} from "node:crypto";
import {z} from "zod";
import type {PoolClient} from "pg";
import {pool,uid} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";

export const runtime="nodejs";

export async function POST(req:Request){
 let client:PoolClient|undefined;
 try{
  sameOrigin(req);
  await enforceRateLimit(req,"auth.verify_email",15,3600);
  const parsed=z.object({token:z.string().min(32).max(128)}).parse(await body(req));
  const tokenHash=createHash("sha256").update(parsed.token).digest("hex");
  client=await pool().connect();
  await client.query("BEGIN");
  const found=await client.query<any>(
   "SELECT t.user_id,u.restaurant_id FROM email_verification_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=$1 AND t.consumed_at IS NULL AND t.revoked_at IS NULL AND t.expires_at>now() AND u.active=true FOR UPDATE OF t",
   [tokenHash]
  );
  if(!found.rows[0])throw new Error("NOT_FOUND");
  const {user_id:userId,restaurant_id:restaurantId}=found.rows[0];
  await client.query("UPDATE users SET email_verified=true WHERE id=$1 AND restaurant_id=$2",[userId,restaurantId]);
  await client.query("UPDATE email_verification_tokens SET consumed_at=now() WHERE token_hash=$1",[tokenHash]);
  await client.query("UPDATE email_verification_tokens SET revoked_at=now() WHERE user_id=$1 AND consumed_at IS NULL AND revoked_at IS NULL",[userId]);
  await client.query(
   "INSERT INTO audit_events(id,restaurant_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,'user.email_verified','user',$3,$4::jsonb)",
   [uid(),restaurantId,userId,JSON.stringify({method:"single_use_email_token"})]
  );
  await client.query("COMMIT");
  return json({ok:true,emailVerified:true});
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
