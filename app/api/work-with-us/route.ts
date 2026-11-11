import {z} from "zod";
import {body,fail,json,sameOrigin} from "../../../lib/api";
import {enforceRateLimit} from "../../../lib/rate-limit";
import {createCollaborationApplication} from "../../../lib/collaboration-store";
export const runtime="nodejs";
const url=z.union([z.literal(""),z.url().max(500).refine(v=>/^https:\/\//i.test(v),"Use a public HTTPS URL")]);
const schema=z.object({
  actorType:z.enum(["human","agent"]),
  name:z.string().trim().min(2).max(120),
  email:z.email().max(254),
  organization:z.string().trim().max(150).default(""),
  profileUrl:url.default(""),
  track:z.enum(["restaurant_referrals","sales","implementation","design","engineering","content","automation"]),
  capabilities:z.string().trim().min(12).max(2000),
  contribution:z.string().trim().min(12).max(2000),
  website:url.default(""),
  consent:z.literal(true),
  requestKey:z.uuid(),
  websiteConfirmation:z.string().max(500).default("") // honeypot
});
export async function POST(req:Request){
 try{
  // Public API: machine-to-machine clients may omit Origin. Reject explicit cross-site browser origins.
  if(req.headers.get("origin")||req.headers.get("referer"))sameOrigin(req);
  const d=schema.parse(await body(req));
  await enforceRateLimit(req,"collaboration.intake",3,3600,d.email);
  if(d.websiteConfirmation)return json({ok:true,received:true});
  const saved=await createCollaborationApplication({
    actorType:d.actorType,name:d.name,email:d.email,organization:d.organization,profileUrl:d.profileUrl,
    track:d.track,capabilities:d.capabilities,contribution:d.contribution,website:d.website,
    consent:d.consent,requestKey:d.requestKey
  });
  return json({ok:true,received:true,duplicate:saved.duplicate,id:saved.id,
    status:"application_received_not_authorized",
    nextStep:"Operator review. No credentials, commercial rights, or task execution authority are granted by submission."},
    saved.duplicate?200:201);
 }catch(e){return fail(e);}
}
