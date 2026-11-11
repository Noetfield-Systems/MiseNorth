import {json} from "../../../../lib/api";
import {billingConfiguration} from "../../../../lib/stripe-client";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const b=billingConfiguration();
 const sender=Boolean(process.env.RESEND_API_KEY?.trim()&&process.env.RESEND_FROM_EMAIL?.trim());
 return json({ok:true,registration:{enabled:sender,emailVerification:sender?"enabled":"not_configured"},billing:{enabled:b.configured,mode:b.mode,configurationBlockers:b.reasons},inquiries:{enabled:true},payments:{guestFood:"not_implemented"}});
}
