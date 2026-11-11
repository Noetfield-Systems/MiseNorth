import {json,fail} from "../../../../../lib/api";
import {readAudit} from "../../../../../lib/grader-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(id))return json({error:"Invalid report identifier"},400);
  const record=await readAudit(id);
  if(!record)return json({error:"Report not found"},404);
  return json({ok:true,id,report:record.report});
 }catch(error){return fail(error);}
}
