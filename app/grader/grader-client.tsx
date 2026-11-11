"use client";
import {useState} from "react";
import type {FormEvent} from "react";
export default function GraderClient(){
 const [website,setWebsite]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/grader",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({website})});
   const data=await res.json();
   if(!res.ok||!data.id)throw new Error(data.error||"We could not complete this website audit.");
   window.location.assign("/grader/report/"+encodeURIComponent(data.id));
  }catch(e){setError(e instanceof Error?e.message:"The audit could not be completed.");setBusy(false);}
 }
 return <form className="growth-grader-form" onSubmit={submit}><label htmlFor="growth-website">Your restaurant website</label><div><input id="growth-website" type="text" inputMode="url" autoComplete="url" required maxLength={600} placeholder="yourrestaurant.com" value={website} onChange={e=>setWebsite(e.target.value)}/><button type="submit" disabled={busy||!website.trim()}>{busy?"Running the audit…":"Get free report ↗"}</button></div>{error&&<p role="alert" className="growth-form-error">{error}</p>}<small>Free public-site scan. Scans may take several seconds; results are based on available measurements. We do not require your email for an audit.</small></form>;
}
