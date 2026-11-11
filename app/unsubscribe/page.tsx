"use client";
import {useEffect,useState} from "react";

export default function UnsubscribePage(){
 const [token,setToken]=useState("");
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<"ready"|"success"|"invalid"|"error">("ready");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const value=new URLSearchParams(window.location.hash.replace(/^#/,"")).get("token")||"";
  setToken(value);
  if(!value){setStatus("invalid");setMessage("This unsubscribe link is missing or incomplete.");}
 },[]);
 async function withdraw(){
  if(!token||busy)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/consent/withdraw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});
   const result=await response.json();
   if(!response.ok){
    setStatus(response.status===404?"invalid":"error");
    setMessage(response.status===404?"This link has already been used or is no longer valid.":result.error||"The request could not be completed.");
    return;
   }
   setStatus("success");
   setMessage("You are unsubscribed from marketing emails from this restaurant. Operational messages about an order or reservation are unaffected.");
   setToken("");
   window.history.replaceState(null,"","/unsubscribe");
  }catch{
   setStatus("error");setMessage("The request could not be completed. Please try again.");
  }finally{setBusy(false);}
 }
 return <main className="auth-shell"><aside className="auth-aside"><a href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</a><div><div className="eyebrow">Guest preferences</div><h1>Your inbox.<br/>Your choice.</h1><p>Manage promotional email preferences for a restaurant.</p></div><small>Order and reservation updates are separate.</small></aside><section className="auth-main"><section className="auth-card"><div className="eyebrow">Email preferences</div><h2>{status==="success"?"You are unsubscribed": "Unsubscribe from marketing emails"}</h2><p className="muted tiny">This action changes only promotional email consent for the restaurant that issued this link.</p>{message&&<div className={status==="success"?"success":"notice"}>{message}</div>}{status==="ready"&&token&&<><p>Confirm that you no longer wish to receive promotional emails from this restaurant.</p><button className="btn full" disabled={busy} onClick={withdraw}>{busy?"Updating preferences…":"Unsubscribe me"}</button></>}{status==="error"&&<button className="btn full" disabled={busy} onClick={withdraw}>Try again</button>}<p className="tiny muted" style={{marginTop:18}}>MiseNorth does not send marketing messages unless the restaurant connects an approved sender and verifies consent controls.</p></section></section></main>;
}
