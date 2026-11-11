"use client";
import {useState} from "react";
import type {FormEvent} from "react";
export default function MarketingAudit({compact=false}:{compact?:boolean}){
 const [website,setWebsite]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setError("");
  try{
   const r=await fetch("/api/grader",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({website})});
   const d=await r.json();if(!r.ok||!d.id)throw new Error(d.error||"We couldn't scan that website.");
   window.location.assign("/grader/report/"+encodeURIComponent(d.id));
  }catch(x){setError(x instanceof Error?x.message:"Could not complete the scan.");setBusy(false);}
 }
 return <form className={"mn-audit-form"+(compact?" mn-audit-compact":"")} onSubmit={submit} aria-label="Free restaurant website audit">
  {!compact&&<label htmlFor="mn-home-url">Enter your restaurant website to see what needs attention</label>}
  <div className="mn-audit-control">
   <span className="mn-url-prefix" aria-hidden="true">↗</span>
   <input id={compact?"mn-footer-url":"mn-home-url"} name="website" inputMode="url" autoComplete="url" type="text" maxLength={600} required value={website} onChange={e=>setWebsite(e.target.value)} placeholder="yourrestaurant.ca" aria-label="Restaurant website address"/>
   <button type="submit" disabled={busy||!website.trim()}>{busy?"Checking your site…":"Scan my website"} <span aria-hidden="true">→</span></button>
  </div>
  {error&&<p role="alert" className="mn-audit-error">{error}</p>}
  <p className="mn-audit-caption"><span aria-hidden="true">✓</span> No card or sign-up needed <span aria-hidden="true">·</span> Measured technical checks only</p>
 </form>;
}
