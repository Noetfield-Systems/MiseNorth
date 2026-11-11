/** Production HTTP smoke for the public MiseNorth acquisition and guest surfaces. */
const base=(process.env.BASE_URL||"https://misenorth-growth-production.up.railway.app").replace(/\/$/,"");
const paths=["/","/grader","/pricing","/demo","/partners","/investors","/api/health","/robots.txt","/sitemap.xml"];
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
 }else if(path==="/"&&!text.includes("Your restaurant.")){failed++;console.error("FAIL landing headline missing");continue;}
 else if(path==="/grader"&&!text.includes("restaurant website")){failed++;console.error("FAIL grader copy missing");continue;}
 console.log("PASS",path,response.status,text.length,"bytes");
}
if(failed)process.exitCode=1;
else console.log("Public pages and PostgreSQL health are responding.");
// The PageSpeed provider is optional. Check truthful failure semantics without claiming a successful scan.
try{
 const response=await fetch(base+"/api/grader",{method:"POST",headers:{"Content-Type":"application/json",Origin:base,"user-agent":"MiseNorth-production-smoke/1.0"},body:JSON.stringify({website:"https://www.example.com"}),signal:AbortSignal.timeout(35000)});
 const body=await response.json();
 if(response.status===200&&body.ok&&body.report?.source?.includes("PageSpeed")&&body.id)console.log("GRADER PASS",body.id,body.report.score);
 else if([422,429,503].includes(response.status)&&body.error)console.log("GRADER PROVIDER NOT AVAILABLE",response.status,body.code||body.error);
 else {console.error("GRADER unexpected response",response.status,JSON.stringify(body).slice(0,250));process.exitCode=1;}
}catch(error){console.warn("GRADER probe interrupted; check provider and network",String(error?.message||error));}
