"use client";
import {useState} from "react";
import type {FormEvent} from "react";
export default function InquiryForm({intent="restaurant",auditId,headline}:{intent?:"restaurant"|"partner"|"investor";auditId?:string;headline?:string}){
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[restaurantName,setRestaurant]=useState(""),[message,setMessage]=useState(""),[website,setWebsite]=useState("");
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();if(busy||done)return;setBusy(true);setError("");
  try{
   const r=await fetch("/api/growth-inquiries",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({intent,auditId:auditId||null,name,email,restaurantName,message,website})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Unable to submit your request");
   setDone(true);
  }catch(e){setError(e instanceof Error?e.message:"Unable to submit your request");}finally{setBusy(false);}
 }
 if(done)return <div className="growth-inquiry-success" role="status"><strong>Request received.</strong><p>Thank you. Your inquiry is in the MiseNorth team inbox. We’ll use the contact details you submitted to follow up.</p></div>;
 return <form className="growth-inquiry-form" onSubmit={submit}><h3>{headline||(intent==="restaurant"?"Let’s improve your restaurant’s digital home.":"Start a conversation")}</h3><p>Tell us a little about what you're working on. No account required.</p><div className="growth-inquiry-fields"><label>Your name<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label><label>Email address<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label></div><label>{intent==="restaurant"?"Restaurant name":"Organization / project (optional)"}<input maxLength={180} value={restaurantName} onChange={e=>setRestaurant(e.target.value)}/></label><label>How can we help?<textarea rows={3} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder={intent==="restaurant"?"Current website, location, what you’d like to improve…":"Your background, interests and proposed collaboration…"}/></label><label style={{display:"none"}} aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>{error&&<p role="alert" className="growth-form-error">{error}</p>}<button disabled={busy} type="submit" className="growth-primary">{busy?"Sending…":intent==="restaurant"?"Request my setup conversation ↗":"Send inquiry ↗"}</button><small>We use these details to respond to your inquiry. Submitting does not subscribe you to marketing.</small></form>;
}
