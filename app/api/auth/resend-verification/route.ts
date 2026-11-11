import {createHash,randomBytes} from "node:crypto";
import {z} from "zod";
import type {PoolClient} from "pg";
import {pool,query} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";
import {sendEmailVerification} from "../../../../lib/email";

export const runtime="nodejs";

export async function POST(req:Request){
 let client:PoolClient|undefined;
 try{
  sameOrigin(req);
  const parsed=z.object({email:z.string().trim().email().max(180)}).parse(await body(req));
  const email=parsed.email.toLowerCase();
  await enforceRateLimit(req,"auth.resend_verification",6,3600,email);
  if(!process.env.RESEND_API_KEY?.trim()||!process.env.RESEND_FROM_EMAIL?.trim())throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
  // Keep the response generic so the endpoint does not disclose account existence.
  const found=await query<any>(
   "SELECT u.id,u.name,u.email,r.is_demo FROM users u JOIN restaurants r ON r.id=u.restaurant_id WHERE lower(u.email)=$1 AND u.active=true AND u.email_verified=false LIMIT 1",
   [email]
  );
  if(!found.rows[0]||found.rows[0].is_demo)return json({ok:true,message:"If this account needs verification, a new link will be sent."});
  const user=found.rows[0],rawToken=randomBytes(32).toString("base64url"),tokenHash=createHash("sha256").update(rawToken).digest("hex");
  client=await pool().connect();
  await client.query("BEGIN");
  await client.query("INSERT INTO email_verification_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '24 hours')",[tokenHash,user.id]);
  await client.query("COMMIT");
  try{await sendEmailVerification({to:user.email,name:user.name,token:rawToken});}catch{
   return json({ok:true,message:"If this account needs verification, a new link will be sent."});
  }
  await query("UPDATE email_verification_tokens SET revoked_at=now() WHERE user_id=$1 AND token_hash<>$2 AND consumed_at IS NULL AND revoked_at IS NULL",[user.id,tokenHash]);
  return json({ok:true,message:"If this account needs verification, a new link will be sent."});
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  if(e instanceof Error&&e.message==="RATE_LIMITED")return fail(e);
  return fail(e);
 }finally{client?.release();}
}
