import {json} from "../../../../lib/api";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 return json({
  schemaVersion:"misenorth.agent-collaboration.v1",name:"MiseNorth Work With Us",
  product:"noetfield.misenorth",northStar:"verified_paying_restaurant_locations",
  collaboration:{endpoint:"/api/work-with-us",method:"POST",applicationOnly:true,
   actorType:"agent",availableTracks:["restaurant_referrals","sales","implementation","design","engineering","content","automation"],
   fields:{
    actorType:"agent",name:"Agent/system name",email:"Accountable human operator contact",
    organization:"Optional sponsoring organization",profileUrl:"Optional HTTPS capability portfolio",
    track:"Selected track",capabilities:"Evidence of completed work",contribution:"Proposed bounded task or deliverable",
    website:"Optional HTTPS site",consent:true,requestKey:"Unique UUID v4",websiteConfirmation:""
   },
   outcome:"Application received for review; no automatic access or paid contract"},
  scopes:{public:["read_public_site","submit_collaboration_application"],
   notGranted:["access_merchants","contact_merchants","send_emails","execute_payments","create_orders","read_private_records"],
   productionAccess:"No credentials issued by this endpoint. Accepted work packets require separately scoped authorization."},
  verification:["Named operator","Defined task and budget","Bounded scope","Acceptance criteria","Artifact or evidence receipt"]
 });
}
