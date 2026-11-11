import {query} from "./db";
import {ensureGrowthSchema} from "./grader-store";
import {billingConfiguration} from "./stripe-client";

let ready:Promise<void>|undefined;
export async function ensureOperatorGrowthSchema(){
  await ensureGrowthSchema();
  if(!ready)ready=(async()=>{
    await query("ALTER TABLE misenorth_growth_inquiries ADD COLUMN IF NOT EXISTS contacted_at timestamptz");
    await query("ALTER TABLE misenorth_growth_inquiries ADD COLUMN IF NOT EXISTS follow_up_at timestamptz");
    await query("ALTER TABLE misenorth_growth_inquiries ADD COLUMN IF NOT EXISTS assigned_to text NOT NULL DEFAULT ''");
    await query("CREATE INDEX IF NOT EXISTS misenorth_growth_status_recent_idx ON misenorth_growth_inquiries(status,created_at DESC)");
    await query("CREATE INDEX IF NOT EXISTS misenorth_growth_followup_idx ON misenorth_growth_inquiries(follow_up_at) WHERE follow_up_at IS NOT NULL");
    await query(`CREATE TABLE IF NOT EXISTS misenorth_growth_activity(
       id uuid PRIMARY KEY,
       inquiry_id uuid REFERENCES misenorth_growth_inquiries(id) ON DELETE CASCADE,
       event_type text NOT NULL,
       actor text NOT NULL,
       details jsonb NOT NULL DEFAULT '{}'::jsonb,
       created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await query("CREATE INDEX IF NOT EXISTS misenorth_growth_activity_recent_idx ON misenorth_growth_activity(created_at DESC)");
    await query("CREATE INDEX IF NOT EXISTS misenorth_growth_activity_inquiry_idx ON misenorth_growth_activity(inquiry_id,created_at DESC)");
  })().catch(e=>{ready=undefined;throw e});
  await ready;
}
export type Recommendation={id:string;title:string;reason:string;href:string;label:string;priority:"high"|"normal"};
export async function operatorGrowthSnapshot(){
  await ensureOperatorGrowthSchema();
  const [counts,audits,workspaces,activity]=await Promise.all([
    query<any>(`SELECT count(*)::int AS total,
      count(*) FILTER(WHERE status='new')::int AS new_count,
      count(*) FILTER(WHERE status='contacted')::int AS contacted,
      count(*) FILTER(WHERE status='qualified')::int AS qualified,
      count(*) FILTER(WHERE status='proposal')::int AS proposal,
      count(*) FILTER(WHERE status='won')::int AS won,
      count(*) FILTER(WHERE status='lost')::int AS lost,
      count(*) FILTER(WHERE intent='restaurant')::int AS restaurants,
      count(*) FILTER(WHERE intent='partner')::int AS partners,
      count(*) FILTER(WHERE intent='investor')::int AS investors,
      count(*) FILTER(WHERE status='qualified' AND follow_up_at IS NULL)::int AS unscheduled,
      count(*) FILTER(WHERE status NOT IN ('lost','won') AND follow_up_at < now())::int AS overdue
      FROM misenorth_growth_inquiries`),
    query<any>("SELECT count(*)::int AS total FROM misenorth_growth_audits"),
    query<any>("SELECT count(*)::int AS total FROM restaurants WHERE is_demo=false"),
    query<any>(`SELECT created_at,event_type,actor,details,inquiry_id FROM (
       SELECT created_at,'inquiry_submitted'::text AS event_type,'merchant'::text AS actor,jsonb_build_object('intent',intent,'status',status) AS details,id AS inquiry_id FROM misenorth_growth_inquiries
       UNION ALL
       SELECT created_at,event_type,actor,details,inquiry_id FROM misenorth_growth_activity
       UNION ALL
       SELECT created_at,'website_audited'::text,'public_grader'::text,jsonb_build_object('hostname',hostname),NULL::uuid FROM misenorth_growth_audits
     ) a ORDER BY created_at DESC LIMIT 20`)
  ]);
  const cfg=billingConfiguration();
  let billing:{status:string;payingLocations:number|null;collectedCadCents:number|null;verifiedAt:string|null}={
    status:"not_connected",payingLocations:null,collectedCadCents:null,verifiedAt:null
  };
  if(cfg.configured && cfg.mode==="live"){
    const [paid,revenue]=await Promise.all([
      query<any>(`SELECT count(*)::int AS total, max(b.last_verified_at) AS verified_at
      FROM misenorth_billing_accounts b JOIN restaurants r ON r.id=b.restaurant_id
      WHERE r.is_demo=false AND b.subscription_status='active' AND b.entitlement_status='active'
        AND b.latest_invoice_status='paid' AND b.current_period_end > now()`),
      query<any>(`SELECT COALESCE(sum(i.amount_paid_cents),0)::bigint AS cents
      FROM misenorth_billing_invoices i JOIN restaurants r ON r.id=i.restaurant_id
      WHERE r.is_demo=false AND i.status='paid' AND upper(i.currency)='CAD'`)
    ]);
    billing={status:"connected_live_ledger",payingLocations:Number(paid.rows[0]?.total||0),
      collectedCadCents:Number(revenue.rows[0]?.cents||0),verifiedAt:paid.rows[0]?.verified_at||null};
  }
  const c=counts.rows[0];
  const actions:Recommendation[]=[];
  if(!c.total) actions.push({id:"acquire",title:"Bring in the first restaurant",reason:"No genuine inquiries have been recorded. Send the public website grader to a restaurant prospect.",href:"/grader",label:"Open website grader",priority:"high"});
  if(c.new_count)actions.push({id:"review",title:"Review new restaurant inquiries",reason:`${c.new_count} new inquiries have not yet progressed to a contact stage.`,href:"/operator?view=opportunities&status=new",label:"Review new inquiries",priority:"high"});
  if(c.overdue)actions.push({id:"overdue",title:"Resolve overdue follow-ups",reason:`${c.overdue} open opportunities are past their recorded follow-up date.`,href:"/operator?view=opportunities&due=overdue",label:"View overdue",priority:"high"});
  if(c.unscheduled)actions.push({id:"followup",title:"Schedule qualified next steps",reason:`${c.unscheduled} qualified opportunities have no follow-up date.`,href:"/operator?view=opportunities&status=qualified",label:"Schedule follow-ups",priority:"normal"});
  if(billing.status!=="connected_live_ledger")actions.push({id:"billing",title:"Connect verified subscription billing",reason:"The production app has not established a verified live Stripe billing configuration. No collected revenue is inferred.",href:"/operator?view=revenue",label:"Review billing readiness",priority:"normal"});
  const emailConfigured=Boolean(process.env.RESEND_API_KEY?.trim()&&process.env.RESEND_FROM_EMAIL?.trim()&&process.env.MISENORTH_LEAD_NOTIFY_TO?.trim());
  if(!emailConfigured)actions.push({id:"email",title:"Complete transactional email configuration",reason:"A Resend key, sender, or notification recipient is missing.",href:"/operator?view=integrations",label:"Review email",priority:"normal"});
  return {ok:true,asOf:new Date().toISOString(),counts:c,
    audits:Number(audits.rows[0]?.total||0),realWorkspaces:Number(workspaces.rows[0]?.total||0),
    billing,email:{configured:emailConfigured,deliveryVerified:false},
    stripe:{configured:cfg.configured,mode:cfg.mode,reasons:cfg.reasons},
    activity:activity.rows,actions};
}
