"use client";
import Link from "next/link";
import {useState} from "react";
import type {FormEvent} from "react";

export default function Login(){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [verificationRequired,setVerificationRequired]=useState(false);
 const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");setVerificationRequired(false);
  try{
   const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
   const d=await r.json();
   if(!r.ok){
    if(d.code==="EMAIL_VERIFICATION_REQUIRED")setVerificationRequired(true);
    throw new Error(d.error||"Sign in failed");
   }
   location.href="/admin";
  }catch(x){setError(x instanceof Error?x.message:"Sign in failed");}
  finally{setBusy(false);}
 }
 async function resend(){
  if(!email||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/auth/resend-verification",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Unable to request a new verification email");
   setNotice("If this account needs verification, a new link will be sent. Check your inbox.");
  }catch(x){setError(x instanceof Error?x.message:"Unable to request a new verification email");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell">
  <aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">The restaurant workspace</div><h1>More clarity.<br/>Better service.<br/>Stronger guest<br/>relationships.</h1><p>Sign in to manage your restaurant's digital experience and operating day.</p></div><small>Vancouver · British Columbia</small></aside>
  <section className="auth-main"><form className="auth-card" onSubmit={submit}>
   <div className="eyebrow">Welcome back</div><h2>Sign in to MiseNorth</h2><p className="muted tiny">Access your restaurant workspace.</p>
   {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
   <div className="field"><label>Email address</label><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
   <div className="field"><label>Password</label><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
   <button className="btn full" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
   {verificationRequired&&<button type="button" className="btn ghost full" style={{marginTop:10}} disabled={busy} onClick={resend}>Resend verification email</button>}
   <p className="tiny muted"><Link href="/forgot-password" className="text-link">Forgot password?</Link></p><p className="tiny muted">New to MiseNorth? <Link href="/signup" className="text-link">Create a restaurant account</Link></p>
  </form></section>
 </main>;
}
