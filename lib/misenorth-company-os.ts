import {query} from "./db";
import {operatorGrowthSnapshot} from "./growth-command";
import {ensureCollaborationSchema} from "./collaboration-store";
export type WorkPacket={
 id:string;domain:string;owner:"growth_operator"|"sales_operator"|"activation_operator"|"finance_operator"|"partnership_operator";
 priority:"P0"|"P1"|"P2";objective:string;trigger:string;action:string;
 evidenceRequired:string[];href:string;state:"proposed_not_executed";
};
const departments=[
 {id:"acquisition",name:"Acquire",mission:"Earn attention with useful restaurant audits and relevant local proof",owner:"Growth operator",metric:"Audits that convert to restaurant inquiries"},
 {id:"sales",name:"Convert",mission:"Respond to real leads, run a relevant demo, offer a scoped proposal",owner:"Sales operator",metric:"Qualified to paid location conversion"},
 {id:"activation",name:"Activate",mission:"Configure menu, QR, guest flow and a live operator handoff for each signed merchant",owner:"Implementation operator",metric:"Time from first confirmed payment to usable live location"},
 {id:"hospitality",name:"Retain",mission:"Protect working guest workflows and resolve real restaurant requests",owner:"Customer success",metric:"Paid locations that stay active"},
 {id:"finance",name:"Collect",mission:"Invoice, reconcile Stripe events, track actual payment and recovery",owner:"Finance operator",metric:"Verified active paid locations / collected net revenue"},
 {id:"ecosystem",name:"Partner",mission:"Review human and AI contributions with bounded permissions and receipts",owner:"Partnership operator",metric:"Approved contributions that yield verified commercial outcomes"}
] as const;
export async function miseNorthCompanyOs(){
 const [commercial,collab,merchantOps]=await Promise.all([
  operatorGrowthSnapshot(),
  (async()=>{await ensureCollaborationSchema();const r=await query<any>(`SELECT count(*)::int AS total,
   count(*) FILTER(WHERE status='applied')::int AS awaiting_review,
   count(*) FILTER(WHERE actor_type='agent')::int AS agent_applicants,
   count(*) FILTER(WHERE actor_type='human')::int AS human_applicants
   FROM misenorth_collaboration_applications`);return r.rows[0];})(),
  query<any>(`SELECT
    count(*) FILTER(WHERE r.is_demo=false)::int AS merchant_locations,
    count(*) FILTER(WHERE r.is_demo=false AND r.accepting_orders=true)::int AS accepting_request_locations
   FROM restaurants r`)
 ]);
 const c=commercial.counts;
 const packets:WorkPacket[]=[];
 const add=(x:WorkPacket)=>packets.push(x);
 if(!c.restaurants)add({id:"acq-first-merchant",domain:"acquisition",owner:"growth_operator",priority:"P0",objective:"Generate the first verified restaurant inquiry",trigger:"No recorded restaurant inquiries",action:"Use a public website audit and invite a real operator to request a demo; no fabricated merchant consent",evidenceRequired:["Public restaurant audit URL","Merchant-initiated inquiry ID"],href:"/grader",state:"proposed_not_executed"});
 if(c.new_count)add({id:"sales-new",domain:"sales",owner:"sales_operator",priority:"P0",objective:"Contact open inbound leads",trigger:`${c.new_count} new inquiries`,action:"Review contact details and audit; respond using the merchant's provided channel",evidenceRequired:["Opportunity ID","Recorded contact outcome","Next follow-up date"],href:"/operator?view=opportunities&status=new",state:"proposed_not_executed"});
 if(c.overdue)add({id:"sales-overdue",domain:"sales",owner:"sales_operator",priority:"P0",objective:"Clear overdue follow-up",trigger:`${c.overdue} overdue opportunities`,action:"Resolve due tasks and record the actual response",evidenceRequired:["Contact outcome","Opportunity update event"],href:"/operator?view=opportunities&due=overdue",state:"proposed_not_executed"});
 if(c.qualified)add({id:"sales-qualified",domain:"sales",owner:"sales_operator",priority:"P1",objective:"Convert qualified prospects to explicit merchant offers",trigger:`${c.qualified} qualified inquiries`,action:"Send accurate scoped proposal and link to a real setup experience",evidenceRequired:["Proposal terms","Customer approval","Explicit billing agreement"],href:"/operator?view=pipeline",state:"proposed_not_executed"});
 if(commercial.billing.status!=="connected_live_ledger")add({id:"finance-stripe",domain:"finance",owner:"finance_operator",priority:"P0",objective:"Make verified paying locations measurable",trigger:"Billing integration is not verified",action:"Complete live product/price, webhook, tax and reconciliation for the correct Stripe account",evidenceRequired:["Price IDs","Webhook verification","Paid invoice in ledger","Matched location entitlement"],href:"/operator?view=revenue",state:"proposed_not_executed"});
 if(collab.awaiting_review)add({id:"partner-applications",domain:"ecosystem",owner:"partnership_operator",priority:"P1",objective:"Review human and AI contributors",trigger:`${collab.awaiting_review} pending applications`,action:"Review abilities and select a bounded paid or unpaid work packet; no automatic credentials",evidenceRequired:["Application review record","Defined work scope","Acceptance criteria"],href:"/operator?view=collaborators",state:"proposed_not_executed"});
 return {
  schemaVersion:"misenorth.company-os.v1",productId:"noetfield.misenorth",generatedAt:new Date().toISOString(),
  northStar:{id:"verified_paying_restaurant_locations",label:"Verified paying restaurant locations",
    value:commercial.billing.payingLocations,
    state:commercial.billing.status==="connected_live_ledger"?"verified_ledger_measurement":"unavailable_not_zero",
    definition:"Unique non-demo restaurant locations with active entitlement, paid latest invoice and non-expired paid subscription period.",
    excludes:["Demo restaurants","Signed but unpaid leads","Requested food order value","Website visits","Unverified invoices"]},
  leading:{restaurantInquiries:c.restaurants,qualified:c.qualified,wonCRM:c.won,actualWorkspaces:merchantOps.rows[0]?.merchant_locations??0,
    websiteAudits:commercial.audits,collaborationApplications:collab.total,awaitingCollaborationReview:collab.awaiting_review,
    agentApplicants:collab.agent_applicants,humanApplicants:collab.human_applicants},
  cash:{status:commercial.billing.status,amountCadCents:commercial.billing.collectedCadCents,verifiedAt:commercial.billing.verifiedAt},
  operatingLoop:["Discover","Audit","Demo","Inquire","Qualify","Propose","Onboard","Checkout","Verify payment","Activate","Retain"],
  departments,packets,
  authority:{mode:"human_reviewed_work_packets",agentApplicationsGrantExecution:false,paidCustomersFromStripeOnly:true,
    companyOsExport:"existing shared-secret aggregate endpoint; check integration configuration separately"},
  recordedAt:commercial.asOf
 };
}
