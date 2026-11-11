import {createHmac,createHash,randomBytes,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
const COOKIE="misenorth_operator";
function secret(){const key=process.env.MISENORTH_OPERATOR_SECRET?.trim()||"";if(key.length<40)throw new Error("OPERATOR_NOT_CONFIGURED");return key;}
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function sign(data:string){return createHmac("sha256",secret()).update("misenorth-operator-v1:"+data).digest("base64url");}
export function validateOperatorKey(candidate:string){return equal(createHash("sha256").update(secret()).digest("hex"),createHash("sha256").update(candidate).digest("hex"));}
export async function startOperatorSession(){
 const payload=String(Math.floor(Date.now()/1000)+28800)+"."+randomBytes(20).toString("base64url");
 (await cookies()).set(COOKIE,payload+"."+sign(payload),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:28800});
}
export async function requireOperator(){
 const token=(await cookies()).get(COOKIE)?.value||"";
 const match=token.match(/^(\d{10,11})\.([A-Za-z0-9_-]{25,40})\.([A-Za-z0-9_-]{43})$/);
 if(!match)throw new Error("UNAUTHORIZED");
 const expiry=Number(match[1]), now=Math.floor(Date.now()/1000);
 if(!Number.isSafeInteger(expiry)||expiry<=now||expiry>now+28800)throw new Error("UNAUTHORIZED");
 if(!equal(sign(match[1]+"."+match[2]),match[3]))throw new Error("UNAUTHORIZED");
}
export async function endOperatorSession(){(await cookies()).set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});}
