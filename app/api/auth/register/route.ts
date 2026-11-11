import bcrypt from "bcryptjs";
import {createHash,randomBytes} from "node:crypto";
import {z} from "zod";
import type {PoolClient} from "pg";
import {pool,query,uid,audit} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";
import {sendEmailVerification,EmailDeliveryNotConfiguredError,EmailDeliveryError} from "../../../../lib/email";

export const runtime="nodejs";
const input=z.object({
 ownerName:z.string().trim().min(2).max(100),
 email:z.string().trim().email().max(180),
 password:z.string().min(12).max(100),
 restaurantName:z.string().trim().min(2).max(120),
 phone:z.string().max(40).optional().default(""),
 address:z.string().max(180).optional().default("")
});
function slugify(s:string){
 return s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"restaurant";
}

export async function POST(req:Request){
 let client:PoolClient|undefined;
 let restaurantId="",userId="",email="",ownerName="",rawToken="";
 try{
  sameOrigin(req);
  await enforceRateLimit(req,"auth.register",5,3600);
  const d=input.parse(await body(req));
  email=d.email.toLowerCase();ownerName=d.ownerName;
  restaurantId=uid();userId=uid();
  let slug=slugify(d.restaurantName);
  const exists=await query("SELECT 1 FROM users WHERE lower(email)=$1",[email]);
  if(exists.rowCount)throw new Error("CONFLICT");
  const duplicateSlug=await query("SELECT 1 FROM restaurants WHERE slug=$1",[slug]);
  if(duplicateSlug.rowCount)slug=slug+"-"+restaurantId.slice(0,5);
  const passwordHash=await bcrypt.hash(d.password,12);
  rawToken=randomBytes(32).toString("base64url");
  const tokenHash=createHash("sha256").update(rawToken).digest("hex");
  client=await pool().connect();
  await client.query("BEGIN");
  await client.query(
   "INSERT INTO restaurants(id,name,slug,phone,address,city,province,currency,timezone,tax_rate,tax_rate_verified) VALUES($1,$2,$3,$4,$5,'Vancouver','BC','CAD','America/Vancouver',0.0,false)",
   [restaurantId,d.restaurantName,slug,d.phone||null,d.address||null]
  );
  await client.query(
   "INSERT INTO users(id,restaurant_id,name,email,password_hash,role,email_verified) VALUES($1,$2,$3,$4,$5,'owner',false)",
   [userId,restaurantId,ownerName,email,passwordHash]
  );
  await client.query(
   "INSERT INTO email_verification_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '24 hours')",
   [tokenHash,userId]
  );
  await client.query("COMMIT");
  const restaurant={id:restaurantId,name:d.restaurantName,slug};
  try{
   await sendEmailVerification({to:email,name:ownerName,token:rawToken});
   try{await audit(restaurantId,userId,"user.email_verification_sent","user",userId,{provider:"resend"});}catch{}
   return json({ok:true,verificationRequired:true,delivery:"sent",restaurant},202);
  }catch(deliveryError){
   const delivery=deliveryError instanceof EmailDeliveryNotConfiguredError?"not_configured":"pending";
   try{await audit(restaurantId,userId,"user.email_verification_delivery_blocked","user",userId,{reason:deliveryError instanceof EmailDeliveryNotConfiguredError?"provider_not_configured":"provider_delivery_failed"});}catch{}
   return json({ok:true,verificationRequired:true,delivery,restaurant},202);
  }
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
