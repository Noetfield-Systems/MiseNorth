import {createHash,randomBytes} from "node:crypto";
import {z} from "zod";
import type {PoolClient} from "pg";
import {pool,query} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";
import {sendPasswordReset} from "../../../../lib/email";

export const runtime="nodejs";
const generic={ok:true,message:"If this account is eligible, a password reset email will be sent."};

export async function POST(req:Request){
 let client:PoolClient|undefined;
 try{
  sameOrigin(req);
  const input=z.object({email:z.string().trim().email().max(180)}).parse(await body(req));
  const email=input.email.toLowerCase();
  await enforceRateLimit(req,"auth.forgot_password",6,3600,email);
  if(!process.env.RESEND_API_KEY?.trim()||!process.env.RESEND_FROM_EMAIL?.trim())return json(generic);
  const found=await query<any>(
   "SELECT u.id,u.name,u.email FROM users u JOIN restaurants r ON r.id=u.restaurant_id WHERE lower(u.email)=$1 AND u.active=true AND u.email_verified=true AND r.is_demo=false LIMIT 1",
   [email]
  );
  if(!found.rows[0])return json(generic);
  const user=found.rows[0];
  const rawToken=randomBytes(32).toString("base64url");
  const tokenHash=createHash("sha256").update(rawToken).digest("hex");
  client=await pool().connect();
  await client.query("BEGIN");
  await client.query("UPDATE password_reset_tokens SET revoked_at=now() WHERE user_id=$1 AND consumed_at IS NULL AND revoked_at IS NULL",[user.id]);
  await client.query(
   "INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '2 hours')",
   [tokenHash,user.id]
  );
  await client.query("COMMIT");
  try{
   await sendPasswordReset({to:user.email,name:user.name,token:rawToken});
  }catch{
   // The public response remains generic. The existing account remains usable.
  }
  return json(generic);
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
