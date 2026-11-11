import {z} from "zod";
import {requireUser,canManage,canOperate} from "../../../../lib/auth";
import {query,audit} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";
import {ORDER_TRANSITIONS,RESERVATION_TRANSITIONS,canTransition} from "../../../../lib/workflow-rules.mjs";
export const runtime="nodejs";
export async function PATCH(req:Request,ctx:{params:Promise<{resource:string;id:string}>}){
 try{
  sameOrigin(req);const {resource,id}=await ctx.params,d:any=await body(req),u=await requireUser();if((resource==="orders"||resource==="reservations")?!canOperate(u):!canManage(u))throw new Error("FORBIDDEN");const rid=u.restaurant_id;
  if(resource==="orders"){
   const next=z.enum(["new","accepted","preparing","ready","completed","cancelled"]).parse(d.status);
   const current=await query<any>("SELECT status FROM orders WHERE id=$1 AND restaurant_id=$2",[id,rid]);if(!current.rows[0])throw new Error("NOT_FOUND");
   const previous=current.rows[0].status;if(previous===next)return json({ok:true,item:{id,status:next},unchanged:true});
   if(u.role==="staff"&&!({new:["accepted"],accepted:["preparing"],preparing:["ready"],ready:["completed"]} as Record<string,string[]>)[previous]?.includes(next))throw new Error("FORBIDDEN");
   if(!canTransition(previous,next,ORDER_TRANSITIONS))throw new Error("CONFLICT");
   const r=await query<any>("UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 AND restaurant_id=$3 AND status=$4 RETURNING id,status",[next,id,rid,previous]);if(!r.rowCount)throw new Error("CONFLICT");
   await audit(rid,u.id,"order.status_changed","order",id,{from:previous,to:next});return json({ok:true,item:r.rows[0]});
  }
  if(resource==="reservations"){
   const next=z.enum(["requested","confirmed","seated","completed","cancelled","no_show"]).parse(d.status);
   const current=await query<any>("SELECT status FROM reservations WHERE id=$1 AND restaurant_id=$2",[id,rid]);if(!current.rows[0])throw new Error("NOT_FOUND");
   const previous=current.rows[0].status;if(previous===next)return json({ok:true,item:{id,status:next},unchanged:true});
   if(u.role==="staff"&&!({requested:["confirmed"],confirmed:["seated"],seated:["completed"]} as Record<string,string[]>)[previous]?.includes(next))throw new Error("FORBIDDEN");
   if(!canTransition(previous,next,RESERVATION_TRANSITIONS))throw new Error("CONFLICT");
   const r=await query<any>("UPDATE reservations SET status=$1,updated_at=now() WHERE id=$2 AND restaurant_id=$3 AND status=$4 RETURNING id,status",[next,id,rid,previous]);if(!r.rowCount)throw new Error("CONFLICT");
   await audit(rid,u.id,"reservation.status_changed","reservation",id,{from:previous,to:next});return json({ok:true,item:r.rows[0]});
  }
  if(resource==="menu"){const available=z.boolean().parse(d.available);const r=await query<any>("UPDATE menu_items SET available=$1,updated_at=now() WHERE id=$2 AND restaurant_id=$3 RETURNING id,available",[available,id,rid]);if(!r.rowCount)throw new Error("NOT_FOUND");await audit(rid,u.id,"menu.availability_changed","menu_item",id,{available});return json({ok:true,item:r.rows[0]});}
  if(resource==="tables"){const active=z.boolean().parse(d.active);const r=await query<any>("UPDATE dining_tables SET active=$1 WHERE id=$2 AND restaurant_id=$3 RETURNING id,active",[active,id,rid]);if(!r.rowCount)throw new Error("NOT_FOUND");await audit(rid,u.id,"table.active_changed","table",id,{active});return json({ok:true,item:r.rows[0]});}
  return json({error:"Unknown resource"},404);
 }catch(e){return fail(e);}
}
