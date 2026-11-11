import {requireOperator} from "../../../../lib/operator-auth";
import {fail,json} from "../../../../lib/api";
import {query} from "../../../../lib/db";
import {ensureCollaborationSchema} from "../../../../lib/collaboration-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:Request){
 try{
  await requireOperator();await ensureCollaborationSchema();
  const url=new URL(req.url);const status=url.searchParams.get("status")||"";
  const actor=url.searchParams.get("actor")||"";
  if(status&&!["applied","reviewing","shortlisted","declined"].includes(status))return json({error:"Invalid status"},400);
  if(actor&&!["human","agent"].includes(actor))return json({error:"Invalid actor"},400);
  const page=Math.min(1000,Math.max(0,parseInt(url.searchParams.get("page")||"0",10)||0));
  const [records,count]=await Promise.all([
    query<any>(`SELECT id,actor_type,applicant_name,contact_email,organization,profile_url,track,capability_summary,
      proposed_contribution,website,consent_to_contact,status,operator_note,created_at,updated_at
      FROM misenorth_collaboration_applications
      WHERE ($1='' OR status=$1) AND ($2='' OR actor_type=$2)
      ORDER BY created_at DESC LIMIT 30 OFFSET $3`,[status,actor,page*30]),
    query<any>(`SELECT count(*)::int AS total,
      count(*) FILTER(WHERE status='applied')::int AS new_count,
      count(*) FILTER(WHERE actor_type='human')::int AS human,
      count(*) FILTER(WHERE actor_type='agent')::int AS agent
      FROM misenorth_collaboration_applications`)
  ]);
  return json({ok:true,records:records.rows,counts:count.rows[0],page,pageSize:30});
 }catch(e){return fail(e);}
}
