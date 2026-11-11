"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

export default function AcceptInvite(){
 const [token,setToken]=useState("");
 const [name,setName]=useState("");
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<"ready"|"success"|"invalid"|"error">("ready");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const value=new URLSearchParams(window.location.hash.replace(/^#/,"")).get("token")||"";
  setToken(value);
  if(!value){setStatus("invalid");setMessage("This invitation link is missing or incomplete.");}
 },[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(password!==confirm){setStatus("error");setMessage("The passwords do not match.");return;}
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/team/accept",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,name,password})});
   const result=await response.json();
   if(!response.ok){setStatus(response.status===404?"invalid":"error");setMessage(result.error||"The invitation could not be accepted.");return;}
   setStatus("success");setMessage("Your account is ready. You can now sign in to the restaurant workspace.");
   setToken("");window.history.replaceState(null,"","/accept-invite");
  }catch{
   setStatus("error");setMessage("The invitation could not be accepted. Please try again.");
  }finally{setBusy(false);}
 }
 return <main className="auth-shell"><aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><div className="eyebrow">Restaurant team</div><h1>Join the<br/>workspace.<br/>Support great<br/>service.</h1><p>Accept a secure invitation from a restaurant owner.</p></div><small>Vancouver · British Columbia</small></aside><section className="auth-main"><form className="auth-card" onSubmit={submit}><div className="eyebrow">Team invitation</div><h2>{status==="success"?"Invitation accepted":"Set up your team account"}</h2><p className="muted tiny">The link is single-use and expires after seven days.</p>{message&&<div className={status==="success"?"success":"notice"}>{message}</div>}{status==="ready"&&token&&<><div className="field"><label>Your name</label><input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></div><div className="field"><label>Password · 12+ characters</label><input type="password" required minLength={12} maxLength={100} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/></div><div className="field"><label>Confirm password</label><input type="password" required minLength={12} maxLength={100} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/></div><button className="btn full" disabled={busy}>{busy?"Accepting invitation…":"Accept invitation"}</button></>}{status==="success"&&<Link className="btn full" href="/login">Sign in ↗</Link>}<p className="tiny muted" style={{marginTop:18}}><Link href="/login" className="text-link">Back to sign in</Link></p></form></section></main>;
}
