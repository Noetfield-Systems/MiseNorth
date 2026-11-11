"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Packet={id:string;domain:string;owner:string;priority:string;objective:string;trigger:string;action:string;evidenceRequired:string[];href:string;state:string};
type Department={id:string;name:string;mission:string;owner:string;metric:string};
type OperatingModel={
 schemaVersion:string;generatedAt:string;
 northStar:{value:number|null;state:string;definition:string;excludes:string[]};
 leading:{restaurantInquiries:number;qualified:number;wonCRM:number;actualWorkspaces:number;websiteAudits:number;collaborationApplications:number;awaitingCollaborationReview:number;agentApplicants:number;humanApplicants:number};
 cash:{status:string;amountCadCents:number|null;verifiedAt:string|null};
 operatingLoop:string[];departments:Department[];packets:Packet[];authority:{mode:string;agentApplicationsGrantExecution:boolean;paidCustomersFromStripeOnly:boolean;companyOsExport:string};
};
export default function CompanyOsPanel(){
 const [model,setModel]=useState<OperatingModel|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/operator/company-os",{cache:"no-store"});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Company OS unavailable");
   setModel(d);
  }catch(e){setError(e instanceof Error?e.message:"Company OS unavailable");}
  finally{setBusy(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 if(!model)return <div className="gc-panel"><h2>Restaurant Company OS</h2><p>{busy?"Reading operating state…":error||"No live operating snapshot."}</p><button className="gc-button gc-button-subtle" onClick={load}>Retry</button></div>;
 return <div className="gc-stack">
  <section className="gc-company-north"><div><span className="gc-section-kicker">NORTH STAR / THE ONE MEASURE THAT COUNTS</span><h2>Verified paying restaurant locations</h2><p>Not demo activity. Not an uncollected proposal. Only a real non-demo location with active paid entitlement and a valid paid invoice.</p><small>Source: Stripe invoice ledger and restaurant entitlement state · {new Date(model.generatedAt).toLocaleString("en-CA")}</small></div><div className="gc-north-value"><strong>{model.northStar.value===null?"—":model.northStar.value}</strong><span>{model.northStar.value===null?"PAYMENT VERIFICATION UNAVAILABLE":"VERIFIED PAID LOCATIONS"}</span></div></section>
  <div className="gc-metrics"><div className="gc-kpi"><span>Restaurant inquiries</span><strong>{model.leading.restaurantInquiries}</strong><small>Real submissions, not synthetic demonstrations</small></div><div className="gc-kpi"><span>Qualified opportunities</span><strong>{model.leading.qualified}</strong><small>Recorded CRM state</small></div><div className="gc-kpi"><span>Restaurant workspaces</span><strong>{model.leading.actualWorkspaces}</strong><small>Non-demo; not necessarily paying</small></div><div className="gc-kpi"><span>Collaboration proposals</span><strong>{model.leading.collaborationApplications}</strong><small>{model.leading.awaitingCollaborationReview} awaiting review</small></div></div>
  <section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">THE CUSTOMER JOURNEY / 11 PHASES</span><h2>From first discovery to a retained merchant</h2></div></div><div className="gc-company-flow">{model.operatingLoop.map((step,i)=><div key={step}><b>{String(i+1).padStart(2,"0")}</b><strong>{step}</strong></div>)}</div><p className="gc-disclaimer">These are workflow phases, not a claim that any customer has reached them. Payments are counted only after verified Stripe reconciliation.</p></section>
  <section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">EXECUTION / INDEPENDENT OPERATING DESKS</span><h2>Six purpose-built departments</h2></div></div><div className="gc-company-departments">{model.departments.map(d=><article key={d.id}><span>{d.id.toUpperCase()}</span><h3>{d.name}</h3><p>{d.mission}</p><small>Owner: {d.owner}</small><small>Measure: {d.metric}</small></article>)}</div></section>
  <section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">STATE-TRIGGERED WORK / NOT AI THEATRE</span><h2>Prioritized execution packets</h2></div><button className="gc-button gc-button-subtle" disabled={busy} onClick={load}>Refresh</button></div>{model.packets.length?model.packets.map(p=><article key={p.id} className="gc-company-packet"><div><span className="gc-company-priority">{p.priority} · {p.domain}</span><h3>{p.objective}</h3><p>{p.action}</p><small>Trigger: {p.trigger} · Owner: {p.owner.replaceAll("_"," ")}</small><small>Acceptance evidence: {p.evidenceRequired.join(" · ")}</small></div><Link href={p.href} className="gc-button gc-button-subtle">Open work surface ↗</Link></article>):<p className="gc-muted-block">No outstanding actionable conditions detected.</p>}<p className="gc-disclaimer">Packets are proposed, not autonomously executed. Operator assignment, authority, external communications, payments and delivery proof remain separately verifiable.</p></section>
  <div className="gc-company-bottom"><Link href="/work-with-us" target="_blank" className="gc-button gc-button-primary">Public Work With Us ↗</Link><Link href="/api/agents/manifest" target="_blank" className="gc-button gc-button-subtle">Agent collaboration manifest ↗</Link></div>
 </div>;
}
