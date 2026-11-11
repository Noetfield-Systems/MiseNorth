import type {Pool} from "pg";
import {createHash} from "node:crypto";
import fixtures from "../fixtures/demo-scenarios.json";

function stableId(key:string):string{
 const a=createHash("sha256").update("misenorth-demo:"+key).digest("hex").slice(0,32).split("");
 a[12]="4";a[16]=(Number.parseInt(a[16],16)&3|8).toString(16);const h=a.join("");
 return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);
}

export async function seedDemoWorkspaces(db:Pool):Promise<void>{
 const c=await db.connect();
 try{
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(hashtextextended('misenorth:demo-seed-v1',0))");
  for(const s of fixtures){
   const found=await c.query("SELECT id,is_demo FROM restaurants WHERE slug=$1",[s.slug]);
   if(found.rows[0]&&!found.rows[0].is_demo)throw new Error("Refusing to overwrite a non-demo restaurant using reserved demo slug: "+s.slug);
   const rid=found.rows[0]?.id||stableId("restaurant:"+s.slug);
   if(found.rows[0]){
    await c.query("UPDATE restaurants SET name=$1,description=$2,phone=$3,address=$4,city=$5,province=$6,brand_color=$7,tax_rate=$8,tax_rate_verified=true,accepting_orders=$9,accepting_reservations=$10,is_demo=true,updated_at=now() WHERE id=$11 AND is_demo=true",[s.name,s.description,s.phone,s.address,s.city,s.province,s.brandColor,s.taxRate,s.acceptingOrders,s.acceptingReservations,rid]);
   }else{
    await c.query("INSERT INTO restaurants(id,name,slug,description,phone,address,city,province,currency,timezone,tax_rate,tax_rate_verified,brand_color,accepting_orders,accepting_reservations,is_demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'CAD','America/Vancouver',$9,true,$10,$11,$12,true)",[rid,s.name,s.slug,s.description,s.phone,s.address,s.city,s.province,s.taxRate,s.brandColor,s.acceptingOrders,s.acceptingReservations]);
   }
   const owner=await c.query("SELECT id,restaurant_id FROM users WHERE lower(email)=$1",[s.ownerEmail.toLowerCase()]);
   if(owner.rows[0]&&owner.rows[0].restaurant_id!==rid)throw new Error("Demo owner email belongs to a different workspace: "+s.ownerEmail);
   const ownerId=owner.rows[0]?.id||stableId("owner:"+s.slug);
   if(owner.rows[0]){
    await c.query("UPDATE users SET name=$1,role='owner',active=true WHERE id=$2",[s.ownerName,ownerId]);
   }else{
    await c.query("INSERT INTO users(id,restaurant_id,name,email,password_hash,role,active) VALUES($1,$2,$3,$4,'DEMO_LOGIN_DISABLED','owner',true)",[ownerId,rid,s.ownerName,s.ownerEmail]);
   }

   const managerEmail="manager+"+s.slug+"@misenorth.demo.test";
   const existingManager=await c.query("SELECT id,restaurant_id FROM users WHERE lower(email)=$1",[managerEmail]);
   if(existingManager.rows[0]&&existingManager.rows[0].restaurant_id!==rid)throw new Error("Demo manager email belongs to a different workspace: "+managerEmail);
   const managerId=existingManager.rows[0]?.id||stableId("manager:"+s.slug);
   await c.query("INSERT INTO users(id,restaurant_id,name,email,password_hash,role,active) VALUES($1,$2,$3,$4,'DEMO_LOGIN_DISABLED','manager',true) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role='manager',active=true WHERE users.restaurant_id=EXCLUDED.restaurant_id",[managerId,rid,s.ownerName+" · Shift Manager",managerEmail]);

   const staffEmail="staff+"+s.slug+"@misenorth.demo.test";
   const existingStaff=await c.query("SELECT id,restaurant_id FROM users WHERE lower(email)=$1",[staffEmail]);
   if(existingStaff.rows[0]&&existingStaff.rows[0].restaurant_id!==rid)throw new Error("Demo staff email belongs to a different workspace: "+staffEmail);
   const staffId=existingStaff.rows[0]?.id||stableId("staff:"+s.slug);
   await c.query("INSERT INTO users(id,restaurant_id,name,email,password_hash,role,active) VALUES($1,$2,$3,$4,'DEMO_LOGIN_DISABLED','staff',true) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role='staff',active=true WHERE users.restaurant_id=EXCLUDED.restaurant_id",[staffId,rid,s.ownerName+" · Shift Staff",staffEmail]);

   const itemIds=new Map<string,string>();
   for(let ci=0;ci<s.categories.length;ci++){
    const cat=s.categories[ci],categoryId=stableId("category:"+s.slug+":"+cat.name);
    await c.query("INSERT INTO categories(id,restaurant_id,name,sort_order,active) VALUES($1,$2,$3,$4,true) ON CONFLICT(id) DO NOTHING",[categoryId,rid,cat.name,ci]);
    for(let ii=0;ii<cat.items.length;ii++){
     const item=cat.items[ii],itemId=stableId("item:"+s.slug+":"+item.name);
     itemIds.set(item.name,itemId);
     await c.query("INSERT INTO menu_items(id,restaurant_id,category_id,name,description,price_cents,available,sort_order) VALUES($1,$2,$3,$4,$5,$6,true,$7) ON CONFLICT(id) DO NOTHING",[itemId,rid,categoryId,item.name,item.description,Math.round(item.price*100),ii]);
    }
   }
   for(const table of s.tables){
    await c.query("INSERT INTO dining_tables(id,restaurant_id,label,capacity,active) VALUES($1,$2,$3,$4,true) ON CONFLICT(id) DO NOTHING",[stableId("table:"+s.slug+":"+table.label),rid,table.label,table.capacity]);
   }

   const guests=new Map<string,any>();
   for(const guest of s.guests){
    const guestId=stableId("guest:"+s.slug+":"+guest.email);guests.set(guest.email,{...guest,id:guestId});
    await c.query("INSERT INTO customers(id,restaurant_id,name,email,phone,marketing_consent,visit_count,lifetime_spend_cents,loyalty_points,last_visit_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()-make_interval(days=>$10::int)) ON CONFLICT(id) DO NOTHING",[guestId,rid,guest.name,guest.email,guest.phone,guest.marketing,guest.visits,guest.spend,guest.points,guest.daysAgo]);
    if(guest.marketing){
     await c.query("INSERT INTO customer_consent_events(id,restaurant_id,customer_id,channel,purpose,decision,source,evidence) VALUES($1,$2,$3,'email','marketing','granted','synthetic_demo_fixture',$4::jsonb) ON CONFLICT(id) DO NOTHING",[stableId("consent:"+s.slug+":"+guest.email+":grant"),rid,guestId,JSON.stringify({synthetic:true,fixture:"demo-scenarios.json"})]);
    }
    if(guest.points>0){
     await c.query("INSERT INTO loyalty_transactions(id,restaurant_id,customer_id,points,description) VALUES($1,$2,$3,$4,'DEMO fixture: sample opening loyalty balance') ON CONFLICT(id) DO NOTHING",[stableId("loyalty:"+s.slug+":"+guest.email),rid,guestId,guest.points]);
    }
   }

   for(const order of s.orders){
    const guest=guests.get(order.guest);if(!guest)throw new Error("Unknown demo guest in order "+order.number);
    const lines=(order.items as [string,number][]).map(([name,quantity])=>{
     const item=s.categories.flatMap((cat:any)=>cat.items).find((x:any)=>x.name===name);
     if(!item)throw new Error("Unknown demo menu item "+name);
     return {id:itemIds.get(name),name,price_cents:Math.round(item.price*100),quantity};
    });
    const subtotal=lines.reduce((sum:number,item:any)=>sum+item.price_cents*item.quantity,0),tax=Math.round(subtotal*s.taxRate);
    await c.query("INSERT INTO orders(id,restaurant_id,order_number,order_type,table_label,customer_name,customer_email,customer_phone,items_json,subtotal_cents,tax_cents,total_cents,tax_rate,status,payment_method,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now()-make_interval(mins=>$16::int),now()-make_interval(mins=>$16::int)) ON CONFLICT(id) DO NOTHING",[stableId("order:"+s.slug+":"+order.number),rid,order.number,order.type,(order as {table?:string}).table||null,guest.name,guest.email,guest.phone,JSON.stringify(lines),subtotal,tax,subtotal+tax,s.taxRate,order.status,order.type==="dine_in"?"pay_at_table":"pay_at_pickup",order.minutes]);
   }

   await c.query("UPDATE customers c SET order_request_count=counts.n,last_order_request_at=counts.latest FROM (SELECT lower(customer_email) AS email,count(*)::int AS n,max(created_at) AS latest FROM orders WHERE restaurant_id=$1 AND customer_email IS NOT NULL GROUP BY lower(customer_email)) counts WHERE c.restaurant_id=$1 AND lower(c.email)=counts.email",[rid]);

   for(const booking of s.reservations){
    const guest=guests.get(booking.guest);if(!guest)throw new Error("Unknown demo guest in booking "+booking.key);
    await c.query("INSERT INTO reservations(id,restaurant_id,guest_name,guest_email,guest_phone,party_size,reserved_for,duration_minutes,notes,status) VALUES($1,$2,$3,$4,$5,$6,now()+make_interval(days=>$7::int,hours=>$8::int),90,$9,$10) ON CONFLICT(id) DO NOTHING",[stableId("booking:"+s.slug+":"+booking.key),rid,guest.name,guest.email,guest.phone,booking.party,booking.days,booking.hour,booking.notes,booking.status]);
   }
   await c.query("INSERT INTO campaigns(id,restaurant_id,name,channel,audience,subject,body,status) VALUES($1,$2,$3,$4,'consented_guests',$5,$6,'draft') ON CONFLICT(id) DO NOTHING",[stableId("campaign:"+s.slug),rid,s.campaign.name,s.campaign.channel,s.campaign.subject,s.campaign.body]);
  }
  await c.query("COMMIT");
 }catch(error){await c.query("ROLLBACK");throw error;}finally{c.release();}
}
