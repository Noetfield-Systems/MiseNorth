/** Production HTTP smoke for the public MiseNorth acquisition and guest surfaces. */
const base=(process.env.BASE_URL||"https://misenorth-growth-production.up.railway.app").replace(/\/$/,"");
const paths=["/","/grader","/pricing","/demo","/partners","/investors","/restaurants/vancouver","/operator","/work-with-us","/api/agents/manifest","/api/public/launch-status","/signup","/api/health","/robots.txt","/sitemap.xml"];
let failed=0;
for(const path of paths){
 let response,reason="";
 for(let attempt=1;attempt<=4;attempt++){
  try{
   response=await fetch(base+path,{redirect:"follow",signal:AbortSignal.timeout(15000),headers:{"user-agent":"MiseNorth-production-smoke/1.0"}});
   if(response.ok)break;
   reason="HTTP "+response.status;
  }catch(error){reason=String(error?.message||error);}
  if(attempt<4)await new Promise(resolve=>setTimeout(resolve,1500*attempt));
 }
 if(!response?.ok){failed++;console.error("FAIL",path,reason);continue;}
 const text=await response.text();
 if(path==="/api/health"){
  try{const h=JSON.parse(text);if(h.status!=="ok"||h.database!=="connected")throw Error("DB not healthy");}
  catch(error){failed++;console.error("FAIL health",error);continue;}
 }else if(path==="/"&&!text.includes("They found")){failed++;console.error("FAIL landing headline missing");continue;}
 else if(path==="/grader"&&!text.includes("restaurant website")){failed++;console.error("FAIL grader copy missing");continue;}
 else if(path==="/pricing"&&!text.includes("FOUNDING RESTAURANT")){failed++;console.error("FAIL pricing offer missing");continue;}
 else if(path==="/demo"&&!text.includes("REAL WORKFLOWS")){failed++;console.error("FAIL curated product demo missing");continue;}
 else if(path==="/restaurants/vancouver"&&!text.includes("VANCOUVER RESTAURANT OWNERS")){failed++;console.error("FAIL local acquisition page missing");continue;}
 console.log("PASS",path,response.status,text.length,"bytes");
}
if(failed)process.exitCode=1;
else console.log("Public pages and PostgreSQL health are responding.");
// The PageSpeed provider is optional. Check truthful failure semantics without claiming a successful scan.
try{
 const response=await fetch(base+"/api/grader",{method:"POST",headers:{"Content-Type":"application/json",Origin:base,"user-agent":"MiseNorth-production-smoke/1.0"},body:JSON.stringify({website:"https://www.example.com"}),signal:AbortSignal.timeout(35000)});
 const body=await response.json();
 if(response.status===200&&body.ok&&typeof body.report?.source==="string"&&Number.isFinite(body.report.score)&&body.id){
  console.log("GRADER PASS",body.id,body.report.score,body.report.source,body.report.coverage);
  const [report,preview,api]=await Promise.all([
   fetch(base+"/grader/report/"+body.id,{signal:AbortSignal.timeout(15000)}),
   fetch(base+"/grader/report/"+body.id+"/preview",{signal:AbortSignal.timeout(15000)}),
   fetch(base+"/api/grader/report/"+body.id,{signal:AbortSignal.timeout(15000)})
  ]);
  const [reportHtml,previewHtml,reportJson]=await Promise.all([report.text(),preview.text(),api.json()]);
  if(!report.ok||!preview.ok||!api.ok||!reportHtml.includes("What the measurements say")||!previewHtml.includes("WEBSITE IMPROVEMENT CONCEPT")||reportJson.report?.score!==body.report.score){
   console.error("FAIL report or concept preview route",report.status,preview.status,api.status);
   process.exitCode=1;
  }else console.log("REPORT+PREVIEW PASS",report.status,preview.status,api.status);
 }
 else if([422,429,503].includes(response.status)&&body.error)console.log("GRADER PROVIDER NOT AVAILABLE",response.status,body.code||body.error);
 else {console.error("GRADER unexpected response",response.status,JSON.stringify(body).slice(0,250));process.exitCode=1;}
}catch(error){console.warn("GRADER probe interrupted; check provider and network",String(error?.message||error));}

// Operator data must never be publicly readable.
const privateProbe=await fetch(base+"/api/operator/inquiries",{signal:AbortSignal.timeout(15000)});
if(privateProbe.status!==401){console.error("FAIL operator inquiry data unexpectedly public",privateProbe.status);process.exitCode=1;}
else console.log("PASS operator access boundary (401)");
