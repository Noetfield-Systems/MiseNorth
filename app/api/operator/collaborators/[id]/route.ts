import {randomUUID} from "node:crypto";
import {z} from "zod";
import {body,fail,json,sameOrigin} from "../../../../../lib/api";
import {requireOperator} from "../../../../../lib/operator-auth";
import {ensureCollaborationSchema} from "../../../../../lib/collaboration-store";
import {pool} from "../../../../../lib/db";
export const runtime="nodejs";
const updateSchema=z.object({status:z.enum(["applied","reviewing","shortlisted","declined"]),note:z.string().max(2000)});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  sameOrigin(req);await requireOperator();await ensureCollaborationSchema();
  const {id}=await params;
  if(!z.uuid().safeParse(id).success)return json({error:"Invalid application ID"},400);
  const input=updateSchema.parse(await body(req));
  const client=await pool().connect();
  try{
   await client.query("BEGIN");
   const previous=await client.query<{status:string;operator_note:string}>(
    "SELECT status,operator_note FROM misenorth_collaboration_applications WHERE id=$1 FOR UPDATE",[id]);
   if(!previous.rowCount){await client.query("ROLLBACK");return json({error:"Application not found"},404);}
   const row=await client.query(
    `UPDATE misenorth_collaboration_applications SET status=$1,operator_note=$2,updated_at=now()
     WHERE id=$3 RETURNING id,status,operator_note,updated_at`,[input.status,input.note,id]);
   if(previous.rows[0].status!==input.status||previous.rows[0].operator_note!==input.note){
    await client.query(`INSERT INTO misenorth_collaboration_events(id,application_id,event_type,details)
      VALUES($1,$2,'application_reviewed',$3::jsonb)`,
      [randomUUID(),id,JSON.stringify({from:previous.rows[0].status,to:input.status,noteChanged:previous.rows[0].operator_note!==input.note})]);
   }
   await client.query("COMMIT");
   return json({ok:true,item:row.rows[0],authority:"no_agent_execution_authority_granted"});
  }catch(e){await client.query("ROLLBACK").catch(()=>{});throw e;}finally{client.release();}
 }catch(e){return fail(e);}
}
