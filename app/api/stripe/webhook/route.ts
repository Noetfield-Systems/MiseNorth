import type Stripe from "stripe";
import type {PoolClient} from "pg";
import {pool,uid} from "../../../../lib/db";
import {json} from "../../../../lib/api";
import {billingConfiguration,getStripeClient} from "../../../../lib/stripe-client";

export const runtime="nodejs";

function idOf(value:any):string|null{
 if(!value)return null;
 if(typeof value==="string")return value;
 return typeof value.id==="string"?value.id:null;
}
function isoFromUnix(value:any):string|null{
 const n=Number(value);
 return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():null;
}
async function accountForCustomer(client:PoolClient,customerId:string|null){
 if(!customerId)return null;
 const result=await client.query<any>(
  "SELECT restaurant_id,subscription_status,latest_invoice_status,latest_invoice_id FROM misenorth_billing_accounts WHERE stripe_customer_id=$1 FOR UPDATE",
  [customerId]
 );
 return result.rows[0]||null;
}
async function upsertInvoice(client:PoolClient,restaurantId:string,invoice:any,subscriptionId:string|null,status:string,stripe:Stripe){
 const allLines:any[]=[];
 let page=await stripe.invoices.listLineItems(invoice.id,{limit:100});
 allLines.push(...page.data);
 let pages=0;
 while(page.has_more&&pages<10){
  const last=page.data[page.data.length-1];
  if(!last?.id)throw new Error("STRIPE_INVOICE_LINE_CURSOR_MISSING");
  page=await stripe.invoices.listLineItems(invoice.id,{limit:100,starting_after:last.id});
  allLines.push(...page.data);
  pages++;
 }
 if(page.has_more)throw new Error("STRIPE_INVOICE_LINE_LIMIT_EXCEEDED");
 const lines=allLines;
 let recurringLine:any=null;
 const resolvedLines:any[]=[];
 for(const line of lines){
  const rawPrice=line.price||line.pricing?.price_details?.price||null;
  const priceId=idOf(rawPrice);
  let price:any=rawPrice&&typeof rawPrice==="object"?rawPrice:null;
  if(priceId&&!price){
   try{price=await stripe.prices.retrieve(priceId);}catch{price=null;}
  }
  const lineType=price?.recurring?"recurring":price?"one_time":"unknown";
  if(lineType==="recurring"&&!recurringLine)recurringLine={line,price};
  resolvedLines.push({line,price,priceId,lineType});
 }
 const periodStart=recurringLine?.line?.period?.start??invoice.period_start;
 const periodEnd=recurringLine?.line?.period?.end??invoice.period_end;
 await client.query(
  `INSERT INTO misenorth_billing_invoices(
    stripe_invoice_id,restaurant_id,stripe_subscription_id,stripe_payment_intent_id,
    amount_due_cents,amount_paid_cents,currency,status,billing_reason,hosted_invoice_url,
    invoice_pdf_url,period_start,period_end,paid_at,updated_at
   ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())
   ON CONFLICT(stripe_invoice_id) DO UPDATE SET
    stripe_subscription_id=COALESCE(EXCLUDED.stripe_subscription_id,misenorth_billing_invoices.stripe_subscription_id),
    stripe_payment_intent_id=COALESCE(EXCLUDED.stripe_payment_intent_id,misenorth_billing_invoices.stripe_payment_intent_id),
    amount_due_cents=EXCLUDED.amount_due_cents,amount_paid_cents=EXCLUDED.amount_paid_cents,
    currency=EXCLUDED.currency,status=EXCLUDED.status,billing_reason=EXCLUDED.billing_reason,
    hosted_invoice_url=EXCLUDED.hosted_invoice_url,invoice_pdf_url=EXCLUDED.invoice_pdf_url,
    period_start=COALESCE(EXCLUDED.period_start,misenorth_billing_invoices.period_start),
    period_end=COALESCE(EXCLUDED.period_end,misenorth_billing_invoices.period_end),
    paid_at=COALESCE(EXCLUDED.paid_at,misenorth_billing_invoices.paid_at),updated_at=now()`,
  [
   invoice.id,restaurantId,subscriptionId,idOf(invoice.payment_intent),
   Number(invoice.amount_due||0),Number(invoice.amount_paid||0),String(invoice.currency||"cad").toUpperCase(),
   status,invoice.billing_reason||null,invoice.hosted_invoice_url||null,invoice.invoice_pdf||null,
   isoFromUnix(periodStart),isoFromUnix(periodEnd),isoFromUnix(invoice.status_transitions?.paid_at)
  ]
 );
 await client.query("DELETE FROM misenorth_billing_invoice_lines WHERE stripe_invoice_id=$1",[invoice.id]);
 for(const entry of resolvedLines){
  const {line,price,priceId,lineType}=entry;
  await client.query(
   `INSERT INTO misenorth_billing_invoice_lines(
     stripe_invoice_line_id,stripe_invoice_id,restaurant_id,stripe_price_id,stripe_product_id,
     description,quantity,amount_cents,currency,line_type,recurring_interval
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT(stripe_invoice_line_id) DO UPDATE SET
     stripe_invoice_id=EXCLUDED.stripe_invoice_id,restaurant_id=EXCLUDED.restaurant_id,
     stripe_price_id=EXCLUDED.stripe_price_id,stripe_product_id=EXCLUDED.stripe_product_id,
     description=EXCLUDED.description,quantity=EXCLUDED.quantity,amount_cents=EXCLUDED.amount_cents,
     currency=EXCLUDED.currency,line_type=EXCLUDED.line_type,recurring_interval=EXCLUDED.recurring_interval`,
   [
    line.id,invoice.id,restaurantId,priceId,idOf(price?.product),String(line.description||"").slice(0,500),
    Number(line.quantity||1),Number(line.amount||0),String(line.currency||invoice.currency||"cad").toUpperCase(),
    lineType,price?.recurring?.interval||null
   ]
  );
 }
 if(recurringLine&&subscriptionId){
  const price=recurringLine.price,line=recurringLine.line;
  await client.query(
   "UPDATE misenorth_billing_accounts SET stripe_price_id=$1,unit_amount_cents=$2,currency=$3,quantity=$4,updated_at=now() WHERE restaurant_id=$5",
   [price.id||null,price.unit_amount??null,String(price.currency||invoice.currency||"cad").toUpperCase(),Number(line.quantity||1),restaurantId]
  );
 }
}
async function processEvent(client:PoolClient,event:Stripe.Event,stripe:Stripe){
 const object=event.data.object as any;
 const type=event.type;
 if(type==="checkout.session.completed"||type==="checkout.session.async_payment_succeeded"){
  if(object.mode!=="subscription")return;
  const customerId=idOf(object.customer),subscriptionId=idOf(object.subscription);
  const account=await accountForCustomer(client,customerId);
  if(!account)return;
  // Checkout completion only records the Stripe resource link. It never grants paid access.
  await client.query(
   "UPDATE misenorth_billing_accounts SET stripe_subscription_id=COALESCE($1,stripe_subscription_id),updated_at=now() WHERE restaurant_id=$2",
   [subscriptionId,account.restaurant_id]
  );
  return;
 }
 if(type.startsWith("customer.subscription.")){
  const customerId=idOf(object.customer);
  const account=await accountForCustomer(client,customerId);
  if(!account)return;
  const firstItem=object.items?.data?.[0];
  const periodStart=object.current_period_start??firstItem?.current_period_start;
  const periodEnd=object.current_period_end??firstItem?.current_period_end;
  const latestInvoiceId=idOf(object.latest_invoice);
  const latestInvoiceMatches=Boolean(latestInvoiceId)&&latestInvoiceId===account.latest_invoice_id;
  const latestInvoicePaid=account.latest_invoice_status==="paid"&&latestInvoiceMatches;
  const status=String(object.status||"incomplete");
  let entitlement="inactive",graceUntil:string|null=null;
  if(status==="trialing")entitlement="active";
  else if(status==="active"&&latestInvoicePaid)entitlement="active";
  else if(status==="past_due"&&latestInvoicePaid){entitlement="grace";graceUntil=new Date(Date.now()+7*86400000).toISOString();}
  else if(status==="past_due"){entitlement="grace";graceUntil=new Date(Date.now()+7*86400000).toISOString();}
  else if(["canceled","unpaid","incomplete_expired","paused"].includes(status))entitlement="blocked";
  await client.query(
   `UPDATE misenorth_billing_accounts SET stripe_subscription_id=$1,subscription_status=$2,
    stripe_price_id=$3,quantity=$4,unit_amount_cents=$5,currency=$6,billing_interval=$7,
    entitlement_status=$8,grace_until=$9,current_period_start=$10,current_period_end=$11,
    cancel_at_period_end=$12,
    latest_invoice_id=COALESCE($13,latest_invoice_id),
    latest_invoice_status=CASE WHEN $13 IS NOT NULL AND $13 IS DISTINCT FROM latest_invoice_id THEN 'pending' ELSE latest_invoice_status END,
    last_verified_at=now(),updated_at=now()
    WHERE restaurant_id=$14`,
   [
    object.id,status,firstItem?.price?.id||null,Number(firstItem?.quantity||1),
    firstItem?.price?.unit_amount??null,String(firstItem?.price?.currency||"cad").toUpperCase(),
    firstItem?.price?.recurring?.interval||"month",entitlement,graceUntil,
    isoFromUnix(periodStart),isoFromUnix(periodEnd),Boolean(object.cancel_at_period_end),
    latestInvoiceId,account.restaurant_id
   ]
  );
  return;
 }
 if(type==="invoice.paid"||type==="invoice.payment_succeeded"||type==="invoice.payment_failed"){
  const invoice=object;
  const customerId=idOf(invoice.customer);
  const account=await accountForCustomer(client,customerId);
  if(!account)return;
  const subscriptionId=idOf(invoice.subscription)||idOf(invoice.parent?.subscription_details?.subscription);
  const paid=type!=="invoice.payment_failed"&&invoice.status==="paid";
  await upsertInvoice(client,account.restaurant_id,invoice,subscriptionId,paid?"paid":String(invoice.status||"open"),stripe);
  if(paid){
   await client.query(
    `UPDATE misenorth_billing_accounts SET
      stripe_subscription_id=COALESCE($1,stripe_subscription_id),
      subscription_status=CASE WHEN subscription_status IN ('canceled','unpaid','incomplete_expired','paused') THEN subscription_status ELSE 'active' END,
      entitlement_status=CASE WHEN subscription_status IN ('canceled','unpaid','incomplete_expired','paused') THEN 'blocked' ELSE 'active' END,
      latest_invoice_id=$2,latest_invoice_status='paid',grace_until=NULL,last_verified_at=now(),updated_at=now()
     WHERE restaurant_id=$3`,
    [subscriptionId,invoice.id,account.restaurant_id]
   );
  }else{
   await client.query(
    `UPDATE misenorth_billing_accounts SET
      subscription_status=CASE WHEN subscription_status IN ('canceled','unpaid','incomplete_expired','paused') THEN subscription_status ELSE 'past_due' END,
      entitlement_status=CASE WHEN subscription_status IN ('canceled','unpaid','incomplete_expired','paused') THEN 'blocked' ELSE 'grace' END,
      grace_until=CASE WHEN subscription_status IN ('canceled','unpaid','incomplete_expired','paused') THEN NULL ELSE now()+interval '7 days' END,
      latest_invoice_id=$1,latest_invoice_status='payment_failed',
      last_verified_at=now(),updated_at=now() WHERE restaurant_id=$2`,
    [invoice.id,account.restaurant_id]
   );
  }
  return;
 }
 if(type==="charge.refunded"||type==="charge.dispute.created"||type==="radar.early_fraud_warning.created"){
  let charge=object;
  const chargeId=type==="charge.refunded"?idOf(charge.id):idOf(charge.charge);
  if(chargeId&&type!=="charge.refunded"){
   try{charge=await stripe.charges.retrieve(chargeId);}catch{charge=object;}
  }
  const customerId=idOf(charge.customer)||idOf(object.customer);
  const invoiceId=idOf(charge.invoice)||idOf(object.invoice);
  let account=await accountForCustomer(client,customerId);
  if(!account&&invoiceId){
   const invoice=await client.query<any>("SELECT restaurant_id FROM misenorth_billing_invoices WHERE stripe_invoice_id=$1",[invoiceId]);
   if(invoice.rows[0])account={restaurant_id:invoice.rows[0].restaurant_id,subscription_status:"unknown",latest_invoice_status:"unknown"};
  }
  if(account){
   await client.query(
    "UPDATE misenorth_billing_accounts SET entitlement_status='review',last_verified_at=now(),updated_at=now() WHERE restaurant_id=$1",
    [account.restaurant_id]
   );
  }
  return;
 }
 // The integration does not persist Customer PII; unhandled events are durably ignored.
}

export async function POST(req:Request){
 const cfg=billingConfiguration();
 if(!cfg.configured)return json({error:"Stripe webhook is not configured."},503);
 const signature=req.headers.get("stripe-signature");
 if(!signature)return json({error:"Missing Stripe signature."},400);
 let event:Stripe.Event;
 const stripe=getStripeClient();
 try{
  const raw=await req.text();
  event=stripe.webhooks.constructEvent(raw,signature,cfg.webhookSecret);
 }catch{
  return json({error:"Invalid Stripe webhook signature."},400);
 }
 if(event.livemode!==(cfg.mode==="live"))return json({error:"Stripe event mode does not match this environment."},400);
 let client:PoolClient|undefined;
 try{
  const object=event.data.object as any;
  const inserted=await pool().query(
   `INSERT INTO misenorth_stripe_events(stripe_event_id,event_type,object_id,livemode,processing_status)
    VALUES($1,$2,$3,$4,'received')
    ON CONFLICT(stripe_event_id) DO UPDATE SET processing_status='received',error_code=NULL,received_at=now()
      WHERE misenorth_stripe_events.processing_status='failed'
       OR (misenorth_stripe_events.processing_status='received' AND misenorth_stripe_events.received_at<now()-interval '5 minutes')
    RETURNING stripe_event_id`,
   [event.id,event.type,idOf(object?.id),event.livemode]
  );
  if(!inserted.rowCount)return json({ok:true,duplicate:true});
  client=await pool().connect();
  await client.query("BEGIN");
  await processEvent(client,event,stripe);
  await client.query("UPDATE misenorth_stripe_events SET processing_status='processed',processed_at=now() WHERE stripe_event_id=$1",[event.id]);
  await client.query("COMMIT");
  return json({ok:true,received:true});
 }catch(error){
  try{await client?.query("ROLLBACK");}catch{}
  await pool().query(
   "UPDATE misenorth_stripe_events SET processing_status='failed',error_code=$2 WHERE stripe_event_id=$1",
   [event.id,error instanceof Error?error.name.slice(0,80):"unknown"]
  ).catch(()=>undefined);
  return json({error:"Stripe event processing failed; retry will be safe."},500);
 }finally{client?.release();}
}
