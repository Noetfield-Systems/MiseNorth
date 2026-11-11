import {requireUser} from "../../../../lib/auth";
import {query,audit} from "../../../../lib/db";
import {fail,json,sameOrigin} from "../../../../lib/api";
import {enforceRateLimit} from "../../../../lib/rate-limit";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:Request){
 try{
  const user=await requireUser();
  if(user.role!=="owner")throw new Error("FORBIDDEN");
  await enforceRateLimit(req,"privacy.export",3,3600,user.restaurant_id);
  const [restaurant,users,customers,categories,menuItems,tables,orders,reservations,consent,loyalty,campaigns,reviews,integrations,auditEvents,tickets,requests,billingAccount,invoices,invoiceLines]=await Promise.all([
   query<any>("SELECT id,name,slug,currency,timezone,tax_rate,tax_rate_verified,phone,email,address,city,province,postal_code,website,description,created_at FROM restaurants WHERE id=$1",[user.restaurant_id]),
   query<any>("SELECT id,name,email,email_verified,role,active,created_at FROM users WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,name,email,phone,marketing_consent,order_request_count,last_order_request_at,created_at FROM customers WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,name,sort_order,active,created_at FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,name",[user.restaurant_id]),
   query<any>("SELECT id,category_id,name,description,price_cents,image_url,allergens,dietary_tags,available,featured,sort_order,created_at,updated_at FROM menu_items WHERE restaurant_id=$1 ORDER BY sort_order,name",[user.restaurant_id]),
   query<any>("SELECT id,label,capacity,active,created_at FROM dining_tables WHERE restaurant_id=$1 ORDER BY label",[user.restaurant_id]),
   query<any>("SELECT id,order_number,order_type,table_label,customer_name,customer_email,customer_phone,items_json,subtotal_cents,tax_cents,total_cents,tax_rate,status,payment_status,created_at FROM orders WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,guest_name,guest_email,guest_phone,party_size,reserved_for,duration_minutes,notes,status,created_at FROM reservations WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT e.customer_id,e.channel,e.purpose,e.decision,e.source,e.evidence,e.created_at FROM customer_consent_events e WHERE e.restaurant_id=$1 ORDER BY e.created_at",[user.restaurant_id]),
   query<any>("SELECT customer_id,order_id,points,description,created_at FROM loyalty_transactions WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,name,channel,audience,subject,body,status,scheduled_at,created_at FROM campaigns WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,order_id,guest_name,rating,body,published,created_at FROM reviews WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT provider,status,external_account_id,last_verified_at,created_at,updated_at FROM integration_connections WHERE restaurant_id=$1 ORDER BY provider",[user.restaurant_id]),
   query<any>("SELECT action,entity_type,entity_id,details,created_at FROM audit_events WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,subject,category,severity,status,description,assigned_department,created_at,updated_at FROM support_tickets WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT id,request_type,subject,details,status,outcome_summary,created_at,updated_at,completed_at FROM privacy_requests WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT stripe_customer_id,stripe_subscription_id,stripe_price_id,quantity,unit_amount_cents,currency,billing_interval,subscription_status,entitlement_status,grace_until,current_period_start,current_period_end,cancel_at_period_end,latest_invoice_id,latest_invoice_status,last_verified_at FROM misenorth_billing_accounts WHERE restaurant_id=$1",[user.restaurant_id]),
   query<any>("SELECT stripe_invoice_id,stripe_subscription_id,amount_due_cents,amount_paid_cents,currency,status,billing_reason,hosted_invoice_url,invoice_pdf_url,period_start,period_end,paid_at,created_at FROM misenorth_billing_invoices WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id]),
   query<any>("SELECT stripe_invoice_line_id,stripe_invoice_id,stripe_price_id,stripe_product_id,description,quantity,amount_cents,currency,line_type,recurring_interval,created_at FROM misenorth_billing_invoice_lines WHERE restaurant_id=$1 ORDER BY created_at",[user.restaurant_id])
  ]);
  await audit(user.restaurant_id,user.id,"privacy.data_export_created","restaurant_data_export",user.restaurant_id,{format:"json",collections:19});
  return json({
   export_version:"1.0",
   generated_at:new Date().toISOString(),
   notice:"This export contains personal, business, operational and billing records. Store and transfer it securely. Password hashes, raw session tokens, API credentials, Stripe secret keys and payment-card details are never included.",
   restaurant:restaurant.rows[0]||null,
   users:users.rows,
   customers:customers.rows,
   categories:categories.rows,
   menu_items:menuItems.rows,
   tables:tables.rows,
   orders:orders.rows,
   reservations:reservations.rows,
   consent_events:consent.rows,
   loyalty_transactions:loyalty.rows,
   campaigns:campaigns.rows,
   reviews:reviews.rows,
   integration_connections:integrations.rows,
   audit_events:auditEvents.rows,
   support_tickets:tickets.rows,
   privacy_requests:requests.rows,
   subscription:billingAccount.rows[0]||null,
   invoices:invoices.rows,
   invoice_lines:invoiceLines.rows
  });
 }catch(e){return fail(e);}
}
