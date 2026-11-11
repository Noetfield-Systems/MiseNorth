import {z} from "zod";
import {requireOperator} from "../../../../../lib/operator-auth";
import {body,fail,json,sameOrigin} from "../../../../../lib/api";
import {query} from "../../../../../lib/db";
import {ensureGrowthSchema} from "../../../../../lib/grader-store";
export const runtime="nodejs";
const form=z.object({status:z.enum(["new","contacted","qualified","won","lost"]),note:z.string().max(3000)});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{sameOrigin(req);await requireOperator();await ensureGrowthSchema();
  const {id}=await params;if(!z.uuid().safeParse(id).success)return json({error:"Invalid inquiry identifier"},400);
  const d=form.parse(await body(req));
  const r=await query<any>("UPDATE misenorth_growth_inquiries SET status=$1,operator_note=$2 WHERE id=$3 RETURNING id,status,operator_note",[d.status,d.note,id]);
  return r.rowCount?json({ok:true,item:r.rows[0]}):json({error:"Inquiry not found"},404);
 }catch(e){return fail(e);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
 try{sameOrigin(req);await requireOperator();await ensureGrowthSchema();
  const {id}=await params;if(!z.uuid().safeParse(id).success)return json({error:"Invalid inquiry identifier"},400);
  const r=await query("DELETE FROM misenorth_growth_inquiries WHERE id=$1",[id]);
  return r.rowCount?json({ok:true,deleted:true}):json({error:"Inquiry not found"},404);
 }catch(e){return fail(e);}
}
