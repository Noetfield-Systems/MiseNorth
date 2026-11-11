"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import InquiryForm from "../components/inquiry-form";
import type {FormEvent} from "react";

export default function Signup(){
 const [registrationReady,setRegistrationReady]=useState<boolean|null>(null);
 useEffect(()=>{fetch("/api/public/launch-status",{cache:"no-store"}).then(r=>r.json()).then(v=>setRegistrationReady(Boolean(v.registration?.enabled))).catch(()=>setRegistrationReady(false));},[]);
 const [f,setF]=useState({ownerName:"",email:"",password:"",restaurantName:"",phone:"",address:""});
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [pendingEmail,setPendingEmail]=useState("");
 const [deliveryConfigured,setDeliveryConfigured]=useState(true);
 const [busy,setBusy]=useState(false);
 const change=(k:string,v:string)=>setF(p=>({...p,[k]:v}));
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(f)});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Workspace creation failed");
   setPendingEmail(f.email);
   setDeliveryConfigured(d.delivery==="sent");
   setNotice(d.delivery==="sent"
    ?"Your restaurant workspace is created. Check your email and verify the address before signing in."
    :"Your workspace is pending email verification. MiseNorth's verified email sender is not configured yet; the account will remain inaccessible until a verification email can be sent.");
  }catch(x){setError(x instanceof Error?x.message:"Workspace creation failed");}
  finally{setBusy(false);}
 }
 async function resend(){
  if(!pendingEmail||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/auth/resend-verification",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:pendingEmail})});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Unable to request a new verification email");
   setNotice(deliveryConfigured?"Check your inbox for a new verification link.":"The request was recorded. The verified email sender must be configured before a link can be delivered.");
  }catch(x){setError(x instanceof Error?x.message:"Unable to request a new verification email");}
  finally{setBusy(false);}
 }
 if(registrationReady===null)return <main className="auth-main"><p className="notice">Checking registration availability…</p></main>;
 if(!registrationReady)return <main className="auth-shell"><aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">Founding restaurant access</div><h1>Start with your restaurant, not paperwork.</h1><p>We are activating verified email onboarding. Submit a setup request now, without creating an inaccessible account.</p></div><small>MiseNorth · A Noetfield Systems Inc. product</small></aside><section className="auth-main"><div className="auth-card" style={{maxWidth:490,width:"100%"}}><InquiryForm intent="restaurant" source="signup" headline="Request restaurant access"/><p className="tiny muted" style={{marginTop:12}}><Link href="/demo" className="text-link">Explore the working demo ↗</Link></p></div></section></main>;
 return <main className="auth-shell">
  <aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">Your restaurant, connected</div><h1>Build your<br/>digital home.<br/>Keep every<br/>guest in view.</h1><p>Create a private restaurant workspace. Your real menu, guests and orders belong to your business—no sample data is inserted.</p></div><small>Made for Vancouver hospitality businesses.</small></aside>
  <section className="auth-main"><form className="auth-card" onSubmit={submit}>
   <div className="eyebrow">Get started</div><h2>Create your restaurant</h2><p className="muted tiny">Your private restaurant workspace and owner account.</p>
   {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
   {!pendingEmail&&<>
    <div className="field"><label>Restaurant name</label><input required minLength={2} value={f.restaurantName} onChange={e=>change("restaurantName",e.target.value)} autoComplete="organization"/></div>
    <div className="field"><label>Your name</label><input required minLength={2} value={f.ownerName} onChange={e=>change("ownerName",e.target.value)} autoComplete="name"/></div>
    <div className="field"><label>Business email</label><input type="email" required value={f.email} onChange={e=>change("email",e.target.value)} autoComplete="email"/></div>
    <div className="field"><label>Password · 12+ characters</label><input type="password" minLength={12} required value={f.password} onChange={e=>change("password",e.target.value)} autoComplete="new-password"/></div>
    <div className="form-grid"><div className="field"><label>Phone</label><input value={f.phone} onChange={e=>change("phone",e.target.value)}/></div><div className="field"><label>Street address</label><input value={f.address} onChange={e=>change("address",e.target.value)}/></div></div>
    <label className="consent"><input type="checkbox" required/> I agree to the platform terms and understand tax, privacy and guest communications must be reviewed before operating.</label>
    <button className="btn full" disabled={busy}>{busy?"Creating workspace…":"Create restaurant workspace ↗"}</button>
   </>}
   {pendingEmail&&<><p className="tiny muted">Verification address: <strong>{pendingEmail}</strong></p><button type="button" className="btn full" disabled={busy||!deliveryConfigured} onClick={resend}>{busy?"Requesting…":"Resend verification link"}</button><p className="tiny muted">Your workspace is not accessible until the email address is verified.</p></>}
   <p className="tiny muted">Already registered? <Link href="/login" className="text-link">Sign in</Link></p>
  </form></section>
 </main>;
}
