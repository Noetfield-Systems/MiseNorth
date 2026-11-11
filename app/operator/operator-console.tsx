"use client";

import {useCallback,useEffect,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";

type Stage="new"|"contacted"|"qualified"|"proposal"|"won"|"lost";
type View="overview"|"opportunities"|"pipeline"|"agent"|"revenue"|"activity"|"integrations";
type Item={id:string;created_at:string;name:string;email:string;restaurant_name:string;message:string;intent:string;status:Stage;operator_note:string|null;restaurant_website:string;main_goal:string;source:string;audited_hostname:string|null;audit_id:string|null;contacted_at:string|null;follow_up_at:string|null;assigned_to:string};
type Counts={total:number;new_count:number;contacted:number;qualified:number;proposal:number;won:number;lost:number;restaurants:number;partners:number;investors:number;unscheduled:number;overdue:number};
type Activity={created_at:string;event_type:string;actor:string;details:Record<string,string|boolean|null>;inquiry_id?:string|null};
type Action={id:string;title:string;reason:string;href:string;label:string;priority:"high"|"normal"};
type Snapshot={ok:true;asOf:string;counts:Counts;audits:number;realWorkspaces:number;billing:{status:string;payingLocations:number|null;collectedCadCents:number|null;verifiedAt:string|null};email:{configured:boolean;deliveryVerified:boolean};stripe:{configured:boolean;mode:string|null;reasons:string[]};activity:Activity[];actions:Action[]};
type Draft={status:Stage;note:string;assignedTo:string;followUpAt:string};

const navigation:{id:View;label:string;icon:string}[]=[
 {id:"overview",label:"Overview",icon:"overview"},
 {id:"opportunities",label:"Opportunities",icon:"inbox"},
 {id:"pipeline",label:"Pipeline",icon:"pipeline"},
 {id:"agent",label:"Agent Desk",icon:"spark"},
 {id:"revenue",label:"Revenue",icon:"revenue"},
 {id:"activity",label:"Activity",icon:"activity"},
 {id:"integrations",label:"Integrations",icon:"link"}
];
const stages:Stage[]=["new","contacted","qualified","proposal","won","lost"];
const stageNames:Record<Stage,string>={new:"New",contacted:"Contacted",qualified:"Qualified",proposal:"Proposal",won:"Won",lost:"Lost"};
const icons:Record<string,string[]>={
 overview:["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"],
 inbox:["M4 4h16v15H4z","M4 15h5l2 3h2l2-3h5"],
 pipeline:["M4 6h5v5H4z","M15 13h5v5h-5z","M9 8h5v7h1"],
 spark:["m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1z"],
 revenue:["M3 6h18v13H3z","M3 10h18","M7 15h4"],
 activity:["M3 12h4l3-7 4 14 3-7h4"],
 link:["M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7.1-7.1l-1 1","M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7.1 7.1l1-1"],
 arrow:["M5 12h14","m13 6 6 6-6 6"],
 refresh:["M20 7v5h-5","M4 17v-5h5","M6 9a7 7 0 0 1 12-2l2 5","M4 12l2 5a7 7 0 0 0 12-2"],
 search:["m21 21-4.4-4.4","M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"],
 external:["M13 5h6v6","M19 5l-9 9","M19 13v6H5V5h6"],
 close:["M5 5l14 14","M19 5 5 19"],
 calendar:["M4 5h16v16H4z","M8 3v4","M16 3v4","M4 10h16"],
 shield:["M12 2 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6z","m8 12 3 3 5-6"],
 plus:["M12 5v14","M5 12h14"],
 chevron:["m9 6 6 6-6 6"],
 mail:["M3 5h18v14H3z","m3 7 9 7 9-7"]
};
function Icon({name,size=18}:{name:string;size?:number}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{(icons[name]||icons.arrow).map((d,i)=><path key={i} d={d}/>)}</svg>;}
function dateTime(value:string|null|undefined){if(!value)return "Not set";const d=new Date(value);return Number.isNaN(d.getTime())?"Unknown":d.toLocaleString("en-CA",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});}
function localInput(value:string|null|undefined){if(!value)return "";const d=new Date(value);if(Number.isNaN(d.getTime()))return "";const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16);}
function initials(s:string){return (s.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("")||"MN").toUpperCase();}
function tone(status:string):"positive"|"negative"|"neutral"{return ["won","connected","online","configured"].includes(status)?"positive":["lost","overdue","unavailable"].includes(status)?"negative":"neutral";}
function Badge({children,variant="neutral"}:{children:React.ReactNode;variant?:"positive"|"negative"|"neutral"|"warning"}){return <span className={"gc-badge gc-"+variant}>{children}</span>;}
function Card({label,value,hint,accent}:{label:string;value:string|number;hint:string;accent?:boolean}){return <div className={"gc-kpi"+(accent?" gc-kpi-accent":"")}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>;}

export default function OperatorConsole(){
 const [auth,setAuth]=useState<"loading"|"locked"|"ready">("loading");
 const [key,setKey]=useState("");
 const [view,setView]=useState<View>("overview");
 const [items,setItems]=useState<Item[]>([]);
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const [page,setPage]=useState(0),[totalMatches,setTotalMatches]=useState(0);
 const [q,setQ]=useState(""),[status,setStatus]=useState(""),[intent,setIntent]=useState(""),[sort,setSort]=useState("newest"),[due,setDue]=useState("");
 const [selected,setSelected]=useState<Item|null>(null);
 const [draft,setDraft]=useState<Draft|null>(null),[history,setHistory]=useState<Activity[]>([]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async(n:number)=>{
  const params=new URLSearchParams({page:String(n),sort});
  if(q.trim())params.set("q",q.trim());
  if(status)params.set("status",status);
  if(intent)params.set("intent",intent);
  if(due)params.set("due",due);
  const [r,s]=await Promise.all([
    fetch("/api/operator/inquiries?"+params.toString(),{cache:"no-store"}),
    fetch("/api/operator/command",{cache:"no-store"})
  ]);
  if(r.status===401||s.status===401){setAuth("locked");setLoading(false);return;}
  const [data,command]=await Promise.all([r.json(),s.json()]);
  if(!r.ok||!s.ok)throw new Error(data.error||command.error||"Cannot refresh live commercial data");
  setItems(data.items);setPage(n);setTotalMatches(data.totalMatches);
  setSnapshot(command);setAuth("ready");setLoading(false);
 },[q,status,intent,sort,due]);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const next=params.get("view") as View|null;
  if(navigation.some(x=>x.id===next))setView(next!);
  const incomingStatus=params.get("status")||"";
  if(stages.some(x=>x===incomingStatus))setStatus(incomingStatus);
  if(params.get("due")==="overdue")setDue("overdue");
 },[]);
 useEffect(()=>{
  const timer=setTimeout(()=>refresh(0).catch(e=>{setLoading(false);setError(e instanceof Error?e.message:"Unable to load workspace");}),220);
  return ()=>clearTimeout(timer);
 },[refresh]);
 useEffect(()=>{
  if(!selected)return;
  function onKey(e:KeyboardEvent){if(e.key==="Escape"){setSelected(null);setHistory([]);}}
  document.addEventListener("keydown",onKey);return ()=>document.removeEventListener("keydown",onKey);
 },[selected]);
 function navigate(next:View){
  setView(next);setError("");
  const url=new URL(window.location.href);url.searchParams.set("view",next);window.history.replaceState(null,"",url);
 }
 async function login(e:FormEvent){e.preventDefault();setBusy(true);setError("");
  try{
   const res=await fetch("/api/operator/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:key})});
   const d=await res.json();if(!res.ok)throw new Error(d.error||"Invalid access key");
   setKey("");await refresh(0);
  }catch(e){setError(e instanceof Error?e.message:"Access denied");}finally{setBusy(false);}
 }
 async function logout(){await fetch("/api/operator/session",{method:"DELETE"});setAuth("locked");setSelected(null);setSnapshot(null);setItems([]);}
 async function openItem(item:Item){
  setSelected(item);setHistory([]);
  setDraft({status:item.status,note:item.operator_note||"",assignedTo:item.assigned_to||"",followUpAt:localInput(item.follow_up_at)});
  const r=await fetch("/api/operator/inquiries/"+item.id,{cache:"no-store"});
  if(r.ok){const data=await r.json();setHistory(data.history||[]);}
 }
 async function saveItem(){
  if(!selected||!draft)return;
  setBusy(true);setError("");
  try{
   const payload={status:draft.status,note:draft.note,assignedTo:draft.assignedTo,followUpAt:draft.followUpAt?new Date(draft.followUpAt).toISOString():null};
   const r=await fetch("/api/operator/inquiries/"+selected.id,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Update failed");
   setNotice("Opportunity updated and recorded.");setSelected(null);setDraft(null);
   await refresh(page);
  }catch(e){setError(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}
 }
 async function deleteItem(){
  if(!selected||!window.confirm("Permanently delete this inquiry and its personal contact details? This cannot be undone."))return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/operator/inquiries/"+selected.id,{method:"DELETE"});
   if(!r.ok)throw new Error((await r.json()).error||"Delete failed");
   setSelected(null);setNotice("Inquiry permanently deleted.");await refresh(0);
  }catch(e){setError(e instanceof Error?e.message:"Delete failed");}finally{setBusy(false);}
 }
 async function testEmail(){
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/operator/email-test",{method:"POST"});
   const d=await r.json();
   if(!r.ok||!d.providerAccepted)throw new Error(d.error||"Resend did not accept the diagnostic");
   setNotice("Resend accepted the diagnostic for "+d.recipient+". Inbox delivery is not yet verified.");
  }catch(e){setError(e instanceof Error?e.message:"Diagnostic failed");}finally{setBusy(false);}
 }
 async function copyAcquisition(){
  try{await navigator.clipboard.writeText(window.location.origin+"/grader");setNotice("Acquisition link copied.");}
  catch{setError("Clipboard unavailable. Copy the Grader URL from the address bar.");}
 }
 const c=snapshot?.counts;
 const hasLeads=Boolean(c?.total);
 const period=snapshot?dateTime(snapshot.asOf):"Waiting for data";
 const filtered=items;
 const openDetail=(item:Item)=>{openItem(item).catch(()=>setError("Opportunity history could not be loaded."));};
 return <div className="gc">
  {auth==="loading"?<div className="gc-entrance"><span className="gc-symbol">M</span><p>Opening Growth Command…</p></div>:
   auth==="locked"?<div className="gc-auth">
    <div className="gc-auth-intro"><Link href="/" className="gc-logo"><span className="gc-symbol">M</span><span>MiseNorth <small>GROWTH COMMAND</small></span></Link><div className="gc-auth-kicker">PRIVATE OPERATING ENVIRONMENT</div><h1>Every restaurant.<br/><em>Every opportunity.</em><br/>One command desk.</h1><p>Purpose-built acquisition, sales intelligence and verified revenue operations for MiseNorth.</p><div className="gc-auth-caption"><Icon name="shield"/> Operator access is required. Merchant data stays private.</div></div>
    <div className="gc-auth-card"><div className="gc-card-eyebrow">SIGN IN / 01</div><h2>Access Growth Command</h2><p>Enter the existing operator access key to open your workspace.</p><form onSubmit={login}><label htmlFor="operator-password">Operator access key</label><input id="operator-password" type="password" autoComplete="current-password" required value={key} onChange={e=>setKey(e.target.value)} placeholder="Your private access key"/>{error&&<p className="gc-error" role="alert">{error}</p>}<button className="gc-button gc-button-primary gc-full" disabled={busy} type="submit">{busy?"Verifying…":"Enter workspace"} <Icon name="arrow"/></button></form><Link href="/" className="gc-back">Return to MiseNorth website</Link></div>
   </div>:
  <div className="gc-frame">
   <aside className="gc-sidebar" aria-label="Growth Command navigation">
    <Link className="gc-logo" href="/"><span className="gc-symbol">M</span><span>MiseNorth<small>GROWTH COMMAND</small></span></Link>
    <div className="gc-workspace"><span className="gc-workspace-icon">N</span><span><strong>Noetfield / MiseNorth</strong><small>Production workspace</small></span><span className="gc-online-dot" aria-label="Workspace connected"/></div>
    <div className="gc-nav-label">WORKSPACE</div>
    <nav className="gc-nav">{navigation.map(entry=><button type="button" key={entry.id} aria-current={view===entry.id?"page":undefined} className={"gc-nav-item"+(view===entry.id?" active":"")} onClick={()=>navigate(entry.id)}><Icon name={entry.icon}/><span>{entry.label}</span>{entry.id==="opportunities"&&Boolean(c?.new_count)&&<b>{c!.new_count}</b>}</button>)}</nav>
    <div className="gc-nav-label gc-nav-label-second">ACQUISITION</div>
    <div className="gc-nav gc-nav-external"><Link href="/grader" target="_blank" rel="noopener noreferrer"><Icon name="external"/> Website Grader</Link><Link href="/restaurants/vancouver" target="_blank" rel="noopener noreferrer"><Icon name="external"/> Vancouver page</Link><Link href="/demo" target="_blank" rel="noopener noreferrer"><Icon name="external"/> Restaurant demos</Link></div>
    <div className="gc-sidebar-footer"><div className="gc-live"><span className="gc-live-dot"/> <span>Operator session active</span></div><button className="gc-signout" onClick={logout}>Sign out <Icon name="arrow" size={15}/></button></div>
   </aside>
   <div className="gc-workarea">
    <header className="gc-topbar"><div className="gc-breadcrumb"><span>MISE NORTH</span><Icon name="chevron" size={13}/><strong>{navigation.find(x=>x.id===view)?.label}</strong></div><div className="gc-top-actions"><span className="gc-refresh-time">As of {period}</span><button className="gc-icon-button" title="Refresh live data" aria-label="Refresh live data" onClick={()=>refresh(page).catch(()=>setError("Refresh failed"))}><Icon name="refresh"/></button><span className="gc-avatar" title="Operator">OP</span></div></header>
    <main className="gc-content">
     <div className="gc-page-head"><div><div className="gc-eyebrow"><span className="gc-live-dot"/> MISE NORTH / OPERATIONS</div><h1>{view==="overview"?"Growth Command":navigation.find(x=>x.id===view)?.label}</h1><p>{view==="overview"?"A sharper view of what matters: opportunities, actions, and verified commercial outcomes.":view==="agent"?"Recommendations grounded in observed state. Every action requires a real result.":view==="revenue"?"Verified subscription activity, not projected bookings or synthetic demos.":view==="integrations"?"Actual configuration state, without invented readiness scores.":view==="activity"?"Real recorded commercial and operator events.":view==="pipeline"?"Move restaurant conversations from first contact to a commercial decision.":"Search, qualify, assign and follow up on real merchant inquiries."}</p></div><div className="gc-head-actions"><button type="button" className="gc-button gc-button-subtle" onClick={copyAcquisition}><Icon name="link"/> Copy grader URL</button><Link className="gc-button gc-button-primary" href="/grader" target="_blank" rel="noopener noreferrer">Open Grader <Icon name="arrow"/></Link></div></div>
     {error&&<div className="gc-error" role="alert">{error}<button type="button" aria-label="Dismiss error" onClick={()=>setError("")}><Icon name="close" size={15}/></button></div>}
     {notice&&<div className="gc-notice" role="status">{notice}<button type="button" aria-label="Dismiss notification" onClick={()=>setNotice("")}><Icon name="close" size={15}/></button></div>}
     {loading&&!snapshot?<div className="gc-skeleton" aria-label="Loading commercial metrics"><span/><span/><span/></div>:null}
     {view==="overview"&&snapshot&&<div className="gc-stack">
      <div className="gc-metrics"><Card label="Total opportunities" value={c?.total??0} hint="Actual submitted requests" accent/><Card label="New inquiries" value={c?.new_count??0} hint="Awaiting first contact"/><Card label="Qualified" value={c?.qualified??0} hint="Awaiting next stage"/><Card label="Paying locations" value={snapshot.billing.payingLocations===null?"Not connected":snapshot.billing.payingLocations} hint={snapshot.billing.payingLocations===null?"Live Stripe verification unavailable":"Live ledger, active and paid"}/></div>
      {!hasLeads?<section className="gc-launch"><div className="gc-launch-content"><div className="gc-label-bright"><span className="gc-pulse"/> ACQUISITION ENGINE / START</div><h2>Your growth engine is ready<br/>for its <em>first restaurant.</em></h2><p>Acquisition surfaces are available. No verified inbound restaurant opportunities have been captured yet. Start with a real website audit and a specific merchant.</p><div className="gc-launch-actions"><Link href="/grader" target="_blank" rel="noopener noreferrer" className="gc-button gc-button-mint">Open free Grader <Icon name="arrow"/></Link><button className="gc-button gc-button-outline" onClick={copyAcquisition}>Copy acquisition link</button></div></div><div className="gc-journey" aria-label="Merchant acquisition journey">{["Discovery","Website audit","Product preview","Inquiry","Qualification","Onboarding","Payment"].map((step,i)=><div key={step} className="gc-journey-step"><span className="gc-journey-number">{String(i+1).padStart(2,"0")}</span><strong>{step}</strong><small>{i<3?"Public surface":i<5?"No activity yet":"Not verified"}</small></div>)}</div></section>:
       <section className="gc-panel gc-current"><div className="gc-section-head"><div><span className="gc-section-kicker">COMMERCIAL MOMENTUM</span><h2>Opportunities need action</h2><p>New: {c?.new_count} · Qualified: {c?.qualified} · Follow-ups overdue: {c?.overdue}</p></div><button className="gc-link-button" onClick={()=>navigate("opportunities")}>Open inbox <Icon name="arrow"/></button></div><div className="gc-current-list">{items.slice(0,4).map(i=><button key={i.id} className="gc-current-item" onClick={()=>openDetail(i)}><span className="gc-initials">{initials(i.restaurant_name||i.name)}</span><span><strong>{i.restaurant_name||i.name}</strong><small>{i.source||"Direct inquiry"} · {dateTime(i.created_at)}</small></span><Badge variant={tone(i.status)}>{stageNames[i.status]}</Badge><Icon name="chevron"/></button>)}</div></section>}
      <div className="gc-two-up"><section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">RECOMMENDED NEXT ACTION</span><h2>Revenue priorities</h2></div><button className="gc-link-button" onClick={()=>navigate("agent")}>Agent Desk <Icon name="arrow"/></button></div>{snapshot.actions.length?snapshot.actions.slice(0,3).map((a,i)=><div className="gc-action-row" key={a.id}><span className="gc-action-index">0{i+1}</span><div><strong>{a.title}</strong><p>{a.reason}</p><Link href={a.href} className="gc-inline-action">{a.label} <Icon name="arrow" size={14}/></Link></div></div>):<div className="gc-muted-block">No outstanding rule-based actions detected.</div>}</section>
       <section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">INFRASTRUCTURE</span><h2>System connections</h2></div><button className="gc-link-button" onClick={()=>navigate("integrations")}>All integrations <Icon name="arrow"/></button></div><div className="gc-health-list"><div><span><span className="gc-health-dot good"/> PostgreSQL</span><Badge variant="positive">Online</Badge></div><div><span><span className={"gc-health-dot "+(snapshot.email.configured?"good":"muted")}/> Resend</span><Badge>{snapshot.email.configured?"Configured":"Action required"}</Badge></div><div><span><span className={"gc-health-dot "+(snapshot.stripe.configured?"good":"muted")}/> Stripe Billing</span><Badge>{snapshot.stripe.configured?"Configured":"Not connected"}</Badge></div></div><p className="gc-disclaimer">Configured does not imply a delivered email or a successful transaction.</p></section></div>
      <div className="gc-footer-note">Website audits: <strong>{snapshot.audits}</strong> · Non-demo workspaces: <strong>{snapshot.realWorkspaces}</strong> · Refreshed {period}</div>
     </div>}
     {(view==="opportunities"||view==="pipeline")&&<div className="gc-stack">
      <div className="gc-filter-panel"><label className="gc-search"><Icon name="search"/><input aria-label="Search opportunities" placeholder="Search restaurant, contact, email or domain…" value={q} onChange={e=>setQ(e.target.value)}/></label><select aria-label="Filter by stage" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All stages</option>{stages.map(x=><option value={x} key={x}>{stageNames[x]}</option>)}</select><select aria-label="Filter by intent" value={intent} onChange={e=>setIntent(e.target.value)}><option value="">All inquiries</option><option value="restaurant">Restaurant</option><option value="partner">Partner</option><option value="investor">Investor</option></select><select aria-label="Sort opportunities" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>
      <div className="gc-resultline"><span><strong>{totalMatches}</strong> matching opportunities · {q||status||intent||due?"Filtered live records":"Latest live records"}</span>{due&&<button className="gc-link-button" onClick={()=>setDue("")}>Clear overdue filter</button>}</div>
      {view==="pipeline"?<div className="gc-kanban">{stages.map(s=><section key={s} className="gc-column"><div className="gc-column-heading"><span className={"gc-status-marker gc-stage-"+s}/><strong>{stageNames[s]}</strong><b>{c?.[s==="new"?"new_count":s]??0}</b></div>{filtered.filter(i=>i.status===s).map(i=><button key={i.id} onClick={()=>openDetail(i)} className="gc-kanban-card"><span className="gc-card-source">{i.source||"Direct inquiry"}</span><strong>{i.restaurant_name||i.name}</strong><small>{i.name} · {dateTime(i.created_at)}</small>{i.follow_up_at&&<span className="gc-card-followup"><Icon name="calendar" size={13}/>{dateTime(i.follow_up_at)}</span>}</button>)}{!filtered.some(i=>i.status===s)&&<div className="gc-column-empty">No matches on this page</div>}</section>)}</div>:
      <section className="gc-table-panel">{filtered.length===0?<div className="gc-list-empty"><Icon name="inbox" size={30}/><h2>No matching opportunities</h2><p>Adjust the filters or share the Grader to capture your next restaurant lead.</p><Link href="/grader" target="_blank" rel="noopener noreferrer" className="gc-button gc-button-primary">Open Grader <Icon name="arrow"/></Link></div>:<div className="gc-opportunity-list"><div className="gc-table-head"><span>RESTAURANT / CONTACT</span><span>STAGE</span><span>SOURCE</span><span>RECEIVED</span><span></span></div>{filtered.map(i=><button className="gc-opportunity-row" key={i.id} onClick={()=>openDetail(i)}><span className="gc-name-cell"><span className="gc-initials">{initials(i.restaurant_name||i.name)}</span><span><strong>{i.restaurant_name||i.name}</strong><small>{i.email}</small></span></span><span><Badge variant={tone(i.status)}>{stageNames[i.status]}</Badge></span><span className="gc-source-cell">{i.source||"Direct"}</span><span className="gc-date-cell">{dateTime(i.created_at)}</span><Icon name="chevron" size={17}/></button>)}</div>}</section>}
      <div className="gc-pages"><span>Showing {filtered.length? page*40+1:0}–{Math.min((page+1)*40,totalMatches)} of {totalMatches}. Pipeline shows this page, not the full pipeline.</span><div><button className="gc-button gc-button-subtle" disabled={page===0} onClick={()=>refresh(page-1).catch(()=>setError("Previous page failed"))}>Previous</button><span>Page {page+1}</span><button className="gc-button gc-button-subtle" disabled={(page+1)*40>=totalMatches} onClick={()=>refresh(page+1).catch(()=>setError("Next page failed"))}>Next</button></div></div>
     </div>}
     {view==="agent"&&snapshot&&<div className="gc-stack"><div className="gc-agent-banner"><div><div className="gc-label-bright"><Icon name="spark"/> RULE-BASED GROWTH INTELLIGENCE</div><h2>Decisions grounded<br/>in operational truth.</h2><p>Observe → Diagnose → Prioritize → Propose → Execute → Verify → Record. Current suggestions are deterministic; no autonomous LLM execution is claimed.</p></div><span className="gc-agent-glyph"><Icon name="spark" size={52}/></span></div><section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">PRIORITIZED / {snapshot.actions.length} ITEMS</span><h2>Next best actions</h2></div></div>{snapshot.actions.length?snapshot.actions.map((a,i)=><div className="gc-agent-row" key={a.id}><span className="gc-action-index">{String(i+1).padStart(2,"0")}</span><div><div className="gc-agent-title"><h3>{a.title}</h3><Badge variant={a.priority==="high"?"warning":"neutral"}>{a.priority==="high"?"Prioritize":"Normal"}</Badge></div><p>{a.reason}</p><Link className="gc-button gc-button-subtle" href={a.href}>{a.label}<Icon name="arrow"/></Link></div></div>):<div className="gc-muted-block">No current actions from the rules engine. Refresh after commercial activity changes.</div>}</section></div>}
     {view==="revenue"&&snapshot&&<div className="gc-stack"><div className="gc-metrics"><Card label="Verified paying locations" value={snapshot.billing.payingLocations===null?"Not connected":snapshot.billing.payingLocations} hint="Live paid subscriptions"/><Card label="Recorded CAD receipts" value={snapshot.billing.collectedCadCents===null?"Not connected":new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(snapshot.billing.collectedCadCents/100)} hint="Paid Stripe invoice ledger; before fees" accent/><Card label="Billing mode" value={snapshot.stripe.mode||"Unavailable"} hint="Actual environment configuration"/><Card label="Stripe readiness" value={snapshot.stripe.configured?"Configured":"Action required"} hint="Checkout and webhook requirements"/></div><section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">PAYMENTS / SOURCE OF TRUTH</span><h2>Subscription revenue control</h2></div><Badge variant={snapshot.stripe.configured?"positive":"warning"}>{snapshot.stripe.configured?"Configured":"Not connected"}</Badge></div>{snapshot.stripe.configured?<p className="gc-bodycopy">Revenue values are derived from recorded paid Stripe invoices. This view does not claim net revenue after fees or prove real-time external reconciliation. Last account verification: {dateTime(snapshot.billing.verifiedAt)}.</p>:<><p className="gc-bodycopy">Live Checkout is not yet configured in this application. Lead forms, previews, audits and CRM remain available independently. No unverified payment or subscription count is shown.</p><div className="gc-blockers">{snapshot.stripe.reasons.map(s=><span key={s}>{s.replaceAll("_"," ")}</span>)}</div></>}</section></div>}
     {view==="activity"&&snapshot&&<section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">RECORDED EVENTS</span><h2>Operational timeline</h2><p>These entries come from database events; no synthetic activity is inserted.</p></div></div>{snapshot.activity.length?<div className="gc-timeline">{snapshot.activity.map((a,i)=><div key={a.event_type+a.created_at+i} className="gc-timeline-item"><span className="gc-timeline-mark"/><div><strong>{a.event_type.replaceAll("_"," ")}</strong><small>{a.actor} · {dateTime(a.created_at)}</small>{a.details?.statusTo&&<p>Moved to {String(a.details.statusTo)}</p>}</div></div>)}</div>:<div className="gc-muted-block">No recorded events yet.</div>}</section>}
     {view==="integrations"&&snapshot&&<div className="gc-stack"><section className="gc-panel"><div className="gc-section-head"><div><span className="gc-section-kicker">CONNECTED SYSTEMS</span><h2>Integration health</h2><p>Configuration and provider delivery are separate states.</p></div></div><div className="gc-integration"><span className="gc-integration-icon"><Icon name="shield"/></span><div><strong>PostgreSQL</strong><p>Database-backed inquiries, audits and operational history</p></div><Badge variant="positive">Online</Badge></div><div className="gc-integration"><span className="gc-integration-icon"><Icon name="mail"/></span><div><strong>Resend transactional email</strong><p>{snapshot.email.configured?"Environment variables present. Delivery and inbox receipt not independently confirmed.":"Required sender, recipient or API key is missing."}</p></div><Badge variant={snapshot.email.configured?"positive":"warning"}>{snapshot.email.configured?"Configured":"Action required"}</Badge></div><div className="gc-integration"><span className="gc-integration-icon"><Icon name="revenue"/></span><div><strong>Stripe Billing</strong><p>{snapshot.stripe.configured?"Required billing configuration present; mode "+snapshot.stripe.mode+".":"Live billing not established for this application."}</p></div><Badge variant={snapshot.stripe.configured?"positive":"warning"}>{snapshot.stripe.configured?"Configured":"Not connected"}</Badge></div></section><section className="gc-panel gc-diagnostic"><div><span className="gc-section-kicker">TRANSACTIONAL EMAIL</span><h2>Delivery diagnostic</h2><p>Send an authenticated rate-limited test to the configured operator recipient. Provider acceptance will not be presented as confirmed inbox delivery.</p></div><button disabled={busy||!snapshot.email.configured} className="gc-button gc-button-primary" onClick={testEmail}>Run email diagnostic <Icon name="arrow"/></button></section></div>}
     <footer className="gc-footer"><span>MISENORTH / GROWTH COMMAND</span><span>Real merchants only · No synthetic revenue</span></footer>
    </main>
   </div>
  </div>}
  {selected&&draft&&<div className="gc-drawer-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><aside className="gc-drawer" role="dialog" aria-modal="true" aria-labelledby="gc-detail-title"><div className="gc-drawer-top"><div><div className="gc-section-kicker">OPPORTUNITY / RECORD</div><h2 id="gc-detail-title">{selected.restaurant_name||selected.name}</h2><p>Received {dateTime(selected.created_at)}</p></div><button className="gc-icon-button" aria-label="Close opportunity details" onClick={()=>setSelected(null)}><Icon name="close"/></button></div><div className="gc-drawer-body"><div className="gc-profile-row"><span className="gc-initials gc-initials-large">{initials(selected.restaurant_name||selected.name)}</span><span><strong>{selected.name}</strong><a href={"mailto:"+selected.email}>{selected.email}</a></span><Badge>{selected.intent}</Badge></div>{selected.restaurant_website&&<div className="gc-detail-pair"><small>Restaurant website</small><a href={selected.restaurant_website} target="_blank" rel="noopener noreferrer">{selected.restaurant_website}<Icon name="external" size={14}/></a></div>}{selected.audit_id&&<div className="gc-detail-pair"><small>Attached website audit</small><Link href={"/grader/report/"+selected.audit_id} target="_blank" rel="noopener noreferrer">{selected.audited_hostname||"View report"} <Icon name="external" size={14}/></Link></div>}<div className="gc-detail-grid"><div className="gc-detail-pair"><small>Primary goal</small><strong>{selected.main_goal?.replaceAll("_"," ")||"Not specified"}</strong></div><div className="gc-detail-pair"><small>Acquisition source</small><strong>{selected.source||"Unknown"}</strong></div></div>{selected.message&&<div className="gc-detail-message"><small>MERCHANT MESSAGE</small><p>{selected.message}</p></div>}
   <div className="gc-drawer-divider"/><h3>Manage opportunity</h3><label className="gc-field">Pipeline stage<select value={draft.status} onChange={e=>setDraft(d=>d&&({...d,status:e.target.value as Stage}))}>{stages.map(s=><option value={s} key={s}>{stageNames[s]}</option>)}</select></label><label className="gc-field">Assigned operator<input value={draft.assignedTo} maxLength={120} onChange={e=>setDraft(d=>d&&({...d,assignedTo:e.target.value}))} placeholder="Operator name"/></label><label className="gc-field">Next follow-up<input type="datetime-local" value={draft.followUpAt} onChange={e=>setDraft(d=>d&&({...d,followUpAt:e.target.value}))}/></label><label className="gc-field">Private follow-up notes<textarea rows={4} maxLength={3000} value={draft.note} onChange={e=>setDraft(d=>d&&({...d,note:e.target.value}))} placeholder="Document the next step, objections or merchant requirements…"/></label>
   {history.length>0&&<div className="gc-record-history"><h3>Change history</h3>{history.map(h=><div key={h.created_at+h.event_type}><strong>{h.event_type.replaceAll("_"," ")}</strong><small>{dateTime(h.created_at)}</small></div>)}</div>}</div><div className="gc-drawer-footer"><button className="gc-button gc-button-subtle gc-delete" disabled={busy} onClick={deleteItem}>Delete permanently</button><button className="gc-button gc-button-primary" disabled={busy} onClick={saveItem}>{busy?"Saving…":"Save changes"} <Icon name="arrow"/></button></div></aside></div>}
 </div>;
}
