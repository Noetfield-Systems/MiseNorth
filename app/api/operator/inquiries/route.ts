import {requireOperator} from "../../../../lib/operator-auth";
import {fail,json} from "../../../../lib/api";
import {query} from "../../../../lib/db";
import {ensureOperatorGrowthSchema} from "../../../../lib/growth-command";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const statuses=new Set(["new","contacted","qualified","proposal","won","lost"]);
export async function GET(req:Request){
 try{
  await requireOperator();
  await ensureOperatorGrowthSchema();
  const params=new URL(req.url).searchParams;
  const page=Math.max(0,Math.min(10000,Number.parseInt(params.get("page")||"0",10)||0));
  const q=(params.get("q")||"").trim().slice(0,160);
  const status=params.get("status")||"";
  const intent=params.get("intent")||"";
  const source=(params.get("source")||"").trim().slice(0,60);
  const due=params.get("due")||"";
  const sort=params.get("sort")==="oldest"?"ASC":"DESC";
  if(status&&!statuses.has(status))return json({error:"Invalid status filter"},400);
  if(intent&&!["restaurant","partner","investor"].includes(intent))return json({error:"Invalid intent filter"},400);
  const where:string[]=[],values:any[]=[];
  function add(sql:string,val:unknown){values.push(val);where.push(sql.replace("?", "$"+values.length));}
  if(q){const start=values.length;const term="%"+q.replace(/[\\%_]/g,"\\$&")+"%";for(let n=0;n<4;n++)values.push(term);
    where.push(`(i.name ILIKE $${start+1} ESCAPE '\\' OR i.email ILIKE $${start+2} ESCAPE '\\' OR i.restaurant_name ILIKE $${start+3} ESCAPE '\\' OR i.restaurant_website ILIKE $${start+4} ESCAPE '\\')`);
  }
  if(status)add("i.status=?",status);
  if(intent)add("i.intent=?",intent);
  if(source)add("i.source=?",source);
  if(due==="overdue")where.push("i.follow_up_at < now() AND i.status NOT IN ('lost','won')");
  const clause=where.length?"WHERE "+where.join(" AND "):"";
  const select=`FROM misenorth_growth_inquiries i LEFT JOIN misenorth_growth_audits a ON a.id=i.audit_id ${clause}`;
  const listingParams=[...values,page*40];
  const [list,matched,counts]=await Promise.all([
    query<any>(`SELECT i.id,i.created_at,i.name,i.email,i.restaurant_name,i.message,i.intent,i.status,i.operator_note,i.restaurant_website,i.main_goal,i.source,i.contacted_at,i.follow_up_at,i.assigned_to,a.hostname AS audited_hostname,a.id AS audit_id ${select} ORDER BY i.created_at ${sort},i.id ${sort} LIMIT 40 OFFSET $${listingParams.length}`,listingParams),
    query<any>(`SELECT count(*)::int AS total ${select}`,values),
    query<any>(`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='new')::int AS new_count,count(*) FILTER(WHERE intent='restaurant')::int AS restaurants,count(*) FILTER(WHERE intent='partner')::int AS partners,count(*) FILTER(WHERE intent='investor')::int AS investors FROM misenorth_growth_inquiries`)
  ]);
  return json({ok:true,items:list.rows,counts:counts.rows[0],page,totalMatches:matched.rows[0].total,pageSize:40});
 }catch(e){return fail(e);}
}
