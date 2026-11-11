import {z} from "zod";
import {createSession} from "../../../../lib/auth";
import {query} from "../../../../lib/db";
import {body,fail,json,sameOrigin} from "../../../../lib/api";import {enforceRateLimit} from "../../../../lib/rate-limit";
import scenarios from "../../../../fixtures/demo-scenarios.json";

export const runtime="nodejs";
const schema=z.object({
 slug:z.string().min(1).max(100).refine(value=>scenarios.some(s=>s.slug===value),"Unknown demo workspace"),
 role:z.enum(["owner","manager","staff"]).optional().default("owner")
});

export async function POST(req:Request){
 try{
  sameOrigin(req);await enforceRateLimit(req,"demo.session",40,600);
  const {slug,role}=schema.parse(await body(req));
  const r=await query<any>(
   "SELECT u.id FROM restaurants r JOIN users u ON u.restaurant_id=r.id WHERE r.slug=$1 AND r.is_demo=true AND u.active=true AND u.role=$2 ORDER BY u.created_at LIMIT 1",
   [slug,role]
  );
  if(!r.rows[0])throw new Error("NOT_FOUND");
  await createSession(r.rows[0].id);
  return json({ok:true,slug});
 }catch(e){return fail(e);}
}
