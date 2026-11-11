"use client";
import {useState} from "react";
export default function DemoLauncher({slug}:{slug:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function launch(){setBusy(true);setError("");try{const r=await fetch("/api/demo/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Demo could not be opened");window.location.assign("/admin");}catch(e){setError(e instanceof Error?e.message:"Demo could not be opened");setBusy(false);}}
 return <span className="demo-launch-wrap"><button type="button" className="btn small" onClick={launch} disabled={busy}>{busy?"Opening…":"Open owner workspace ↗"}</button>{error&&<span role="alert" className="demo-launch-error">{error}</span>}</span>;
}
