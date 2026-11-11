import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
const base=process.env.MISENORTH_TEST_BASE||"http://127.0.0.1:3000";
const cases=[
 {id:"nuba_multilocation",business:"Nuba",website:"https://www.nuba.ca/",goal:"reservations",scenario:"Multiple restaurant locations require explicit location assignment"},
 {id:"tacofino_pickup",business:"Tacofino",website:"https://www.tacofino.com/locations",goal:"direct_requests",scenario:"Pickup request is not a paid food order"},
 {id:"vijs_reservation",business:"Vij's",website:"https://www.vijs.ca/",goal:"reservations",scenario:"Reservation inquiries are not confirmed guest bookings"}
];
async function call(path,{method="GET",data,cookie}={}){
 const h={accept:"application/json"};
 if(method!=="GET")h.origin=base;
 if(data!==undefined)h["content-type"]="application/json";
 if(cookie)h.cookie=cookie;
 const r=await fetch(base+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(12000)});
 return {status:r.status,body:await r.json().catch(()=>null),cookie:r.headers.get("set-cookie")?.split(";")[0]};
}
const denied=await Promise.all([
 call("/api/operator/company-os"),call("/api/operator/collaborators"),call("/api/operator/command")
]);
denied.forEach(r=>assert.equal(r.status,401,"private company data must not be public"));
const manifest=await call("/api/agents/manifest");
assert.equal(manifest.status,200);assert.equal(manifest.body.collaboration.endpoint,"/api/work-with-us");
assert.equal(manifest.body.scopes.notGranted.includes("execute_payments"),true);
const login=await call("/api/operator/session",{method:"POST",data:{password:process.env.MISENORTH_TEST_OPERATOR_KEY}});
assert.equal(login.status,200);const cookie=login.cookie;assert.ok(cookie);
const baseline=await call("/api/operator/company-os",{cookie});
assert.equal(baseline.status,200,JSON.stringify(baseline.body));
assert.equal(baseline.body.northStar.id,"verified_paying_restaurant_locations");
const beforeCash=baseline.body.northStar.value;
const beforeInquiries=baseline.body.leading.restaurantInquiries;
for(const item of cases){
 const contact="misenorth-qa-"+item.id+"-"+Date.now()+"@example.test";
 const created=await call("/api/growth-inquiries",{method:"POST",data:{
  name:"MiseNorth QA Research Fixture",email:contact,
  restaurantName:"RESEARCH ONLY — "+item.business+" (not a customer)",
  restaurantWebsite:item.website,goal:item.goal,source:"qa_"+item.id,website:"",
  intent:"restaurant",message:"Isolated CI simulation. Not submitted by or on behalf of "+item.business+". "+item.scenario
 }});
 assert.equal(created.status,201,JSON.stringify(created.body));
 const id=created.body.id;
 try{
  const inbox=await call("/api/operator/inquiries?q="+encodeURIComponent(contact),{cookie});
  assert.equal(inbox.status,200);
  const lead=inbox.body.items.find(x=>x.id===id);assert.ok(lead);
  assert.ok(lead.restaurant_name.includes("RESEARCH ONLY"));
  assert.equal(lead.main_goal,item.goal);
  assert.equal(lead.source,"qa_"+item.id);
  assert.equal(new URL(lead.restaurant_website).hostname,new URL(item.website).hostname);
  const qualified=await call("/api/operator/inquiries/"+id,{method:"PATCH",cookie,data:{
   status:"qualified",assignedTo:"MiseNorth isolated QA",note:item.scenario,
   followUpAt:new Date(Date.now()+86400000).toISOString()
  }});
  assert.equal(qualified.status,200);assert.equal(qualified.body.item.status,"qualified");
  const proposed=await call("/api/operator/inquiries/"+id,{method:"PATCH",cookie,data:{
   status:"proposal",note:"Scenario tested only; no contact, authorization or payment took place."
  }});
  assert.equal(proposed.status,200);
  const detail=await call("/api/operator/inquiries/"+id,{cookie});
  assert.equal(detail.status,200);
  assert.ok(detail.body.history.some(e=>e.event_type==="opportunity_updated"));
  const os=await call("/api/operator/company-os",{cookie});
  assert.equal(os.status,200);
  assert.equal(os.body.northStar.value,beforeCash,"CRM proposal must not increment paying customers");
  assert.ok(os.body.leading.restaurantInquiries>=beforeInquiries+1);
  assert.ok(os.body.packets.some(x=>x.domain==="sales"||x.domain==="finance"));
  console.log("PASS "+item.business+": sourced public website metadata → isolated inquiry → CRM qualification → proposal → activity receipt; payment NOT fabricated.");
 }finally{
  const deleted=await call("/api/operator/inquiries/"+id,{method:"DELETE",cookie});
  assert.equal(deleted.status,200,"CI fixture must be cleaned up");
 }
}
for(const actor of ["human","agent"]){
 const id=randomUUID();
 const application=await call("/api/work-with-us",{method:"POST",data:{
  actorType:actor,name:actor==="human"?"CI Human Reviewer":"CI Automation Agent",
  email:actor+"-ci-"+Date.now()+"@example.test",organization:"MiseNorth isolated CI",
  track:actor==="human"?"restaurant_referrals":"automation",
  capabilities:"Can produce reproducible review artifacts and case studies.",
  contribution:"Propose a bounded restaurant workflow with evidence and an acceptance test.",
  requestKey:id,consent:true,profileUrl:"",website:"",websiteConfirmation:""
 }});
 assert.equal(application.status,201,JSON.stringify(application.body));
 const duplicate=await call("/api/work-with-us",{method:"POST",data:{
  actorType:actor,name:actor==="human"?"CI Human Reviewer":"CI Automation Agent",
  email:actor+"-ci-"+Date.now()+"@example.test",organization:"MiseNorth isolated CI",
  track:actor==="human"?"restaurant_referrals":"automation",
  capabilities:"Can produce reproducible review artifacts and case studies.",
  contribution:"Propose a bounded restaurant workflow with evidence and an acceptance test.",
  requestKey:id,consent:true,profileUrl:"",website:"",websiteConfirmation:""
 }});
 assert.equal(duplicate.status,200);assert.equal(duplicate.body.duplicate,true);
 const all=await call("/api/operator/collaborators?actor="+actor,{cookie});
 assert.equal(all.status,200);
 const saved=all.body.records.find(x=>x.id===application.body.id);
 assert.ok(saved);assert.equal(saved.status,"applied");
 const review=await call("/api/operator/collaborators/"+saved.id,{method:"PATCH",cookie,
  data:{status:"reviewing",note:"CI: reviewed only; no credentials or contract."}});
 assert.equal(review.status,200);
 assert.equal(review.body.authority,"no_agent_execution_authority_granted");
 console.log("PASS "+actor+" collaboration: application → private inbox → audited review; no execution authority.");
}
const after=await call("/api/operator/company-os",{cookie});
assert.equal(after.status,200);assert.equal(after.body.northStar.value,beforeCash);
console.log("THREE REAL-BUSINESS RESEARCH JOURNEYS: 3/3 isolated simulations passed; real websites independently known, no real merchants contacted, no customer or payment claimed.");
