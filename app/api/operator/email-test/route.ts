import {randomUUID} from "node:crypto";
import {fail,json,sameOrigin} from "../../../../lib/api";
import {requireOperator} from "../../../../lib/operator-auth";
import {enforceRateLimit} from "../../../../lib/rate-limit";
export const runtime="nodejs";
export async function POST(req:Request){
 try{
  sameOrigin(req);
  await requireOperator();
  await enforceRateLimit(req,"operator.email_test",2,3600);
  const key=process.env.RESEND_API_KEY?.trim()||"";
  const from=process.env.RESEND_FROM_EMAIL?.trim()||"";
  const recipient=process.env.MISENORTH_LEAD_NOTIFY_TO?.trim()||"";
  if(!key||!from||!recipient)return json({ok:false,error:"Transactional email configuration is incomplete."},503);
  const trace=randomUUID();
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"authorization":"Bearer "+key,"content-type":"application/json","idempotency-key":"misenorth-operator-test-"+trace},
   body:JSON.stringify({
    from,to:[recipient],subject:"MiseNorth — production email diagnostic",
    text:"This is a MiseNorth transactional email diagnostic initiated by an authenticated operator. No customer record was created. Reference: "+trace
   }),
   signal:AbortSignal.timeout(10000)
  });
  const result=await response.json().catch(()=>null) as {id?:string}|null;
  if(!response.ok||!result?.id){
   console.warn("[email-test] Resend rejected operator diagnostic",response.status);
   return json({ok:false,providerAccepted:false,providerStatus:response.status,error:"Email was not accepted by Resend. Check API-key permissions and verified sender domain."},502);
  }
  return json({ok:true,providerAccepted:true,delivery:"accepted_by_provider_not_confirmed_in_inbox",providerId:result.id,recipient});
 }catch(e){return fail(e);}
}
