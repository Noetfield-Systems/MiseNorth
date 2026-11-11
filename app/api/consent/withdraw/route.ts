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
  await enforceRateLimit(req,"guest.consent.withdraw",20,3600);
  const parsed=z.object({token:z.string().min(32).max(128)}).parse(await body(req));
  const tokenHash=createHash("sha256").update(parsed.token).digest("hex");
  client=await pool().connect();
  await client.query("BEGIN");
  const found=await client.query<any>(
   "SELECT t.customer_id,t.restaurant_id,r.is_demo FROM customer_unsubscribe_tokens t JOIN customers c ON c.id=t.customer_id AND c.restaurant_id=t.restaurant_id JOIN restaurants r ON r.id=t.restaurant_id WHERE t.token_hash=$1 AND t.consumed_at IS NULL AND t.revoked_at IS NULL AND (t.expires_at IS NULL OR t.expires_at>now()) FOR UPDATE OF t",
   [tokenHash]
  );
  if(!found.rows[0])throw new Error("NOT_FOUND");
  const {customer_id:customerId,restaurant_id:restaurantId}=found.rows[0];
  await client.query("UPDATE customers SET marketing_consent=false WHERE id=$1 AND restaurant_id=$2",[customerId,restaurantId]);
  await client.query(
   "INSERT INTO customer_consent_events(id,restaurant_id,customer_id,channel,purpose,decision,source,evidence) VALUES($1,$2,$3,'email','marketing','withdrawn','guest_unsubscribe_link',$4::jsonb)",
   [uid(),restaurantId,customerId,JSON.stringify({mechanism:"single_use_bearer_token",verified:true,synthetic_workspace:Boolean(found.rows[0].is_demo)})]
  );
  await client.query("UPDATE customer_unsubscribe_tokens SET consumed_at=now() WHERE token_hash=$1",[tokenHash]);
  await client.query("UPDATE customer_unsubscribe_tokens SET revoked_at=now() WHERE restaurant_id=$1 AND customer_id=$2 AND consumed_at IS NULL AND revoked_at IS NULL",[restaurantId,customerId]);
  await client.query("COMMIT");
  return json({ok:true,status:"unsubscribed"});
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
