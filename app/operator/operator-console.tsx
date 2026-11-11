"use client";
import {useCallback,useEffect,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";
type Item={id:string;created_at:string;name:string;email:string;restaurant_name:string;message:string;intent:string;status:string;operator_note:string|null;audited_hostname:string|null;audit_id:string|null};
type Counts={total:number;new_count:number;restaurants:number;partners:number;investors:number};
export default function OperatorConsole(){
 const [auth,setAuth]=useState<"loading"|"locked"|"ready">("loading");
 const [key,setKey]=useState(""),[items,setItems]=useState<Item[]>([]);
 const [counts,setCounts]=useState<Counts|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[page,setPage]=useState(0);
 const [edits,setEdits]=useState<Record<string,{status:string;note:string}>>({});
 const load=useCallback(async(n:number)=>{
  const res=await fetch("/api/operator/inquiries?page="+n,{cache:"no-store"});
  if(res.status===401){setAuth("locked");return;}
  const data=await res.json();if(!res.ok)throw new Error(data.error||"Unable to load inquiries");
  setItems(data.items);setCounts(data.counts);setPage(n);setAuth("ready");
  setEdits(Object.fromEntries(data.items.map((i:Item)=>[i.id,{status:i.status,note:i.operator_note||""}])));
 },[]);
 useEffect(()=>{load(0).catch(()=>setAuth("locked"));},[load]);
 async function login(e:FormEvent){e.preventDefault();setBusy(true);setError("");
  try{const res=await fetch("/api/operator/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:key})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Access denied");setKey("");await load(0);}
  catch(e){setError(e instanceof Error?e.message:"Login failed");}finally{setBusy(false);}
 }
 async function logout(){await fetch("/api/operator/session",{method:"DELETE"});setAuth("locked");setItems([]);}
 async function save(i:Item){setBusy(true);setError("");
  try{const e=edits[i.id]||{status:i.status,note:i.operator_note||""};const r=await fetch("/api/operator/inquiries/"+i.id,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(e)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Update failed");await load(page);}
  catch(e){setError(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}
 }
 async function remove(i:Item){if(!window.confirm("Delete this inquiry and its personal contact details?"))return;setBusy(true);setError("");
  try{const r=await fetch("/api/operator/inquiries/"+i.id,{method:"DELETE"});if(!r.ok)throw new Error("Delete failed");await load(page);}
  catch(e){setError(e instanceof Error?e.message:"Delete failed");}finally{setBusy(false);}
 }
 return <main className="operator-shell"><header className="operator-header"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><span>Private growth operations</span>{auth==="ready"?<button className="btn ghost small" onClick={logout}>Sign out</button>:<Link href="/" className="btn ghost small">Home</Link>}</header>
 {auth==="loading"?<p className="operator-loading">Checking session…</p>:auth==="locked"?<section className="operator-login"><div className="eyebrow">PRIVATE · OPERATOR ONLY</div><h1>Lead inbox</h1><p>Use the operator access key. Contact data is never exposed without authentication.</p><form onSubmit={login}><label>Access key<input type="password" required autoComplete="off" value={key} onChange={e=>setKey(e.target.value)}/></label>{error&&<p className="error" role="alert">{error}</p>}<button disabled={busy} className="btn full">{busy?"Verifying…":"Open inbox"}</button></form></section>:
 <section className="operator-main"><div className="operator-head"><div><div className="eyebrow">MISE NORTH / SALES OPERATIONS</div><h1>Inbound opportunities</h1><p>Submitted requests only. Synthetic restaurant demos are not customers.</p></div><button className="btn secondary" onClick={()=>load(page).catch(()=>setError("Refresh failed"))}>Refresh</button></div>
 {counts&&<div className="operator-counts">{([["Total",counts.total],["New",counts.new_count],["Restaurants",counts.restaurants],["Partners",counts.partners],["Investors",counts.investors]] as const).map(([label,n])=><div key={label}><small>{label}</small><strong>{n}</strong></div>)}</div>}
 {error&&<p className="error" role="alert">{error}</p>}
 <div className="operator-list">{items.length===0?<div className="operator-empty">No inquiries on this page. Share the Grader to attract restaurant prospects.</div>:items.map(i=><article className="operator-item" key={i.id}>
  <div className="operator-item-top"><div><small>{new Date(i.created_at).toLocaleString("en-CA")}</small><h2>{i.restaurant_name||i.name}</h2><p>{i.name} · <a href={"mailto:"+i.email}>{i.email}</a></p></div><b>{i.intent}</b></div>
  {i.message&&<p className="operator-note-message">{i.message}</p>}
  {i.audit_id&&<a className="text-link" href={"/grader/report/"+i.audit_id} target="_blank" rel="noopener noreferrer">Audit: {i.audited_hostname||"website"} ↗</a>}
  <div className="operator-editor"><label>Status<select value={edits[i.id]?.status||i.status} onChange={e=>setEdits(a=>({...a,[i.id]:{status:e.target.value,note:a[i.id]?.note||""}}))}>{["new","contacted","qualified","won","lost"].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="operator-editor-note">Private follow-up note<textarea maxLength={3000} rows={2} value={edits[i.id]?.note||""} onChange={e=>setEdits(a=>({...a,[i.id]:{status:a[i.id]?.status||i.status,note:e.target.value}}))}/></label><button className="btn" disabled={busy} onClick={()=>save(i)}>Save</button><button className="btn ghost" disabled={busy} onClick={()=>remove(i)}>Delete</button></div>
 </article>)}</div>
 <div className="operator-pagination"><button className="btn ghost" disabled={page===0||busy} onClick={()=>load(page-1)}>Previous</button><span>Page {page+1}</span><button className="btn ghost" disabled={items.length<40||busy} onClick={()=>load(page+1)}>Next</button></div>
 </section>}</main>;
}
