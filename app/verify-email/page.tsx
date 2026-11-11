"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

export default function VerifyEmail(){
 const [token,setToken]=useState("");
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<"ready"|"success"|"invalid"|"error">("ready");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const value=new URLSearchParams(window.location.hash.replace(/^#/,"")).get("token")||"";
  setToken(value);
  if(!value){setStatus("invalid");setMessage("This verification link is missing or incomplete.");}
 },[]);
 async function verify(){
  if(!token||busy)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/auth/verify-email",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});
   const result=await response.json();
   if(!response.ok){
    setStatus(response.status===404?"invalid":"error");
    setMessage(result.error||"This verification link is no longer valid.");
    return;
   }
   setStatus("success");setMessage("Your email is verified. You can now sign in to your restaurant workspace.");
   setToken("");window.history.replaceState(null,"","/verify-email");
  }catch{
   setStatus("error");setMessage("Verification could not be completed. Please try again.");
  }finally{setBusy(false);}
 }
 return <main className="auth-shell"><aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">Account security</div><h1>Your restaurant.<br/>Your workspace.<br/>Verified.</h1><p>Verify the business email address to activate the owner account.</p></div><small>Vancouver · British Columbia</small></aside><section className="auth-main"><section className="auth-card"><div className="eyebrow">Email verification</div><h2>{status==="success"?"Email verified":"Verify your email address"}</h2><p className="muted tiny">The verification link is single-use and expires after 24 hours.</p>{message&&<div className={status==="success"?"success":"notice"}>{message}</div>}{status==="ready"&&token&&<button className="btn full" disabled={busy} onClick={verify}>{busy?"Verifying…":"Verify email address"}</button>}{status==="error"&&<button className="btn full" disabled={busy} onClick={verify}>Try again</button>}{status==="success"&&<Link href="/login" className="btn full">Continue to sign in</Link>}<p className="tiny muted" style={{marginTop:18}}>Did not receive a link? <Link href="/signup" className="text-link">Return to registration</Link>.</p></section></section></main>;
}
