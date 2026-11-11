/** Public-only research audits of three independently verified Vancouver restaurant websites.
 * Never creates merchant leads, sends messages, opens checkout, or claims affiliation.
 */
import {writeFileSync} from "node:fs";
const base=(process.env.BASE_URL||"https://misenorth-growth-production.up.railway.app").replace(/\/$/,"");
const cases=[
 {name:"Nuba",url:"https://www.nuba.ca/",model:"multilocation/hospitality",source:"https://www.nuba.ca/"},
 {name:"Tacofino",url:"https://www.tacofino.com/",model:"multiunit/fast_casual",source:"https://www.tacofino.com/locations"},
 {name:"Vij's",url:"https://www.vijs.ca/",model:"single_location/full_service",source:"https://www.vijs.ca/"}
];
const result={timestamp:new Date().toISOString(),auditSource:"MiseNorth public website grader",
 note:"Independent public-site research. None of these businesses are represented as customers, collaborators, or endorsers.",
 businesses:[]};
let verified=0;
for(const business of cases){
 const evidence={...business,status:"NOT_VERIFIED",score:null,coverage:null,reportUrl:null,previewUrl:null,sourceType:null,error:null};
 try{
  const response=await fetch(base+"/api/grader",{method:"POST",headers:{"content-type":"application/json","origin":base,"user-agent":"MiseNorth-public-research/1.0"},
   body:JSON.stringify({website:business.url}),signal:AbortSignal.timeout(42000)});
  const body=await response.json().catch(()=>({}));
  if(response.ok && body.ok && body.id && body.report){
   const report=await fetch(base+"/api/grader/report/"+body.id,{signal:AbortSignal.timeout(15000)});
   const preview=await fetch(base+"/grader/report/"+body.id+"/preview",{signal:AbortSignal.timeout(15000)});
   const data=await report.json().catch(()=>({}));
   if(report.ok&&preview.ok&&data.report?.hostname===new URL(business.url).hostname){
    evidence.status="PUBLIC_WEBSITE_REPORT_VERIFIED";
    evidence.reportUrl=base+"/grader/report/"+body.id;
    evidence.previewUrl=base+"/grader/report/"+body.id+"/preview";
    evidence.score=typeof body.report.score==="number"?body.report.score:null;
    evidence.coverage=body.report.coverage||null;
    evidence.sourceType=body.report.source||null;
    verified++;
   }else evidence.error="Audit report/preview did not match the inspected public hostname";
  }else evidence.error="HTTP "+response.status+": "+String(body.code||body.error||"provider unavailable").slice(0,150);
 }catch(e){evidence.error=String(e instanceof Error?e.message:e).slice(0,180);}
 result.businesses.push(evidence);
 console.log(evidence.name, evidence.status, evidence.sourceType||"",evidence.score??"",evidence.error||"");
}
result.verifiedCount=verified;
writeFileSync(process.env.CASE_STUDY_OUTPUT||"public-research-audits.json",JSON.stringify(result,null,2)+"\n");
console.log("Public research verification:",verified+"/3","(not customer conversions)");
if(verified!==3)process.exitCode=1;
