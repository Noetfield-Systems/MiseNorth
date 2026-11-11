import {cookies} from "next/headers";
import {createHash,randomBytes} from "node:crypto";
import {query} from "./db";
export type SessionUser={id:string;restaurant_id:string;name:string;email:string;email_verified:boolean;role:"owner"|"manager"|"staff";restaurant_name:string;restaurant_slug:string;is_demo:boolean};
const COOKIE="misenorth_session";
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
export async function createSession(userId:string){
 const raw=randomBytes(32).toString("base64url");
 await query("DELETE FROM sessions WHERE expires_at<now()");
 await query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '14 days')",[hash(raw),userId]);
 const jar=await cookies();jar.set(COOKIE,raw,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*14});
}
export async function destroySession(){const jar=await cookies();const raw=jar.get(COOKIE)?.value;if(raw)await query("DELETE FROM sessions WHERE token_hash=$1",[hash(raw)]);jar.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});}
export async function currentUser():Promise<SessionUser|null>{
 const jar=await cookies();const raw=jar.get(COOKIE)?.value;if(!raw)return null;
 const r=await query<SessionUser>("SELECT u.id,u.restaurant_id,u.name,u.email,u.email_verified,u.role,r.name AS restaurant_name,r.slug AS restaurant_slug,r.is_demo FROM sessions s JOIN users u ON u.id=s.user_id JOIN restaurants r ON r.id=u.restaurant_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true AND u.email_verified=true",[hash(raw)]);
 return r.rows[0]||null;
}
export async function requireUser(){const u=await currentUser();if(!u)throw new Error("UNAUTHORIZED");return u;}
export function canManage(u:SessionUser){return u.role==="owner"||u.role==="manager";}
export function canOperate(u:SessionUser){return canManage(u)||u.role==="staff";}
