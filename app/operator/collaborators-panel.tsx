"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Application={id:string;actor_type:"human"|"agent";applicant_name:string;contact_email:string;organization:string;profile_url:string;track:string;capability_summary:string;proposed_contribution:string;website:string;status:"applied"|"reviewing"|"shortlisted"|"declined";operator_note:string;created_at:string};
type State={records:Application[];counts:{total:number;new_count:number;human:number;agent:number};page:number};
export default function CollaboratorsPanel(){
 const [state,setState]=useState<State|null>(null);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [actor,setActor]=useState(""),[status,setStatus]=useState("");
 const [selected,setSelected]=useState<Application|null>(null),[draft,setDraft]=useState({status:"applied",note:""});
 const load=useCallback(async()=>{
  setBusy(true);setError("");
  try{const p=new URLSearchParams();if(actor)p.set("actor",actor);if(status)p.set("status",status);
   const r=await fetch("/api/operator/collaborators?"+p.toString(),{cache:"no-store"});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load applicants");setState(d);
  }catch(e){setError(e instanceof Error?e.message:"Applicant queue unavailable");}
  finally{setBusy(false);}
 },[actor,status]);
 useEffect(()=>{load();},[load]);
 function choose(a:Application){setSelected(a);setDraft({status:a.status,note:a.operator_note});}
 async function save(){
  if(!selected)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/operator/collaborators/"+selected.id,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(draft)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Review not saved");
   setSelected(null);setNotice("Review recorded. No agent execution permissions were issued.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save review");}finally{setBusy(false);}
 }
 return <div className="gc-stack">
  <section className="gc-company-north"><div><span className="gc-section-kicker">WORK WITH US / PEOPLE + MACHINES</span><h2>Turn contributors into verifiable delivery</h2><p>Review real humans and agent teams. Scope work packets before any system access or commercial activity. Application alone grants nothing.</p></div><Link href="/work-with-us" target="_blank" className="gc-button gc-button-mint">Open public page ↗</Link></section>
  {state&&<div className="gc-metrics"><div className="gc-kpi"><span>Total applications</span><strong>{state.counts.total}</strong><small>Submitted proposals</small></div><div className="gc-kpi"><span>Awaiting review</span><strong>{state.counts.new_count}</strong><small>Unassigned inbound</small></div><div className="gc-kpi"><span>Human contributors</span><strong>{state.counts.human}</strong><small>Self-declared applicant type</small></div><div className="gc-kpi"><span>AI agents</span><strong>{state.counts.agent}</strong><small>Not automatically authorized</small></div></div>}
  <section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">CANDIDATE REVIEW / PRIVATE</span><h2>Collaboration inbox</h2></div><button className="gc-button gc-button-subtle" disabled={busy} onClick={load}>Refresh</button></div>
   {error&&<p className="gc-error" role="alert">{error}</p>}{notice&&<p className="gc-notice" role="status">{notice}</p>}
   <div className="gc-collab-filters"><label>Applicant type<select value={actor} onChange={e=>setActor(e.target.value)}><option value="">All</option><option value="human">Human</option><option value="agent">Agent</option></select></label><label>Review status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All</option>{["applied","reviewing","shortlisted","declined"].map(s=><option key={s} value={s}>{s}</option>)}</select></label></div>
   {busy&&!state&&<p>Loading…</p>}
   {state&&state.records.length===0&&<div className="gc-muted-block">No submitted proposals match these filters. The public collaboration form is ready for the first applicant.</div>}
   {state?.records.map(a=><button type="button" key={a.id} className="gc-collab-row" onClick={()=>choose(a)}><span className="gc-initials">{a.actor_type==="agent"?"AI":"H"}</span><span><strong>{a.applicant_name}</strong><small>{a.track.replaceAll("_"," ")} · {a.contact_email}</small></span><span className="gc-badge">{a.status}</span></button>)}
  </section>
  {selected&&<section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">REVIEW / {selected.actor_type.toUpperCase()}</span><h2>{selected.applicant_name}</h2><p>Submitted {new Date(selected.created_at).toLocaleString("en-CA")} · {selected.organization||"Independent applicant"}</p></div><button className="gc-button gc-button-subtle" onClick={()=>setSelected(null)}>Close</button></div>
   <p className="gc-bodycopy"><strong>Capabilities:</strong> {selected.capability_summary}</p><p className="gc-bodycopy"><strong>Proposed contribution:</strong> {selected.proposed_contribution}</p>
   <p className="gc-bodycopy"><strong>Contact:</strong> <a href={"mailto:"+selected.contact_email}>{selected.contact_email}</a>{selected.profile_url&&<> · <a href={selected.profile_url} target="_blank" rel="noopener noreferrer">Public profile ↗</a></>}</p>
   <div className="gc-collab-review"><label>Review status<select value={draft.status} onChange={e=>setDraft(d=>({...d,status:e.target.value}))}>{["applied","reviewing","shortlisted","declined"].map(s=><option key={s} value={s}>{s}</option>)}</select></label><label>Internal assessment<textarea maxLength={2000} rows={3} value={draft.note} onChange={e=>setDraft(d=>({...d,note:e.target.value}))} placeholder="Proposed work packet, cost boundary and acceptance evidence…"/></label><button disabled={busy} onClick={save} className="gc-button gc-button-primary">Save review ↗</button></div>
  </section>}
  <div className="gc-footer-note">Applications are not employment contracts, payment authorizations or agent credentials. Scope and commercial terms are agreed separately.</div>
 </div>;
}
