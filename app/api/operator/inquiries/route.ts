import {requireOperator} from "../../../../lib/operator-auth";
import {fail,json} from "../../../../lib/api";
import {query} from "../../../../lib/db";
import {ensureGrowthSchema} from "../../../../lib/grader-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:Request){
 try{
  await requireOperator();await ensureGrowthSchema();
  const n=new URL(req.url).searchParams.get("page");
  const page=Math.max(0,Math.min(10000,Number.parseInt(n||"0",10)||0));
  const [list,counts]=await Promise.all([
   query<any>("SELECT i.id,i.created_at,i.name,i.email,i.restaurant_name,i.message,i.intent,i.status,i.operator_note,a.hostname AS audited_hostname,a.id AS audit_id FROM misenorth_growth_inquiries i LEFT JOIN misenorth_growth_audits a ON a.id=i.audit_id ORDER BY i.created_at DESC LIMIT 40 OFFSET $1",[page*40]),
   query<any>("SELECT count(*)::int AS total,count(*) FILTER(WHERE status='new')::int AS new_count,count(*) FILTER(WHERE intent='restaurant')::int AS restaurants,count(*) FILTER(WHERE intent='partner')::int AS partners,count(*) FILTER(WHERE intent='investor')::int AS investors FROM misenorth_growth_inquiries")
  ]);
  return json({ok:true,items:list.rows,counts:counts.rows[0],page});
 }catch(e){return fail(e);}
}
