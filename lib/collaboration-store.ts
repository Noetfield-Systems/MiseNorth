
import {randomUUID} from "node:crypto";
import {query} from "./db";
let boot:Promise<void>|undefined;
export type CollaboratorType="human"|"agent";
export type CollaborationTrack="restaurant_referrals"|"sales"|"implementation"|"design"|"engineering"|"content"|"automation";
export type ApplicationStatus="applied"|"reviewing"|"shortlisted"|"declined";
export async function ensureCollaborationSchema(){
 if(!boot)boot=(async()=>{
  await query(`CREATE TABLE IF NOT EXISTS misenorth_collaboration_applications(
    id uuid PRIMARY KEY,
    actor_type text NOT NULL CHECK(actor_type IN ('human','agent')),
    applicant_name text NOT NULL,
    contact_email text NOT NULL,
    organization text NOT NULL DEFAULT '',
    profile_url text NOT NULL DEFAULT '',
    track text NOT NULL CHECK(track IN ('restaurant_referrals','sales','implementation','design','engineering','content','automation')),
    capability_summary text NOT NULL,
    proposed_contribution text NOT NULL,
    website text NOT NULL DEFAULT '',
    consent_to_contact boolean NOT NULL,
    status text NOT NULL DEFAULT 'applied' CHECK(status IN ('applied','reviewing','shortlisted','declined')),
    operator_note text NOT NULL DEFAULT '',
    request_key uuid NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await query("CREATE INDEX IF NOT EXISTS misenorth_collaboration_recent_idx ON misenorth_collaboration_applications(created_at DESC)");
  await query("CREATE INDEX IF NOT EXISTS misenorth_collaboration_status_idx ON misenorth_collaboration_applications(status,created_at DESC)");
  await query(`CREATE TABLE IF NOT EXISTS misenorth_collaboration_events(
    id uuid PRIMARY KEY,
    application_id uuid NOT NULL REFERENCES misenorth_collaboration_applications(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    actor text NOT NULL DEFAULT 'operator',
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
 })().catch(e=>{boot=undefined;throw e});
 await boot;
}
export async function createCollaborationApplication(d:{
 actorType:CollaboratorType;name:string;email:string;organization:string;profileUrl:string;track:CollaborationTrack;
 capabilities:string;contribution:string;website:string;requestKey:string;consent:boolean;
}){
 await ensureCollaborationSchema();
 const id=randomUUID();
 const result=await query<{id:string}>(`INSERT INTO misenorth_collaboration_applications(
 id,actor_type,applicant_name,contact_email,organization,profile_url,track,capability_summary,
 proposed_contribution,website,request_key,consent_to_contact
 ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
 ON CONFLICT(request_key) DO NOTHING RETURNING id`,
 [id,d.actorType,d.name,d.email.toLowerCase(),d.organization,d.profileUrl,d.track,d.capabilities,d.contribution,d.website,d.requestKey,d.consent]);
 return {id:result.rows[0]?.id||null,duplicate:result.rowCount===0};
}
