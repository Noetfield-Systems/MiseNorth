import {randomUUID} from "node:crypto";
import {z} from "zod";
import {requireOperator} from "../../../../../lib/operator-auth";
import {body,fail,json,sameOrigin} from "../../../../../lib/api";
import {pool,query} from "../../../../../lib/db";
import {ensureOperatorGrowthSchema} from "../../../../../lib/growth-command";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const form=z.object({
  status:z.enum(["new","contacted","qualified","proposal","won","lost"]).optional(),
  note:z.string().max(3000).optional(),
  assignedTo:z.string().trim().max(120).optional(),
  followUpAt:z.union([z.iso.datetime({offset:true}),z.null()]).optional()
});
function validId(id:string){return z.uuid().safeParse(id).success;}
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  await requireOperator();await ensureOperatorGrowthSchema();
  const {id}=await params;if(!validId(id))return json({error:"Invalid inquiry identifier"},400);
  const [record,history]=await Promise.all([
    query<any>("SELECT * FROM misenorth_growth_inquiries WHERE id=$1",[id]),
    query<any>("SELECT id,event_type,actor,details,created_at FROM misenorth_growth_activity WHERE inquiry_id=$1 ORDER BY created_at DESC LIMIT 40",[id])
  ]);
  if(!record.rowCount)return json({error:"Inquiry not found"},404);
  return json({ok:true,item:record.rows[0],history:history.rows});
 }catch(e){return fail(e);}
}
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  sameOrigin(req);await requireOperator();await ensureOperatorGrowthSchema();
  const {id}=await params;if(!validId(id))return json({error:"Invalid inquiry identifier"},400);
  const d=form.parse(await body(req));
  if(Object.values(d).every(value=>value===undefined))return json({error:"No updates supplied"},400);
  const client=await pool().connect();
  try{
   await client.query("BEGIN");
   const current=await client.query<any>("SELECT id,status,operator_note,follow_up_at,assigned_to,contacted_at FROM misenorth_growth_inquiries WHERE id=$1 FOR UPDATE",[id]);
   if(!current.rowCount){await client.query("ROLLBACK");return json({error:"Inquiry not found"},404);}
   const before=current.rows[0];
   const nextStatus=d.status??before.status, nextNote=d.note??before.operator_note,
         nextAssigned=d.assignedTo??before.assigned_to,
         nextFollow=d.followUpAt===undefined?before.follow_up_at:d.followUpAt;
   const contacted=before.contacted_at||(nextStatus!=="new"&&nextStatus!=="lost"?new Date():null);
   const updated=await client.query<any>(`UPDATE misenorth_growth_inquiries
    SET status=$1,operator_note=$2,assigned_to=$3,follow_up_at=$4,contacted_at=$5
    WHERE id=$6 RETURNING id,status,operator_note,assigned_to,follow_up_at,contacted_at`,
    [nextStatus,nextNote,nextAssigned,nextFollow,contacted,id]);
   const details:Record<string,unknown>={};
   if(before.status!==nextStatus){details.statusFrom=before.status;details.statusTo=nextStatus;}
   if(before.operator_note!==nextNote)details.noteChanged=true;
   if(before.assigned_to!==nextAssigned)details.assignmentChanged=true;
   if(String(before.follow_up_at||"")!==String(nextFollow||""))details.followUpChanged=true;
   if(Object.keys(details).length)await client.query(
    "INSERT INTO misenorth_growth_activity(id,inquiry_id,event_type,actor,details) VALUES($1,$2,$3,$4,$5::jsonb)",
    [randomUUID(),id,"opportunity_updated","operator",JSON.stringify(details)]
   );
   await client.query("COMMIT");
   return json({ok:true,item:updated.rows[0]});
  }catch(error){await client.query("ROLLBACK").catch(()=>{});throw error;}finally{client.release();}
 }catch(e){return fail(e);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  sameOrigin(req);await requireOperator();await ensureOperatorGrowthSchema();
  const {id}=await params;if(!validId(id))return json({error:"Invalid inquiry identifier"},400);
  const r=await query("DELETE FROM misenorth_growth_inquiries WHERE id=$1",[id]);
  return r.rowCount?json({ok:true,deleted:true}):json({error:"Inquiry not found"},404);
 }catch(e){return fail(e);}
}
