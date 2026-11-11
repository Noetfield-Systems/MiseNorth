import bcrypt from "bcryptjs";
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
  await enforceRateLimit(req,"auth.reset_password",10,3600);
  const input=z.object({token:z.string().min(32).max(128),password:z.string().min(12).max(100)}).parse(await body(req));
  const tokenHash=createHash("sha256").update(input.token).digest("hex");
  const passwordHash=await bcrypt.hash(input.password,12);
  client=await pool().connect();
  await client.query("BEGIN");
  const found=await client.query<any>(
   "SELECT t.user_id,u.restaurant_id FROM password_reset_tokens t JOIN users u ON u.id=t.user_id JOIN restaurants r ON r.id=u.restaurant_id WHERE t.token_hash=$1 AND t.consumed_at IS NULL AND t.revoked_at IS NULL AND t.expires_at>now() AND u.active=true AND u.email_verified=true AND r.is_demo=false FOR UPDATE OF t,u",
   [tokenHash]
  );
  if(!found.rows[0])throw new Error("NOT_FOUND");
  const {user_id:userId,restaurant_id:restaurantId}=found.rows[0];
  await client.query("UPDATE users SET password_hash=$1 WHERE id=$2 AND restaurant_id=$3",[passwordHash,userId,restaurantId]);
  await client.query("UPDATE password_reset_tokens SET consumed_at=now() WHERE token_hash=$1",[tokenHash]);
  await client.query("UPDATE password_reset_tokens SET revoked_at=now() WHERE user_id=$1 AND consumed_at IS NULL AND revoked_at IS NULL",[userId]);
  await client.query("DELETE FROM sessions WHERE user_id=$1",[userId]);
  await client.query(
   "INSERT INTO audit_events(id,restaurant_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,'user.password_reset','user',$3,$4::jsonb)",
   [uid(),restaurantId,userId,JSON.stringify({method:"single_use_email_token",sessions_revoked:true})]
  );
  await client.query("COMMIT");
  return json({ok:true,passwordUpdated:true,signInRequired:true});
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
