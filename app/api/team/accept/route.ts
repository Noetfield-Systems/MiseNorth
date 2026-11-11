import bcrypt from "bcryptjs";
import {createHash} from "node:crypto";
import {z} from "zod";
import type {PoolClient} from "pg";
import {pool,uid} from "../../../../lib/db";
import {createSession} from "../../../../lib/auth";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";

export const runtime="nodejs";

export async function POST(req:Request){
 let client:PoolClient|undefined;
 try{
  sameOrigin(req);
  await enforceRateLimit(req,"team.accept_invitation",10,3600);
  const input=z.object({
   token:z.string().min(32).max(128),
   name:z.string().trim().min(2).max(100),
   password:z.string().min(12).max(100)
  }).parse(await body(req));
  const tokenHash=createHash("sha256").update(input.token).digest("hex");
  const passwordHash=await bcrypt.hash(input.password,12);
  const dbClient=await pool().connect();client=dbClient;
  await dbClient.query("BEGIN");
  const found=await dbClient.query<any>(
   "SELECT i.id,i.restaurant_id,i.email,i.role,r.name AS restaurant_name,r.is_demo FROM team_invitations i JOIN restaurants r ON r.id=i.restaurant_id WHERE i.token_hash=$1 AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>now() FOR UPDATE OF i",
   [tokenHash]
  );
  if(!found.rows[0]||found.rows[0].is_demo)throw new Error("NOT_FOUND");
  const invitation=found.rows[0];
  const existing=await dbClient.query("SELECT 1 FROM users WHERE lower(email)=lower($1)",[invitation.email]);
  if(existing.rowCount)throw new Error("CONFLICT");
  const userId=uid();
  await dbClient.query(
   "INSERT INTO users(id,restaurant_id,name,email,password_hash,role,email_verified,active) VALUES($1,$2,$3,$4,$5,$6,true,true)",
   [userId,invitation.restaurant_id,input.name,invitation.email,passwordHash,invitation.role]
  );
  await dbClient.query("UPDATE team_invitations SET accepted_at=now() WHERE id=$1",[invitation.id]);
  await dbClient.query(
   "INSERT INTO audit_events(id,restaurant_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,'team.invitation_accepted','user',$3,$4::jsonb)",
   [uid(),invitation.restaurant_id,userId,JSON.stringify({role:invitation.role,invitation_id:invitation.id})]
  );
  await dbClient.query("COMMIT");
  await createSession(userId);
  return json({ok:true,user:{id:userId,role:invitation.role,restaurant_name:invitation.restaurant_name}});
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
