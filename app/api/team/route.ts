import {createHash,randomBytes} from "node:crypto";
import type {PoolClient} from "pg";
import {z} from "zod";
import {requireUser} from "../../../lib/auth";
import {query,pool,uid,audit} from "../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {enforceRateLimit} from "../../../lib/rate-limit";
import {sendTeamInvite,EmailDeliveryNotConfiguredError,EmailDeliveryError} from "../../../lib/email";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 try{
  const user=await requireUser();
  if(user.role!=="owner"||user.is_demo)throw new Error("FORBIDDEN");
  const [members,invitations]=await Promise.all([
   query<any>(
    "SELECT id,name,email,email_verified,role,active,created_at FROM users WHERE restaurant_id=$1 ORDER BY created_at",
    [user.restaurant_id]
   ),
   query<any>(
    "SELECT id,email,role,expires_at,created_at FROM team_invitations WHERE restaurant_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC",
    [user.restaurant_id]
   )
  ]);
  return json({members:members.rows,invitations:invitations.rows});
 }catch(e){return fail(e);}
}

export async function POST(req:Request){
 let client:PoolClient|undefined;
 let invitationId="",tokenHash="",restaurantId="";
 try{
  sameOrigin(req);
  const owner=await requireUser();
  if(owner.role!=="owner"||owner.is_demo)throw new Error("FORBIDDEN");
  await enforceRateLimit(req,"team.invite",10,3600,owner.restaurant_id);
  if(!process.env.RESEND_API_KEY?.trim()||!process.env.RESEND_FROM_EMAIL?.trim())throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
  const input=z.object({
   email:z.string().trim().email().max(180),
   role:z.enum(["manager","staff"])
  }).parse(await body(req));
  const email=input.email.toLowerCase();
  const existing=await query<any>("SELECT id,restaurant_id FROM users WHERE lower(email)=$1 LIMIT 1",[email]);
  if(existing.rows[0])throw new Error("CONFLICT");
  const restaurant=await query<any>("SELECT name FROM restaurants WHERE id=$1 AND is_demo=false",[owner.restaurant_id]);
  if(!restaurant.rows[0])throw new Error("NOT_FOUND");
  invitationId=uid();restaurantId=owner.restaurant_id;
  const rawToken=randomBytes(32).toString("base64url");
  tokenHash=createHash("sha256").update(rawToken).digest("hex");
  const dbClient=await pool().connect();client=dbClient;
  await dbClient.query("BEGIN");
  await dbClient.query(
   "UPDATE team_invitations SET revoked_at=now() WHERE restaurant_id=$1 AND lower(email)=$2 AND accepted_at IS NULL AND revoked_at IS NULL",
   [restaurantId,email]
  );
  await dbClient.query(
   "INSERT INTO team_invitations(id,restaurant_id,invited_by_user_id,email,role,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '7 days')",
   [invitationId,restaurantId,owner.id,email,input.role,tokenHash]
  );
  await dbClient.query("COMMIT");
  try{
   await sendTeamInvite({to:email,restaurantName:restaurant.rows[0].name,inviterName:owner.name,role:input.role,token:rawToken});
  }catch(deliveryError){
   await query("UPDATE team_invitations SET revoked_at=now() WHERE id=$1",[invitationId]);
   throw deliveryError instanceof EmailDeliveryNotConfiguredError?new Error("EMAIL_DELIVERY_NOT_CONFIGURED"):new Error("EMAIL_DELIVERY_FAILED");
  }
  await audit(restaurantId,owner.id,"team.invitation_sent","team_invitation",invitationId,{role:input.role});
  return json({ok:true,invitation:{id:invitationId,email,role:input.role,status:"sent"}},201);
 }catch(e){
  try{await client?.query("ROLLBACK");}catch{}
  return fail(e);
 }finally{client?.release();}
}
 
export async function PATCH(req:Request){
 try{
  sameOrigin(req);
  const owner=await requireUser();
  if(owner.role!=="owner"||owner.is_demo)throw new Error("FORBIDDEN");
  await enforceRateLimit(req,"team.update_member",30,3600,owner.restaurant_id);
  const input=z.object({
   userId:z.string().uuid(),
   role:z.enum(["manager","staff"]).optional(),
   active:z.boolean().optional()
  }).refine(v=>v.role!==undefined||v.active!==undefined).parse(await body(req));
  const current=await query<any>(
   "SELECT id,role,active FROM users WHERE id=$1 AND restaurant_id=$2",
   [input.userId,owner.restaurant_id]
  );
  if(!current.rows[0]||current.rows[0].role==="owner")throw new Error("NOT_FOUND");
  const nextRole=input.role??current.rows[0].role;
  const nextActive=input.active??current.rows[0].active;
  await query(
   "UPDATE users SET role=$1,active=$2 WHERE id=$3 AND restaurant_id=$4",
   [nextRole,nextActive,input.userId,owner.restaurant_id]
  );
  if(!nextActive)await query("DELETE FROM sessions WHERE user_id=$1",[input.userId]);
  await audit(owner.restaurant_id,owner.id,"team.member_updated","user",input.userId,{role:nextRole,active:nextActive});
  return json({ok:true,member:{id:input.userId,role:nextRole,active:nextActive}});
 }catch(e){return fail(e);}
}

export async function DELETE(req:Request){
 try{
  sameOrigin(req);
  const owner=await requireUser();
  if(owner.role!=="owner"||owner.is_demo)throw new Error("FORBIDDEN");
  await enforceRateLimit(req,"team.revoke_invitation",30,3600,owner.restaurant_id);
  const input=z.object({invitationId:z.string().uuid()}).parse(await body(req));
  const result=await query<any>(
   "UPDATE team_invitations SET revoked_at=now() WHERE id=$1 AND restaurant_id=$2 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING id,email,role",
   [input.invitationId,owner.restaurant_id]
  );
  if(!result.rows[0])throw new Error("NOT_FOUND");
  await audit(owner.restaurant_id,owner.id,"team.invitation_revoked","team_invitation",input.invitationId,{role:result.rows[0].role});
  return json({ok:true,invitation:{id:input.invitationId,status:"revoked"}});
 }catch(e){return fail(e);}
}
