"use client";
import Link from "next/link";
import {useState} from "react";
import type {FormEvent} from "react";

export default function ForgotPassword(){
 const [email,setEmail]=useState("");
 const [busy,setBusy]=useState(false);
 const [sent,setSent]=useState(false);
 const [error,setError]=useState("");
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");
  try{
   const response=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Unable to process the request");
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:"Unable to process the request");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell"><aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">Account security</div><h1>Regain access.<br/>Keep your<br/>restaurant moving.</h1><p>Password reset links are time-limited and can only be used once.</p></div><small>Vancouver · British Columbia</small></aside><section className="auth-main"><form className="auth-card" onSubmit={submit}><div className="eyebrow">Password recovery</div><h2>Forgot your password?</h2><p className="muted tiny">Enter the verified email address for your restaurant account.</p>{error&&<div className="error">{error}</div>}{sent?<div className="success">If this account is eligible, a password reset email will be sent. Check your inbox.</div>:<><div className="field"><label>Email address</label><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><button className="btn full" disabled={busy}>{busy?"Requesting…":"Send password reset link"}</button></>}<p className="tiny muted" style={{marginTop:18}}><Link href="/login" className="text-link">Back to sign in</Link></p></form></section></main>;
}
