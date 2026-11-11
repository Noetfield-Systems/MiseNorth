import {z} from "zod";
import {requireUser,canManage} from "../../../../lib/auth";
import {query,audit} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {billingConfiguration,getStripeClient,publicAppOrigin} from "../../../../lib/stripe-client";

export const runtime="nodejs";

export async function POST(req:Request){
 try{
  sameOrigin(req);
  const user=await requireUser();
  if(!canManage(user)||user.role!=="owner")throw new Error("FORBIDDEN");
  z.object({}).parse(await body(req));
  const cfg=billingConfiguration();
  if(!cfg.configured)throw new Error("BILLING_NOT_CONFIGURED");
  const account=await query<any>("SELECT stripe_customer_id FROM misenorth_billing_accounts WHERE restaurant_id=$1",[user.restaurant_id]);
  if(!account.rows[0]?.stripe_customer_id)throw new Error("NOT_FOUND");
  const stripe=getStripeClient();
  const session=await stripe.billingPortal.sessions.create({
   customer:account.rows[0].stripe_customer_id,
   return_url:publicAppOrigin()+"/admin"
  });
  await audit(user.restaurant_id,user.id,"billing.customer_portal_created","billing_portal",session.id,{mode:cfg.mode});
  return json({ok:true,url:session.url});
 }catch(e){return fail(e);}
}
