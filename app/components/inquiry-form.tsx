"use client";
import {useState} from "react";
import type {FormEvent} from "react";
export default function InquiryForm({intent="restaurant",auditId,headline,source}:{intent?:"restaurant"|"partner"|"investor";auditId?:string;headline?:string;source?:string}){
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[restaurantName,setRestaurant]=useState(""),[restaurantWebsite,setRestaurantWebsite]=useState("");
 const [goal,setGoal]=useState("not_sure"),[message,setMessage]=useState(""),[honeypot,setHoneypot]=useState("");
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent){
  e.preventDefault();if(busy||done)return;setBusy(true);setError("");
  try{
   const r=await fetch("/api/growth-inquiries",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
    intent,auditId:auditId||null,name,email,restaurantName,restaurantWebsite,goal,source:source||(auditId?"audit_report":"website"),message,website:honeypot
   })});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to submit your request");
   setDone(true);
  }catch(x){setError(x instanceof Error?x.message:"Unable to submit your request");}finally{setBusy(false);}
 }
 if(done)return <div className="growth-inquiry-success" role="status"><strong>Request received.</strong><p>Your details are in our private restaurant sales inbox. We will use the email you provided to follow up about your request.</p><p><strong>What happens next?</strong> We review your current website and the workflow you want to improve before discussing a setup or pricing.</p></div>;
 const isRestaurant=intent==="restaurant";
 return <form className="growth-inquiry-form mn-sales-form" onSubmit={submit}>
  <h3>{headline||(isRestaurant?"See it for your restaurant.":"Start a conversation.")}</h3>
  <p>{isRestaurant?"No card. No obligation. Just tell us where your restaurant is and how to reach you.":"Tell us how you would like to collaborate."}</p>
  <label>{isRestaurant?"Restaurant name":"Business or organization"}<input required={isRestaurant} maxLength={180} value={restaurantName} onChange={e=>setRestaurant(e.target.value)} autoComplete="organization" placeholder={isRestaurant?"Your restaurant name":"Organization (optional)"}/></label>
  <div className="growth-inquiry-fields">
   <label>Your name<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Full name"/></label>
   <label>Work email<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@restaurant.ca"/></label>
  </div>
  {isRestaurant&&<>
   <label>Website (optional)<input maxLength={600} inputMode="url" value={restaurantWebsite} onChange={e=>setRestaurantWebsite(e.target.value)} placeholder="yourrestaurant.ca"/></label>
   <label>What would you most like to improve?<select value={goal} onChange={e=>setGoal(e.target.value)}><option value="not_sure">Help me find the biggest opportunity</option><option value="website">Better restaurant website & menu</option><option value="direct_requests">More direct guest requests</option><option value="reservations">Simpler reservations & guest follow-up</option></select></label>
  </>}
  <details className="mn-sales-optional"><summary>Add a note (optional) <span>+</span></summary><label>Tell us a little more<textarea rows={3} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Your existing tools, location, or what feels difficult today…"/></label></details>
  <label className="mn-trap" aria-hidden="true" tabIndex={-1}>Do not complete this field<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label>
  {error&&<p role="alert" className="growth-form-error">{error}</p>}
  <button type="submit" className="growth-primary" disabled={busy}>{busy?"Sending your request…":isRestaurant?"Request my restaurant setup ↗":"Send inquiry ↗"}</button>
  <small>We use your details to respond to this request. No marketing subscription or payment occurs by submitting.</small>
 </form>;
}
