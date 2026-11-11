import {randomUUID} from "node:crypto";
import {query} from "./db";
import type {WebsiteReport} from "./grader-core.mjs";

let initialized:Promise<void>|undefined;
export async function ensureGrowthSchema(){
 if(!initialized)initialized=(async()=>{
  await query(`CREATE TABLE IF NOT EXISTS misenorth_growth_audits(
   id uuid PRIMARY KEY,
   normalized_url text NOT NULL,
   hostname text NOT NULL,
   report jsonb NOT NULL,
   created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await query("CREATE INDEX IF NOT EXISTS growth_audits_created_idx ON misenorth_growth_audits(created_at DESC)");
  await query(`CREATE TABLE IF NOT EXISTS misenorth_growth_inquiries(
   id uuid PRIMARY KEY,
   audit_id uuid REFERENCES misenorth_growth_audits(id) ON DELETE SET NULL,
   name text NOT NULL,
   email text NOT NULL,
   restaurant_name text NOT NULL DEFAULT '',
   message text NOT NULL DEFAULT '',
   intent text NOT NULL CHECK(intent IN ('restaurant','partner','investor')),
   marketing_consent boolean NOT NULL DEFAULT false,
   status text NOT NULL DEFAULT 'new',
   created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await query("ALTER TABLE misenorth_growth_inquiries ADD COLUMN IF NOT EXISTS operator_note text NOT NULL DEFAULT ''");
  await query("CREATE INDEX IF NOT EXISTS growth_inquiries_created_idx ON misenorth_growth_inquiries(created_at DESC)");
 })().catch(error=>{initialized=undefined;throw error;});
 await initialized;
}
export async function saveAudit(report:WebsiteReport){
 await ensureGrowthSchema();
 const id=randomUUID();
 await query("INSERT INTO misenorth_growth_audits(id,normalized_url,hostname,report) VALUES($1,$2,$3,$4::jsonb)",[id,report.auditedUrl,report.hostname,JSON.stringify(report)]);
 return id;
}
export async function readAudit(id:string){
 await schema();
 const r=await query<{id:string;report:WebsiteReport;created_at:string}>("SELECT id,report,created_at FROM misenorth_growth_audits WHERE id=$1",[id]);
 return r.rows[0]||null;
}
export async function saveInquiry(data:{auditId?:string|null;name:string;email:string;restaurantName:string;message:string;intent:"restaurant"|"partner"|"investor"}){
 await schema();
 const id=randomUUID();
 await query("INSERT INTO misenorth_growth_inquiries(id,audit_id,name,email,restaurant_name,message,intent,marketing_consent) VALUES($1,$2,$3,$4,$5,$6,$7,false)",[id,data.auditId||null,data.name,data.email.toLowerCase(),data.restaurantName,data.message,data.intent]);
 return id;
}
