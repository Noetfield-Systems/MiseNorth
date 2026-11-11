import {timingSafeEqual} from "node:crypto";
import {query} from "../../../../../lib/db";
import {billingConfiguration} from "../../../../../lib/stripe-client";
import {json,fail} from "../../../../../lib/api";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function authorized(req:Request):boolean{
 const expected=process.env.MISENORTH_COMPANY_OS_SHARED_SECRET?.trim()||"";
 const header=req.headers.get("authorization")||"";
 const match=header.match(/^Bearer\s+(.+)$/i);
 const supplied=match?.[1]||"";
 if(expected.length<32||!supplied)return false;
 const a=Buffer.from(expected),b=Buffer.from(supplied);
 return a.length===b.length&&timingSafeEqual(a,b);
}

export async function GET(req:Request){
 if(!process.env.MISENORTH_COMPANY_OS_SHARED_SECRET?.trim())return json({error:"Company OS aggregate export is not configured."},503);
 if(!authorized(req))return json({error:"Unauthorized."},401);
 try{
  const [tenant,orders,reservations,guests,billing,collections,onboarding,support,integrations]=await Promise.all([
   query<any>(
    "SELECT count(*)::int AS restaurant_workspaces FROM restaurants WHERE is_demo=false",
    []
   ),
   query<any>(
    `SELECT count(*)::int AS order_requests,
      COALESCE(sum(total_cents),0)::bigint AS requested_order_value_cents,
      count(*) FILTER (WHERE status IN ('new','accepted','preparing','ready'))::int AS open_order_requests
     FROM orders o JOIN restaurants r ON r.id=o.restaurant_id
     WHERE r.is_demo=false AND o.status<>'cancelled'`,
    []
   ),
   query<any>(
    `SELECT count(*)::int AS reservation_requests,
      count(*) FILTER (WHERE status='requested')::int AS pending_reservations,
      count(*) FILTER (WHERE status='confirmed')::int AS confirmed_reservations
     FROM reservations b JOIN restaurants r ON r.id=b.restaurant_id WHERE r.is_demo=false`,
    []
   ),
   query<any>(
    "SELECT count(*)::int AS guest_profiles FROM customers c JOIN restaurants r ON r.id=c.restaurant_id WHERE r.is_demo=false",
    []
   ),
   query<any>(
    `SELECT count(*) FILTER (WHERE subscription_status='active' AND entitlement_status='active'
       AND latest_invoice_status='paid' AND current_period_end>now()
       AND currency='CAD' AND billing_interval='month')::int AS active_paid_locations,
      COALESCE(sum(unit_amount_cents*quantity) FILTER (WHERE subscription_status='active' AND entitlement_status='active'
       AND latest_invoice_status='paid' AND current_period_end>now()
       AND currency='CAD' AND billing_interval='month'),0)::bigint AS mrr_cents
     FROM misenorth_billing_accounts`,
    []
   ),
   query<any>(
    "SELECT COALESCE(sum(amount_paid_cents),0)::bigint AS collected_stripe_cash_cents,count(*) FILTER (WHERE status='paid')::int AS paid_invoices,count(*)::int AS invoice_count FROM misenorth_billing_invoices",
    []
   ),
   query<any>(
    "SELECT COALESCE(sum(l.amount_cents),0)::bigint AS onboarding_receipts_cents FROM misenorth_billing_invoice_lines l JOIN misenorth_billing_invoices i ON i.stripe_invoice_id=l.stripe_invoice_id WHERE i.status='paid' AND l.line_type='one_time'",
    []
   ),
   query<any>(
    "SELECT count(*) FILTER (WHERE status IN ('open','triaged','in_progress','waiting_customer'))::int AS open_support_cases,count(*) FILTER (WHERE severity IN ('high','critical') AND status NOT IN ('resolved','closed'))::int AS high_severity_support_cases FROM support_tickets",
    []
   ),
   query<any>(
    "SELECT provider,count(*) FILTER (WHERE status='connected' AND last_verified_at IS NOT NULL)::int AS verified_connected_tenants FROM integration_connections GROUP BY provider ORDER BY provider",
    []
   )
  ]);
  const billingConfig=billingConfiguration();
  const t=tenant.rows[0]||{},o=orders.rows[0]||{},b=reservations.rows[0]||{},g=guests.rows[0]||{};
  const pay=billing.rows[0]||{},cash=collections.rows[0]||{},setup=onboarding.rows[0]||{},sup=support.rows[0]||{};
  return json({
   schema_version:"1.0.0",
   source:"misenorth",
   company_id:"noetfield.misenorth",
   product_id:"noetfield.misenorth",
   generated_at:new Date().toISOString(),
   data_scope:"aggregate_only_no_guest_or_restaurant_identifiers",
   commercial:{
    restaurant_workspaces:Number(t.restaurant_workspaces||0),
    order_requests:Number(o.order_requests||0),
    requested_order_value_cents:Number(o.requested_order_value_cents||0),
    open_order_requests:Number(o.open_order_requests||0),
    active_paid_locations:Number(pay.active_paid_locations||0),
    mrr_cents:Number(pay.mrr_cents||0),
    mrr_status:billingConfig.configured&&Number(cash.invoice_count||0)>0?"SOURCE_RECONCILED":"NOT_TRACKED",
    collected_stripe_cash_cents:Number(cash.collected_stripe_cash_cents||0),
    collected_stripe_cash_status:billingConfig.configured&&Number(cash.invoice_count||0)>0?"SOURCE_RECONCILED":"NOT_TRACKED",
    paid_invoice_count:Number(cash.paid_invoices||0),
    onboarding_receipts_cents:Number(setup.onboarding_receipts_cents||0),
    guest_food_payments_status:"NOT_TRACKED",
    cac_status:"NOT_TRACKED",
    gross_margin_status:"NOT_TRACKED"
   },
   product:{
    reservation_requests:Number(b.reservation_requests||0),
    pending_reservations:Number(b.pending_reservations||0),
    confirmed_reservations:Number(b.confirmed_reservations||0),
    guest_profiles:Number(g.guest_profiles||0),
    integrations:integrations.rows
   },
   support:{
    open_cases:Number(sup.open_support_cases||0),
    high_severity_cases:Number(sup.high_severity_support_cases||0)
   }
  });
 }catch(e){return fail(e);}
}
