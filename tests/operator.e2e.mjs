import assert from "node:assert/strict";
const base="http://127.0.0.1:3000";
async function call(path,method="GET",body,cookie){
 const headers={accept:"application/json"};
 if(method!=="GET")headers.origin=base;
 if(body!==undefined)headers["content-type"]="application/json";
 if(cookie)headers.cookie=cookie;
 const res=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 return {status:res.status,body:await res.json().catch(()=>({})),cookie:res.headers.get("set-cookie")?.split(";")[0]};
}
const noAccess=await call("/api/operator/inquiries");
assert.equal(noAccess.status,401);
const login=await call("/api/operator/session","POST",{password:process.env.MISENORTH_TEST_OPERATOR_KEY});
assert.equal(login.status,200);
assert.ok(login.cookie?.startsWith("misenorth_operator="));
const email="test-"+Date.now()+"@example.test";
const created=await call("/api/growth-inquiries","POST",{name:"Synthetic CI User",email,restaurantName:"MiseNorth E2E Fixture",message:"Isolated CI test",intent:"restaurant",website:""});
assert.equal(created.status,201,JSON.stringify(created.body));
const inbox=await call("/api/operator/inquiries","GET",undefined,login.cookie);
assert.equal(inbox.status,200);
assert.ok(inbox.body.items.some(x=>x.id===created.body.id));
const updated=await call("/api/operator/inquiries/"+created.body.id,"PATCH",{status:"qualified",note:"Reviewed during isolated CI"},login.cookie);
assert.equal(updated.status,200);
assert.equal(updated.body.item.status,"qualified");
const deleted=await call("/api/operator/inquiries/"+created.body.id,"DELETE",undefined,login.cookie);
assert.equal(deleted.status,200);
console.log("OPERATOR E2E PASS authenticated create/read/update/delete; unauthenticated read blocked");
