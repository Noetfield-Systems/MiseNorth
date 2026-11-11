import {requireUser,canManage} from "../../../lib/auth";
import {query} from "../../../lib/db";
import {fail,json} from "../../../lib/api";
import {billingConfiguration} from "../../../lib/stripe-client";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 try{
  const user=await requireUser();
  if(user.role!=="owner")throw new Error("FORBIDDEN");
  const cfg=billingConfiguration();
  const [account,invoices,collections]=await Promise.all([
   query<any>(
    "SELECT subscription_status,entitlement_status,quantity,unit_amount_cents,currency,billing_interval,current_period_start,current_period_end,cancel_at_period_end,latest_invoice_id,latest_invoice_status,grace_until,last_verified_at FROM misenorth_billing_accounts WHERE restaurant_id=$1",
    [user.restaurant_id]
   ),
   query<any>(
    "SELECT stripe_invoice_id,amount_due_cents,amount_paid_cents,currency,status,billing_reason,hosted_invoice_url,invoice_pdf_url,paid_at,created_at FROM misenorth_billing_invoices WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 12",
    [user.restaurant_id]
   ),
   query<any>(
    `SELECT
      (SELECT COALESCE(sum(amount_paid_cents),0)::bigint FROM misenorth_billing_invoices WHERE restaurant_id=$1 AND status='paid') AS collected_cash_cents,
      (SELECT COALESCE(sum(l.amount_cents),0)::bigint FROM misenorth_billing_invoice_lines l JOIN misenorth_billing_invoices i ON i.stripe_invoice_id=l.stripe_invoice_id WHERE l.restaurant_id=$1 AND i.restaurant_id=$1 AND i.status='paid' AND l.line_type='recurring') AS recurring_line_cash_cents,
      (SELECT COALESCE(sum(l.amount_cents),0)::bigint FROM misenorth_billing_invoice_lines l JOIN misenorth_billing_invoices i ON i.stripe_invoice_id=l.stripe_invoice_id WHERE l.restaurant_id=$1 AND i.restaurant_id=$1 AND i.status='paid' AND l.line_type='one_time') AS one_time_line_cash_cents,
      (SELECT count(*)::int FROM misenorth_billing_invoices WHERE restaurant_id=$1) AS invoice_count,
      (SELECT count(*)::int FROM misenorth_billing_invoices WHERE restaurant_id=$1 AND status='paid') AS paid_invoice_count`,
    [user.restaurant_id]
   )
  ]);
  const a=account.rows[0]||null;
  const paying=Boolean(a&&a.subscription_status==="active"&&a.entitlement_status==="active"&&a.latest_invoice_status==="paid"&&a.current_period_end&&new Date(a.current_period_end).getTime()>Date.now());
  const mrrCents=paying&&a.billing_interval==="month"&&String(a.currency).toUpperCase()==="CAD"?Number(a.unit_amount_cents||0)*Number(a.quantity||1):0;
  const access=a?.entitlement_status==="grace"&&a.grace_until&&new Date(a.grace_until).getTime()>=Date.now();
  const finance=collections.rows[0]||{collected_cash_cents:0,recurring_line_cash_cents:0,one_time_line_cash_cents:0,paid_invoice_count:0};
  return json({
   configured:cfg.configured,
   checkoutEnabled:cfg.configured,
   mode:cfg.mode,
   configurationBlockers:cfg.reasons,
   account:a?{
    status:a.subscription_status,
    entitlement:access?"grace":a.entitlement_status,
    quantity:a.quantity,
    currency:a.currency,
    currentPeriodStart:a.current_period_start,
    currentPeriodEnd:a.current_period_end,
    cancelAtPeriodEnd:a.cancel_at_period_end,
    latestInvoiceStatus:a.latest_invoice_status,
    graceUntil:a.grace_until,
    lastVerifiedAt:a.last_verified_at
   }:null,
   mrrCents,
   mrrStatus:paying?"VERIFIED":"NOT_TRACKED",
   collectedStripeCashCents:Number(finance.collected_cash_cents||0),
   collectedStripeCashStatus:cfg.configured&&Number(finance.invoice_count||0)>0?"SOURCE_RECONCILED":"NOT_TRACKED",
   recurringInvoiceLineCashCents:Number(finance.recurring_line_cash_cents||0),
   onboardingInvoiceLineCashCents:Number(finance.one_time_line_cash_cents||0),
   paidInvoiceCount:Number(finance.paid_invoice_count||0),
   paymentFeesStatus:"NOT_TRACKED",
   invoices:invoices.rows
  });
 }catch(e){return fail(e);}
}
