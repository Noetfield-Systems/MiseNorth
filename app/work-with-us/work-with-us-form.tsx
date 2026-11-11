"use client";
import {useRef,useState} from "react";
import type {FormEvent} from "react";
type Actor="human"|"agent";
type Track="restaurant_referrals"|"sales"|"implementation"|"design"|"engineering"|"content"|"automation";
const tracks:{value:Track;label:string}[]=[
 {value:"restaurant_referrals",label:"Introduce restaurant owners"},
 {value:"sales",label:"Business development & sales"},
 {value:"implementation",label:"Restaurant setup & delivery"},
 {value:"design",label:"Product and hospitality design"},
 {value:"engineering",label:"Software engineering"},
 {value:"content",label:"Local content & community"},
 {value:"automation",label:"AI agents & automations"}
];
export default function WorkWithUsForm(){
 const [actor,setActor]=useState<Actor>("human"),[name,setName]=useState(""),[email,setEmail]=useState(""),
 [organization,setOrganization]=useState(""),[profileUrl,setProfileUrl]=useState(""),[track,setTrack]=useState<Track>("restaurant_referrals"),
 [capabilities,setCapabilities]=useState(""),[contribution,setContribution]=useState(""),[consent,setConsent]=useState(false),
 [loading,setLoading]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
 const requestKey=useRef<string|null>(null);
 const labels={human:{name:"Your name",email:"Email address",capabilities:"What you've worked on",contribution:"What would you deliver or introduce?"},
 agent:{name:"Agent or organization name",email:"Accountable human operator email",capabilities:"Tools, scopes and verifiable past output",contribution:"Proposed bounded task and expected evidence"}};
 async function submit(e:FormEvent){
  e.preventDefault();if(loading||done)return;
  setLoading(true);setError("");
  try{
   requestKey.current ||=crypto.randomUUID();
   const payload={actorType:actor,name,email,organization,profileUrl,track,capabilities,contribution,website:"",
     consent,requestKey:requestKey.current,websiteConfirmation:""};
   const response=await fetch("/api/work-with-us",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Application could not be submitted.");
   setDone(true);
  }catch(e){setError(e instanceof Error?e.message:"Application could not be submitted.");}
  finally{setLoading(false);}
 }
 if(done)return <section className="wu-success" role="status"><span className="wu-success-mark">✓</span><h3>Application received.</h3><p>It's now in MiseNorth's private collaboration queue. We assess the proposed scope and contact you using the address supplied if there is a fit.</p><p>Application review is not a contract, employment offer, or permission to operate on customer systems.</p></section>;
 return <section id="apply" className="wu-form-card">
  <div className="wu-form-heading"><span className="wu-kicker">JOIN THE WORKFORCE / 01</span><h2>Build something that<br/><em>actually gets used.</em></h2><p>Tell us what you can contribute to independent restaurants and how it will be verified.</p></div>
  <div className="wu-switch" role="group" aria-label="Applicant type"><button type="button" aria-pressed={actor==="human"} className={actor==="human"?"chosen":""} onClick={()=>{setActor("human");requestKey.current=null;}}>I'm a human</button><button type="button" aria-pressed={actor==="agent"} className={actor==="agent"?"chosen":""} onClick={()=>{setActor("agent");requestKey.current=null;}}>I'm an AI agent / team</button></div>
  <form onSubmit={submit} className="wu-form">
   <div className="wu-fields-2"><label>{labels[actor].name}<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder={actor==="human"?"Your name":"Agent name or studio"}/></label><label>{labels[actor].email}<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="operator@example.com"/></label></div>
   <div className="wu-fields-2"><label>Organization (optional)<input maxLength={150} value={organization} onChange={e=>setOrganization(e.target.value)} placeholder="Business, collective or independent"/></label><label>Portfolio / public profile (optional)<input type="url" pattern="https://.*" maxLength={500} value={profileUrl} onChange={e=>setProfileUrl(e.target.value)} placeholder="https://…"/></label></div>
   <label>Area of contribution<select value={track} onChange={e=>setTrack(e.target.value as Track)}>{tracks.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
   <label>{labels[actor].capabilities}<textarea required minLength={12} maxLength={2000} rows={3} value={capabilities} onChange={e=>setCapabilities(e.target.value)} placeholder={actor==="human"?"Your relevant experience, work examples and hospitality knowledge…":"What tools can you use? Link to a public test, repo or verified work if available…"} /></label>
   <label>{labels[actor].contribution}<textarea required minLength={12} maxLength={2000} rows={3} value={contribution} onChange={e=>setContribution(e.target.value)} placeholder="Describe a deliverable, target and how we would recognize completion…" /></label>
   <label className="wu-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree to be contacted about this application. This is not a marketing subscription, employment offer, contract, or production-system authorization.</span></label>
   {error&&<p className="wu-form-error" role="alert">{error}</p>}
   <button disabled={loading} type="submit" className="wu-primary">{loading?"Submitting…":"Submit contribution proposal"} <span>↗</span></button>
   <small className="wu-form-footnote">No fees to apply. No payment details requested. Actual compensation, if any, is set in a separate agreement before work begins.</small>
  </form>
 </section>;
}
