import {NextResponse} from "next/server";
export function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}
export function fail(error:unknown){
 const value=error as {message?:string;issues?:Array<{path?:Array<string|number>;message?:string}>};
 const message=error instanceof Error?error.message:"Unexpected error";
 if(value&&Array.isArray(value.issues))return json({error:"Invalid request data",code:"VALIDATION_ERROR",details:value.issues.slice(0,8).map(x=>({field:(x.path||[]).join("."),message:x.message||"Invalid value"}))},400);
 if(message==="UNAUTHORIZED")return json({error:"Authentication required"},401);
 if(message==="EMAIL_VERIFICATION_REQUIRED")return json({error:"Verify your email address before signing in.",code:"EMAIL_VERIFICATION_REQUIRED"},403);
 if(message==="EMAIL_DELIVERY_NOT_CONFIGURED")return json({error:"Email verification delivery is not configured. Your account remains pending.",code:"EMAIL_DELIVERY_NOT_CONFIGURED"},503);
 if(message==="EMAIL_DELIVERY_FAILED")return json({error:"The verification email could not be delivered. Request a new link later.",code:"EMAIL_DELIVERY_FAILED"},503);
 if(message==="BILLING_NOT_CONFIGURED")return json({error:"Subscription billing is not configured for this environment.",code:"BILLING_NOT_CONFIGURED"},503);
 if(message==="LIVE_BILLING_DISABLED")return json({error:"Live billing is disabled until pricing, tax and commercial terms are approved.",code:"LIVE_BILLING_DISABLED"},503);
 if(message==="BILLING_PRICE_INVALID")return json({error:"The configured Stripe prices are inactive or do not match the CAD monthly billing model.",code:"BILLING_PRICE_INVALID"},503);
 if(message==="SUBSCRIPTION_ALREADY_ACTIVE")return json({error:"This restaurant already has an active subscription. Use the customer portal to manage it.",code:"SUBSCRIPTION_ALREADY_ACTIVE"},409);
 if(message==="FORBIDDEN")return json({error:"Insufficient permission"},403);
 if(message==="RATE_LIMITED")return json({error:"Too many requests. Please try again later.",code:"RATE_LIMITED"},429);
 if(message==="NOT_FOUND")return json({error:"Record not found"},404);
 if(message==="CONFLICT")return json({error:"This request conflicts with the current record or available capacity"},409);
 if(message.startsWith("VALIDATION:"))return json({error:message.slice(11),code:"VALIDATION_ERROR"},400);
 if(message==="DATABASE_URL is not configured")return json({error:"Database is not configured"},503);
 console.error("[MiseNorth]",message);return json({error:"Request could not be completed"},500);
}
export async function body<T=any>(req:Request):Promise<T>{
 try{const n=Number(req.headers.get("content-length")||"0");if(n>50000)throw new Error("VALIDATION:Invalid or oversized request body");const raw=await req.text();if(raw.length>50000)throw new Error("VALIDATION:Invalid or oversized request body");return JSON.parse(raw) as T;}
 catch(e){if(e instanceof Error&&e.message.startsWith("VALIDATION:"))throw e;throw new Error("VALIDATION:Invalid or oversized request body");}
}
export function sameOrigin(req:Request){
 const fetchSite=req.headers.get("sec-fetch-site");
 if(fetchSite==="cross-site")throw new Error("VALIDATION:Cross-origin request rejected");
 const origin=req.headers.get("origin");
 const referer=req.headers.get("referer");
 const source=origin||(referer?(()=>{try{return new URL(referer).origin;}catch{return null;}})():null);
 if(!source||source==="null")throw new Error("VALIDATION:Request origin is required");
 try{
  const actual=new URL(source);
  const requestUrl=new URL(req.url);
  const host=req.headers.get("host")||requestUrl.host;
  const forwardedProto=req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol=(forwardedProto||requestUrl.protocol.replace(":","")).toLowerCase();
  const expectedOrigin=protocol+"://"+host.toLowerCase();
  if(actual.origin.toLowerCase()!==expectedOrigin)throw new Error("VALIDATION:Cross-origin request rejected");
  // Public TLS terminates at the Railway edge; compare Origin to the externally visible Host/proto.
  // Do not infer the public transport from the internal request URL behind a reverse proxy.
 }catch(e){
  if(e instanceof Error&&e.message.startsWith("VALIDATION:"))throw e;
  throw new Error("VALIDATION:Invalid request origin");
 }
}
