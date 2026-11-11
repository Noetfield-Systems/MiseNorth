"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

export default function ResetPassword(){
 const [token,setToken]=useState("");
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<"ready"|"success"|"invalid"|"error">("ready");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const value=new URLSearchParams(window.location.hash.replace(/^#/,"")).get("token")||"";
  setToken(value);
  if(!value){setStatus("invalid");setMessage("This password reset link is missing or incomplete.");}
 },[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(password!==confirm){setMessage("The passwords do not match.");setStatus("error");return;}
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/auth/reset-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,password})});
   const result=await response.json();
   if(!response.ok){setStatus(response.status===404?"invalid":"error");setMessage(result.error||"The reset link is no longer valid.");return;}
   setStatus("success");setMessage("Your password has been updated. All existing sessions have been revoked; sign in again.");
   setToken("");window.history.replaceState(null,"","/reset-password");
  }catch{
   setStatus("error");setMessage("The password could not be updated. Please try again.");
  }finally{setBusy(false);}
 }
 return <main className="auth-shell"><aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">Account security</div><h1>A safer<br/>way back in.</h1><p>Your reset link is single-use and expires after two hours.</p></div><small>Vancouver · British Columbia</small></aside><section className="auth-main"><form className="auth-card" onSubmit={submit}><div className="eyebrow">Password recovery</div><h2>{status==="success"?"Password updated":"Choose a new password"}</h2><p className="muted tiny">Use at least 12 characters. Your previous sessions will be revoked.</p>{message&&<div className={status==="success"?"success":"notice"}>{message}</div>}{status==="ready"&&token&&<><div className="field"><label>New password</label><input type="password" minLength={12} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></div><div className="field"><label>Confirm password</label><input type="password" minLength={12} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div><button className="btn full" disabled={busy}>{busy?"Updating password…":"Update password"}</button></>}{status==="success"&&<Link className="btn full" href="/login">Continue to sign in</Link>}<p className="tiny muted" style={{marginTop:18}}><Link href="/login" className="text-link">Back to sign in</Link></p></form></section></main>;
}
