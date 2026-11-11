import {z} from "zod";
import {createHash,randomBytes} from "node:crypto";
import {requireUser,canManage} from "../../../lib/auth";
import {pool,query,uid,audit} from "../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {canFitReservation} from "../../../lib/workflow-rules.mjs";
import {canAcceptOrdersWithTax} from "../../../lib/tax-policy.mjs";
import {enforceRateLimit} from "../../../lib/rate-limit";
export const runtime="nodejs";export const dynamic="force-dynamic";
const providers=[
 {provider:"square",label:"Square POS",description:"POS orders, menu synchronisation and sales reconciliation.",requirement:"Square developer application, merchant OAuth and signed webhooks."},
 {provider:"clover",label:"Clover POS",description:"Point-of-sale orders and catalogue sync.",requirement:"Clover app credentials, merchant authorization and webhooks."},
 {provider:"lightspeed",label:"Lightspeed Restaurant",description:"Connect the restaurant's Lightspeed venue.",requirement:"Lightspeed developer access and venue OAuth scopes."},
 {provider:"stripe_connect",label:"Stripe Connect",description:"Online cards and connected-merchant settlement.",requirement:"Platform registration, merchant onboarding and live webhook verification."},
 {provider:"doordash",label:"DoorDash",description:"Delivery marketplace and delivery dispatch.",requirement:"Approved DoorDash integration and merchant credentials."},
 {provider:"uber_direct",label:"Uber Direct",description:"On-demand delivery for direct orders.",requirement:"Uber Direct commercial access, API keys and webhooks."},
 {provider:"resend",label:"Resend email",description:"Order and booking confirmations plus campaigns.",requirement:"Verified sender domain and Resend API key."},
 {provider:"twilio",label:"Twilio SMS",description:"Guest notifications by SMS.",requirement:"Twilio account, sender number and compliance setup."}
];
export async function GET(req:Request,ctx:{params:Promise<{resource:string}>}){try{
 const {resource}=await ctx.params;const url=new URL(req.url);
 if(resource==="menu"&&url.searchParams.get("slug")){
  const slug=url.searchParams.get("slug")!;
  await enforceRateLimit(req,"public.menu",300,300,slug);
  const rr=await query<any>("SELECT id,name,slug,description,phone,address,city,province,brand_color,accepting_orders,accepting_reservations,tax_rate,tax_rate_verified,is_demo FROM restaurants WHERE slug=$1",[slug]);
  if(!rr.rows[0])throw new Error("NOT_FOUND");const r=rr.rows[0];
  const [cats,items]=await Promise.all([
   query<any>("SELECT id,name,sort_order FROM categories WHERE restaurant_id=$1 AND active=true ORDER BY sort_order,name",[r.id]),
   query<any>("SELECT m.id,m.name,m.description,m.price_cents,m.category_id,m.image_url,m.allergens,m.dietary_tags,c.name AS category_name FROM menu_items m LEFT JOIN categories c ON c.id=m.category_id WHERE m.restaurant_id=$1 AND m.available=true ORDER BY m.sort_order,m.name",[r.id])
  ]);
  return json({restaurant:r,categories:cats.rows,items:items.rows});
 }
 const u=await requireUser();const rid=u.restaurant_id;
 if(u.role==="staff"&&["guests","campaigns","integrations","settings","reviews","insights"].includes(resource))throw new Error("FORBIDDEN");
 if(resource==="menu"){const r=await query<any>("SELECT m.*,c.name AS category_name FROM menu_items m LEFT JOIN categories c ON c.id=m.category_id WHERE m.restaurant_id=$1 ORDER BY c.sort_order,m.sort_order,m.name",[rid]);return json({items:r.rows});}
 if(resource==="orders"){const r=await query<any>("SELECT * FROM orders WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 200",[rid]);return json({items:r.rows});}
 if(resource==="reservations"){const r=await query<any>("SELECT * FROM reservations WHERE restaurant_id=$1 ORDER BY reserved_for DESC LIMIT 200",[rid]);return json({items:r.rows});}
 if(resource==="guests"){const r=await query<any>("SELECT * FROM customers WHERE restaurant_id=$1 ORDER BY last_visit_at DESC NULLS LAST LIMIT 500",[rid]);return json({items:r.rows});}
 if(resource==="tables"){const r=await query<any>("SELECT * FROM dining_tables WHERE restaurant_id=$1 ORDER BY label",[rid]);return json({items:r.rows});}
 if(resource==="campaigns"){const r=await query<any>("SELECT * FROM campaigns WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 100",[rid]);return json({items:r.rows});}
 if(resource==="reviews"){const r=await query<any>("SELECT id,guest_name,rating,body,published,created_at FROM reviews WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 100",[rid]);return json({items:r.rows});}
 if(resource==="integrations"){const saved=await query<any>("SELECT provider,status,external_account_id,last_verified_at FROM integration_connections WHERE restaurant_id=$1",[rid]);const map=new Map(saved.rows.map((x:any)=>[x.provider,x]));return json({items:providers.map(p=>({...p,...(map.get(p.provider)||{}),status:map.get(p.provider)?.status||"not_connected"}))});}
 if(resource==="settings"){const r=await query<any>("SELECT id,name,slug,currency,timezone,tax_rate,tax_rate_verified,phone,email,address,city,province,postal_code,website,description,brand_color,accepting_orders,accepting_reservations FROM restaurants WHERE id=$1",[rid]);return json({settings:r.rows[0]});}
 if(resource==="overview"){
  const [sales,open,pending,recent,bookingCount,items,guests,ic]=await Promise.all([
   query<any>("SELECT COALESCE(sum(total_cents) FILTER (WHERE status<>'cancelled'),0)::bigint AS request_value,(count(*) FILTER (WHERE status<>'cancelled'))::int AS n FROM orders WHERE restaurant_id=$1",[rid]),
   query<any>("SELECT count(*)::int AS n FROM orders WHERE restaurant_id=$1 AND status IN ('new','accepted','preparing','ready')",[rid]),
   query<any>("SELECT id,guest_name,party_size,reserved_for FROM reservations WHERE restaurant_id=$1 AND status='requested' AND reserved_for>now() ORDER BY reserved_for LIMIT 5",[rid]),
   query<any>("SELECT id,order_number,customer_name,total_cents,status,created_at FROM orders WHERE restaurant_id=$1 ORDER BY created_at DESC LIMIT 8",[rid]),
   query<any>("SELECT count(*)::int AS n FROM reservations WHERE restaurant_id=$1 AND reserved_for>now() AND status IN ('requested','confirmed')",[rid]),
   query<any>("SELECT count(*)::int AS n FROM menu_items WHERE restaurant_id=$1 AND available=true",[rid]),
   query<any>("SELECT count(*)::int AS n FROM customers WHERE restaurant_id=$1",[rid]),
   query<any>("SELECT provider,status FROM integration_connections WHERE restaurant_id=$1",[rid])
  ]);
  const state=new Map(ic.rows.map((x:any)=>[x.provider,x.status]));
  return json({orderRequestValueCents:Number(sales.rows[0].request_value),foodPaymentsStatus:"NOT_TRACKED",orderCount:sales.rows[0].n,openOrders:open.rows[0].n,pendingReservations:pending.rows,recentOrders:recent.rows,upcomingReservations:bookingCount.rows[0].n,guestCount:guests.rows[0].n,readiness:[
   {name:"Website & digital menu",connected:items.rows[0].n>0,detail:items.rows[0].n+" published menu items"},
   {name:"Direct order intake",connected:true,detail:"Guest order requests are stored in the owner queue"},
   {name:"Reservations",connected:true,detail:bookingCount.rows[0].n+" upcoming pending or confirmed"},
   {name:"POS synchronisation",connected:["square","clover","lightspeed"].some(k=>state.get(k)==="connected"),detail:"Merchant OAuth and webhook approval required"},
   {name:"Online card payments",connected:state.get("stripe_connect")==="connected",detail:"Stripe Connect merchant onboarding required"},
   {name:"Guest messaging",connected:state.get("resend")==="connected"||state.get("twilio")==="connected",detail:guests.rows[0].n+" guest profiles; sender connection required"}
  ]});
 }
 if(resource==="insights"){
  const [top,hour,repeat]=await Promise.all([
   query<any>("SELECT item->>'name' AS name,sum((item->>'quantity')::int)::int AS units FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items_json) item WHERE o.restaurant_id=$1 AND o.status<>'cancelled' GROUP BY item->>'name' ORDER BY units DESC LIMIT 5",[rid]),
   query<any>("SELECT extract(hour from created_at AT TIME ZONE 'America/Vancouver')::int AS hour,count(*)::int AS orders FROM orders WHERE restaurant_id=$1 GROUP BY 1 ORDER BY orders DESC LIMIT 1",[rid]),
   query<any>("SELECT count(*)::int AS n FROM customers WHERE restaurant_id=$1 AND order_request_count>1",[rid])
  ]);
  return json({topItems:top.rows,busiestHour:hour.rows[0]||null,repeatRequestGuests:repeat.rows[0].n,notes:["Item and time patterns reflect recorded order requests, not collected sales.","Paid visits and guest payments are NOT_TRACKED; no forecasts are inferred without sufficient history."]});
 }
 return json({error:"Unknown resource"},404);
 }catch(e){return fail(e);}}
export async function POST(req:Request,ctx:{params:Promise<{resource:string}>}){try{
 sameOrigin(req);const {resource}=await ctx.params;const d:any=await body(req);
 if(resource==="orders"){
  const slug=z.string().min(2).max(80).parse(d.slug);await enforceRateLimit(req,"guest.order",25,3600,slug);
  const name=z.string().trim().min(2).max(100).parse(d.customerName);
  const email=d.email?z.string().email().max(180).parse(d.email).toLowerCase():null,phone=d.phone?z.string().max(40).parse(d.phone):null;
  const marketingConsent=z.boolean().optional().default(false).parse(d.marketingConsent);
  if(!email&&!phone)throw new Error("VALIDATION:Provide an email or phone number");
  if(marketingConsent&&!email)throw new Error("VALIDATION:An email address is required for email marketing consent");
  const type=z.enum(["pickup","dine_in"]).parse(d.orderType||"pickup");
  const list=z.array(z.object({itemId:z.string().uuid(),quantity:z.number().int().min(1).max(20)})).min(1).max(30).parse(d.items);
  const rr=await query<any>("SELECT id,tax_rate,tax_rate_verified,accepting_orders,is_demo FROM restaurants WHERE slug=$1",[slug]);if(!rr.rows[0])throw new Error("NOT_FOUND");const r=rr.rows[0];if(!canAcceptOrdersWithTax(r))throw new Error("VALIDATION:Restaurant tax settings must be verified by the owner before accepting order requests");if(!r.accepting_orders)throw new Error("VALIDATION:Online ordering is paused");
  const ids=list.map((x:any)=>x.itemId);const menu=await query<any>("SELECT id,name,price_cents FROM menu_items WHERE restaurant_id=$1 AND available=true AND id=ANY($2::uuid[])",[r.id,ids]);if(menu.rows.length!==new Set(ids).size||menu.rows.length!==ids.length)throw new Error("VALIDATION:One or more menu items are unavailable");
  const byId:Record<string,any>={};menu.rows.forEach((x:any)=>{byId[x.id]=x;});const items=list.map((x:any)=>{const m=byId[x.itemId];return {id:m.id,name:m.name,price_cents:m.price_cents,quantity:x.quantity};});
  const subtotal=items.reduce((s:number,x:any)=>s+x.price_cents*x.quantity,0),rate=Number(r.tax_rate),tax=Math.round(subtotal*rate),total=subtotal+tax,id=uid(),orderNo=id.replace(/-/g,"").slice(0,7).toUpperCase();
  let unsubscribeUrl:string|undefined;
  const client=await pool().connect();try{
   await client.query("BEGIN");
   await client.query("INSERT INTO orders(id,restaurant_id,order_number,order_type,table_label,customer_name,customer_email,customer_phone,items_json,subtotal_cents,tax_cents,total_cents,tax_rate,status,payment_method,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new',$14,$15)",[id,r.id,orderNo,type,d.tableLabel||null,name,email,phone,JSON.stringify(items),subtotal,tax,total,rate,type==="dine_in"?"pay_at_table":"pay_at_pickup",String(d.notes||"").slice(0,1000)]);
   if(email){
    const customer=await client.query<any>(
     "INSERT INTO customers(id,restaurant_id,name,email,phone,marketing_consent,order_request_count,last_order_request_at) VALUES($1,$2,$3,$4,$5,false,1,now()) ON CONFLICT(restaurant_id,email) DO UPDATE SET name=EXCLUDED.name,phone=COALESCE(EXCLUDED.phone,customers.phone),order_request_count=customers.order_request_count+1,last_order_request_at=now() RETURNING id,marketing_consent",
     [uid(),r.id,name,email,phone]
    );
    const customerId=customer.rows[0].id;
    if(marketingConsent&&!customer.rows[0].marketing_consent){
     await client.query("UPDATE customers SET marketing_consent=true WHERE id=$1 AND restaurant_id=$2",[customerId,r.id]);
     await client.query(
      "INSERT INTO customer_consent_events(id,restaurant_id,customer_id,channel,purpose,decision,source,evidence) VALUES($1,$2,$3,'email','marketing','granted','guest_order_request',$4::jsonb)",
      [uid(),r.id,customerId,JSON.stringify({form:"guest-order-marketing-v1",explicit_checkbox:true,synthetic_workspace:Boolean(r.is_demo)})]
     );
    }
    if(marketingConsent){
     const rawToken=randomBytes(32).toString("base64url");
     const tokenHash=createHash("sha256").update(rawToken).digest("hex");
     await client.query(
      "INSERT INTO customer_unsubscribe_tokens(token_hash,restaurant_id,customer_id) VALUES($1,$2,$3)",
      [tokenHash,r.id,customerId]
     );
     unsubscribeUrl="/unsubscribe#token="+encodeURIComponent(rawToken);
    }
   }
   await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
  return json({ok:true,order:{id,order_number:orderNo,total_cents:total,status:"new"},...(unsubscribeUrl?{unsubscribeUrl}:{})},201);
 }
 if(resource==="reservations"){
  const slug=z.string().min(2).max(80).parse(d.slug);await enforceRateLimit(req,"guest.reservation",12,3600,slug);
  const guest=z.string().trim().min(2).max(100).parse(d.guestName),email=d.email?z.string().email().max(180).parse(d.email).toLowerCase():null,phone=d.phone?z.string().max(40).parse(d.phone):null;
  if(!email&&!phone)throw new Error("VALIDATION:Provide an email or phone number");
  const party=z.number().int().min(1).max(30).parse(d.partySize),when=new Date(d.reservedFor);
  if(!Number.isFinite(when.getTime())||when.getTime()<Date.now()+30*60*1000)throw new Error("VALIDATION:Choose a future time at least 30 minutes from now");
  const rr=await query<any>("SELECT id,accepting_reservations FROM restaurants WHERE slug=$1",[slug]);if(!rr.rows[0])throw new Error("NOT_FOUND");if(!rr.rows[0].accepting_reservations)throw new Error("VALIDATION:Reservations are paused");
  const client=await pool().connect();
  let configuredSeats=0;
  const id=uid();
  try{
   await client.query("BEGIN");
   await client.query("SELECT pg_advisory_xact_lock(hashtextextended('misenorth:reservation:'||$1::text,0))",[rr.rows[0].id]);
   const capacity=await client.query<any>("SELECT COALESCE(sum(capacity),0)::int AS n FROM dining_tables WHERE restaurant_id=$1 AND active=true",[rr.rows[0].id]);
   const booked=await client.query<any>("SELECT COALESCE(sum(party_size),0)::int AS n FROM reservations WHERE restaurant_id=$1 AND reserved_for < $2::timestamptz+interval '90 minutes' AND reserved_for+make_interval(mins=>duration_minutes)>$2::timestamptz AND status IN ('requested','confirmed','seated')",[rr.rows[0].id,when.toISOString()]);
   configuredSeats=Number(capacity.rows[0]?.n||0);
   const bookedCovers=Number(booked.rows[0]?.n||0);
   if(!canFitReservation(configuredSeats,bookedCovers,party,20))throw new Error("CONFLICT");
   await client.query("INSERT INTO reservations(id,restaurant_id,guest_name,guest_email,guest_phone,party_size,reserved_for,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,rr.rows[0].id,guest,email,phone,party,when.toISOString(),String(d.notes||"").slice(0,1000)]);
   if(email)await client.query("INSERT INTO customers(id,restaurant_id,name,email,phone) VALUES($1,$2,$3,$4,$5) ON CONFLICT(restaurant_id,email) DO UPDATE SET name=EXCLUDED.name,phone=COALESCE(EXCLUDED.phone,customers.phone)",[uid(),rr.rows[0].id,guest,email,phone]);
   await client.query("COMMIT");
  }catch(e){
   try{await client.query("ROLLBACK");}catch{}
   throw e;
  }finally{client.release();}
  return json({ok:true,reservation:{id,status:"requested"},capacityMode:configuredSeats>0?"configured":"soft_limit"},201);
 }
 const u=await requireUser();if(!canManage(u))throw new Error("FORBIDDEN");const rid=u.restaurant_id;
 if(resource==="menu"){
  if(d.kind==="category"){const name=z.string().trim().min(2).max(80).parse(d.name),id=uid();await query("INSERT INTO categories(id,restaurant_id,name,sort_order) VALUES($1,$2,$3,COALESCE((SELECT max(sort_order)+1 FROM categories WHERE restaurant_id=$2),0))",[id,rid,name]);await audit(rid,u.id,"menu.category_created","category",id);return json({ok:true,id},201);}
  const name=z.string().trim().min(2).max(120).parse(d.name),price=Number(d.price);if(!Number.isFinite(price)||price<0||price>100000)throw new Error("VALIDATION:Enter a valid CAD price");let cat=null;
  if(d.category){const c=await query<any>("INSERT INTO categories(id,restaurant_id,name) VALUES($1,$2,$3) ON CONFLICT(restaurant_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id",[uid(),rid,String(d.category).trim().slice(0,80)]);cat=c.rows[0].id;}
  const id=uid();await query("INSERT INTO menu_items(id,restaurant_id,category_id,name,description,price_cents,image_url) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,rid,cat,name,String(d.description||"").slice(0,1000),Math.round(price*100),d.image_url||null]);await audit(rid,u.id,"menu.item_created","menu_item",id);return json({ok:true,id},201);
 }
 if(resource==="tables"){const label=z.string().trim().min(1).max(40).parse(d.label),capacity=z.number().int().min(1).max(30).parse(Number(d.capacity||2)),id=uid();await query("INSERT INTO dining_tables(id,restaurant_id,label,capacity) VALUES($1,$2,$3,$4)",[id,rid,label,capacity]);await audit(rid,u.id,"table.created","table",id);return json({ok:true,id},201);}
 if(resource==="campaigns"){const name=z.string().trim().min(2).max(100).parse(d.name),message=z.string().trim().min(4).max(5000).parse(d.body),channel=z.enum(["email","sms","in_store"]).parse(d.channel||"email"),id=uid();await query("INSERT INTO campaigns(id,restaurant_id,name,channel,audience,subject,body,status) VALUES($1,$2,$3,$4,$5,$6,$7,'draft')",[id,rid,name,channel,String(d.audience||"consented_guests"),String(d.subject||"").slice(0,180),message]);await audit(rid,u.id,"campaign.draft_created","campaign",id);return json({ok:true,id,status:"draft"},201);}
 return json({error:"Unknown resource"},404);
 }catch(e){return fail(e);}}
