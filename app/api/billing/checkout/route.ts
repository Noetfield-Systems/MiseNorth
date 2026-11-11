import {randomBytes} from "node:crypto";
import {z} from "zod";
import type Stripe from "stripe";
import {requireUser,canManage} from "../../../../lib/auth";
import {query,uid,audit} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {billingConfiguration,getStripeClient,publicAppOrigin} from "../../../../lib/stripe-client";

export const runtime="nodejs";

export async function POST(req:Request){
 try{
  sameOrigin(req);
  const user=await requireUser();
  if(!canManage(user)||user.role!=="owner")throw new Error("FORBIDDEN");
  const {requestId}=z.object({requestId:z.string().uuid()}).parse(await body(req));
  const cfg=billingConfiguration();
  if(!cfg.configured)throw new Error("BILLING_NOT_CONFIGURED");
  const stripe=getStripeClient();
  const restaurant=await query<any>("SELECT id,name FROM restaurants WHERE id=$1 AND is_demo=false",[user.restaurant_id]);
  if(!restaurant.rows[0])throw new Error("NOT_FOUND");
  const existing=await query<any>(
   "SELECT stripe_customer_id,stripe_subscription_id,subscription_status,entitlement_status FROM misenorth_billing_accounts WHERE restaurant_id=$1",
   [user.restaurant_id]
  );
  const account=existing.rows[0];
  if(account&&["active","trialing"].includes(account.subscription_status)&&["active","grace"].includes(account.entitlement_status)){
   throw new Error("SUBSCRIPTION_ALREADY_ACTIVE");
  }
  const idempotencyKey="misenorth:checkout:"+user.restaurant_id+":"+requestId;
  const previous=await query<any>(
   "SELECT checkout_url,expires_at FROM misenorth_checkout_attempts WHERE idempotency_key=$1 AND restaurant_id=$2",
   [idempotencyKey,user.restaurant_id]
  );
  if(previous.rows[0]?.checkout_url&&(!previous.rows[0].expires_at||new Date(previous.rows[0].expires_at).getTime()>Date.now())){
   return json({ok:true,url:previous.rows[0].checkout_url,reused:true});
  }
  const recurringPrice=await stripe.prices.retrieve(cfg.recurringPrice);
  if(!recurringPrice.active||recurringPrice.currency!=="cad"||recurringPrice.recurring?.interval!=="month"||recurringPrice.unit_amount==null||recurringPrice.unit_amount!==cfg.expectedMonthlyCents){
   throw new Error("BILLING_PRICE_INVALID");
  }
  let setupPrice:Stripe.Price|undefined;
  if(cfg.setupPrice){
   setupPrice=await stripe.prices.retrieve(cfg.setupPrice);
   if(!setupPrice.active||setupPrice.currency!=="cad"||setupPrice.recurring!==null||setupPrice.unit_amount==null||setupPrice.unit_amount!==cfg.expectedSetupCents){
    throw new Error("BILLING_PRICE_INVALID");
   }
  }
  let customerId=account?.stripe_customer_id as string|undefined;
  if(customerId){
   const existingCustomer=await stripe.customers.retrieve(customerId);
   if("deleted" in existingCustomer&&existingCustomer.deleted)customerId=undefined;
  }
  if(!customerId){
   const customer=await stripe.customers.create(
    {email:user.email,name:user.name,metadata:{misenorth_restaurant_id:user.restaurant_id,product_id:"noetfield.misenorth"}},
    {idempotencyKey:"misenorth:customer:"+user.restaurant_id}
   );
   customerId=customer.id;
  }
  await query(
   `INSERT INTO misenorth_billing_accounts(restaurant_id,stripe_customer_id,currency,subscription_status,entitlement_status,updated_at)
    VALUES($1,$2,'CAD','not_started','inactive',now())
    ON CONFLICT(restaurant_id) DO UPDATE SET
      stripe_customer_id=EXCLUDED.stripe_customer_id,updated_at=now()`,
   [user.restaurant_id,customerId]
  );
  const origin=publicAppOrigin();
  const suffix=[...randomBytes(8)].map(b=>String.fromCharCode(97+(b%26))).join("");
  const lineItems:Stripe.Checkout.SessionCreateParams.LineItem[]=[
   {price:recurringPrice.id,quantity:1}
  ];
  if(!setupPrice)throw new Error("BILLING_PRICE_INVALID");
  lineItems.push({price:setupPrice.id,quantity:1});
  const params:Stripe.Checkout.SessionCreateParams&{integration_identifier?:string}={
   mode:"subscription",
   customer:customerId,
   line_items:lineItems,
   billing_address_collection:"required",
   client_reference_id:user.restaurant_id,
   metadata:{restaurant_id:user.restaurant_id,product_id:"noetfield.misenorth",schema_version:"1"},
   subscription_data:{metadata:{restaurant_id:user.restaurant_id,product_id:"noetfield.misenorth",schema_version:"1"}},
   success_url:origin+"/admin?billing=return",
   cancel_url:origin+"/pricing?billing=cancelled",
   integration_identifier:"misenorth_founder_"+suffix
  };
  const session=await stripe.checkout.sessions.create(params,{idempotencyKey});
  if(!session.url)throw new Error("BILLING_CHECKOUT_URL_MISSING");
  await query(
   "INSERT INTO misenorth_checkout_attempts(idempotency_key,restaurant_id,stripe_checkout_session_id,checkout_url,expires_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(idempotency_key) DO UPDATE SET stripe_checkout_session_id=EXCLUDED.stripe_checkout_session_id,checkout_url=EXCLUDED.checkout_url,expires_at=EXCLUDED.expires_at",
   [idempotencyKey,user.restaurant_id,session.id,session.url,session.expires_at?new Date(session.expires_at*1000).toISOString():null]
  );
  await audit(user.restaurant_id,user.id,"billing.checkout_session_created","billing_checkout",session.id,{mode:cfg.mode,price_id:recurringPrice.id,setup_fee:!!setupPrice});
  return json({ok:true,url:session.url,sessionId:session.id});
 }catch(e){
  if(e instanceof Error&&e.message==="BILLING_CHECKOUT_URL_MISSING")return json({error:"Stripe did not return a hosted Checkout URL."},502);
  return fail(e);
 }
}
