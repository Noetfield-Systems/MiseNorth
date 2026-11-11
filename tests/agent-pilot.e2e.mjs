import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";

const scenarios=JSON.parse(readFileSync(new URL("../fixtures/demo-scenarios.json",import.meta.url),"utf8"));
const base=(process.env.BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const runTag=String(process.env.GITHUB_RUN_ID||process.env.AGENT_RUN_ID||Date.now()).replace(/[^a-z0-9]/gi,"").slice(-12);
const reports=[];
async function request(path,{method="GET",body,cookie}={}){
 const headers={accept:"application/json"};
 if(body!==undefined)headers["content-type"]="application/json";
 if(method!=="GET")headers.origin=base;
 if(cookie)headers.cookie=cookie;
 const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:"manual"});
 const raw=await response.text();let data;
 try{data=raw?JSON.parse(raw):{};}catch{data={raw:raw.slice(0,300)};}
 return {response,data};
}
function assertOk(result,label){assert.ok(result.response.ok,label+": HTTP "+result.response.status+" "+JSON.stringify(result.data));}
test("ten independent owner, guest and shift-manager agents complete realistic restaurant workflows",async()=>{
 assert.equal(scenarios.length,10,"The pilot must contain exactly ten synthetic restaurant tenants");
 const health=await request("/api/health");assertOk(health,"database health");assert.equal(health.data.database,"connected");
 const missingOrigin=await fetch(base+"/api/auth/logout",{method:"POST",redirect:"manual"});
 assert.equal(missingOrigin.status,400,"state-changing endpoint must reject missing Origin/Referer");
 const forgedOrigin=await fetch(base+"/api/auth/logout",{method:"POST",headers:{origin:"https://attacker.example"},redirect:"manual"});
 assert.equal(forgedOrigin.status,400,"state-changing endpoint must reject a forged cross-origin source");
 const pendingEmail="new-merchant-"+runTag+"@example.test";
 const registration=await request("/api/auth/register",{method:"POST",body:{ownerName:"Pending Owner Agent",email:pendingEmail,password:"StrongTestPassword!2026",restaurantName:"Verification Test "+runTag}});
 assert.equal(registration.response.status,202,"new owner registration must create a pending, unverified account");
 assert.equal(registration.data.verificationRequired,true);
 assert.ok(["sent","not_configured","pending"].includes(registration.data.delivery));
 const unverifiedLogin=await request("/api/auth/login",{method:"POST",body:{email:pendingEmail,password:"StrongTestPassword!2026"}});
 assert.equal(unverifiedLogin.response.status,403,"correct credentials must not bypass email verification");
 assert.equal(unverifiedLogin.data.code,"EMAIL_VERIFICATION_REQUIRED");
 const genericResend=await request("/api/auth/resend-verification",{method:"POST",body:{email:pendingEmail}});
 assert.ok([200,503].includes(genericResend.response.status),"verification resend must return a generic result or a provider-configuration blocker");
 if(genericResend.response.status===503)assert.equal(genericResend.data.code,"EMAIL_DELIVERY_NOT_CONFIGURED");
 else assert.equal(genericResend.data.ok,true,"verification resend must not disclose account state");
 const invalidVerification=await request("/api/auth/verify-email",{method:"POST",body:{token:"x".repeat(43)}});
 assert.equal(invalidVerification.response.status,404,"unknown verification tokens must fail closed");
 const unknownForgot=await request("/api/auth/forgot-password",{method:"POST",body:{email:"unknown-"+runTag+"@example.test"}});
 assertOk(unknownForgot,"generic unknown-account password recovery response");
 assert.equal(unknownForgot.data.message,"If this account is eligible, a password reset email will be sent.");
 const pendingForgot=await request("/api/auth/forgot-password",{method:"POST",body:{email:pendingEmail}});
 assertOk(pendingForgot,"generic pending-account password recovery response");
 assert.equal(pendingForgot.data.message,unknownForgot.data.message,"password recovery must not disclose account existence or verification state");
 const invalidReset=await request("/api/auth/reset-password",{method:"POST",body:{token:"z".repeat(43),password:"AnotherStrongPassword!2026"}});
 assert.equal(invalidReset.response.status,404,"unknown password reset token must fail closed");
 const companyOsUnconfigured=await request("/api/internal/company-os/snapshot");
 assert.equal(companyOsUnconfigured.response.status,503,"aggregate Company OS endpoint must fail closed until a shared secret is configured");
 const tenantRuns=[];
 for(let i=0;i<scenarios.length;i++){
  const s=scenarios[i],checks=[];
  const menu=await request("/api/menu?slug="+encodeURIComponent(s.slug));assertOk(menu,s.slug+" public menu");
  assert.equal(menu.data.restaurant.is_demo,true,s.slug+" must be demo-marked");
  assert.equal(menu.data.restaurant.tax_rate_verified,true,s.slug+" synthetic tax fixture must be explicitly marked");
  assert.ok(menu.data.items.length>=3,s.slug+" must have a populated menu");checks.push("public digital menu");
  const storefront=await fetch(base+"/r/"+s.slug,{redirect:"manual"});
  assert.equal(storefront.status,200,s.slug+" guest storefront");checks.push("guest storefront loads");

  const launch=await request("/api/demo/session",{method:"POST",body:{slug:s.slug}});assertOk(launch,s.slug+" owner agent login");
  const setCookie=launch.response.headers.get("set-cookie");assert.ok(setCookie,"owner agent should receive an HttpOnly session cookie");
  const cookie=setCookie.split(";")[0];
  const me=await request("/api/auth/me",{cookie});assertOk(me,"owner identity");
  assert.equal(me.data.user.restaurant_slug,s.slug);assert.equal(me.data.user.is_demo,true);
  checks.push("owner agent bound to correct tenant");
  const staffLaunch=await request("/api/demo/session",{method:"POST",body:{slug:s.slug,role:"staff"}});assertOk(staffLaunch,s.slug+" shift staff login");
  const staffSetCookie=staffLaunch.response.headers.get("set-cookie");assert.ok(staffSetCookie,"staff receives an HttpOnly session cookie");
  const staffCookie=staffSetCookie.split(";")[0];
  const staffMe=await request("/api/auth/me",{cookie:staffCookie});assertOk(staffMe,"staff identity");
  assert.equal(staffMe.data.user.restaurant_slug,s.slug);assert.equal(staffMe.data.user.role,"staff");
  checks.push("staff identity is bound to its own demo tenant");
  const managerLaunch=await request("/api/demo/session",{method:"POST",body:{slug:s.slug,role:"manager"}});assertOk(managerLaunch,s.slug+" manager login");
  const managerSetCookie=managerLaunch.response.headers.get("set-cookie");assert.ok(managerSetCookie,"manager agent receives an HttpOnly session cookie");
  const managerCookie=managerSetCookie.split(";")[0];
  const managerMe=await request("/api/auth/me",{cookie:managerCookie});assertOk(managerMe,"manager identity");
  assert.equal(managerMe.data.user.restaurant_slug,s.slug);assert.equal(managerMe.data.user.role,"manager");
  const managerSettings=await request("/api/settings",{cookie:managerCookie});assertOk(managerSettings,"manager may read normal restaurant settings");
  const managerTaxChange=await request("/api/settings",{method:"PATCH",cookie:managerCookie,body:{tax_rate:0.1,tax_rate_verified:true}});
  assert.equal(managerTaxChange.response.status,403,"only the restaurant owner may attest its tax rate");
  const managerBilling=await request("/api/billing",{cookie:managerCookie});assert.equal(managerBilling.response.status,403,"manager cannot administer subscription billing");
  const managerTeam=await request("/api/team",{cookie:managerCookie});assert.equal(managerTeam.response.status,403,"manager cannot invite or administer team members");
  checks.push("manager permissions: operational access without tax attestation, billing or team ownership");

  const overview=await request("/api/overview",{cookie});assertOk(overview,"overview");
  assert.ok(overview.data.guestCount>=3);assert.ok(overview.data.orderCount>=3);
  assert.equal(overview.data.foodPaymentsStatus,"NOT_TRACKED","sample order requests are not collected food payments");
  assert.ok(Number(overview.data.orderRequestValueCents)>=0);
  const guests=await request("/api/guests",{cookie});assertOk(guests,"guest CRM");
  const staffGuests=await request("/api/guests",{cookie:staffCookie});assert.equal(staffGuests.response.status,403,"staff cannot read the owner CRM directory");
  const staffSettings=await request("/api/settings",{cookie:staffCookie});assert.equal(staffSettings.response.status,403,"staff cannot read owner-only restaurant settings");
  const staffBilling=await request("/api/billing",{cookie:staffCookie});assert.equal(staffBilling.response.status,403,"staff cannot access subscription or invoice data");
  const demoTeam=await request("/api/team",{cookie});assert.equal(demoTeam.response.status,403,"synthetic demo owners cannot manage real team invitations");
  const demoTeamInvite=await request("/api/team",{method:"POST",cookie,body:{email:"new-staff-"+runTag+"@example.test",role:"staff"}});
  assert.equal(demoTeamInvite.response.status,403,"demo workspaces cannot invite real employees");
  const demoTeamPatch=await request("/api/team",{method:"PATCH",cookie,body:{userId:me.data.user.id,role:"manager"}});
  assert.equal(demoTeamPatch.response.status,403,"demo workspaces cannot mutate real team roles");
  const demoInviteDelete=await request("/api/team",{method:"DELETE",cookie,body:{invitationId:"b3f3a7d5-ade0-4f64-9c6d-529a735c7ca6"}});
  assert.equal(demoInviteDelete.response.status,403,"demo workspaces cannot revoke commercial team invitations");
  const forgedInvite=await request("/api/team/accept",{method:"POST",body:{token:"q".repeat(43),name:"Invited Staff Agent",password:"StrongInvitationPassword!2026"}});
  assert.equal(forgedInvite.response.status,404,"unknown invitation tokens must fail closed");
  const supportList=await request("/api/support",{cookie});assertOk(supportList,"owner support inbox");
  const staffSupport=await request("/api/support",{cookie:staffCookie});assertOk(staffSupport,"staff can view same-tenant support cases");
  const supportTicket=await request("/api/support",{method:"POST",cookie:staffCookie,body:{subject:"Demo order queue issue "+runTag,category:"product",severity:"normal",description:"Automated staff test verifying tenant-scoped support ticket intake and audit records."}});
  assert.equal(supportTicket.response.status,201,"staff can open a same-tenant support ticket");
  const ownerPrivacy=await request("/api/privacy/requests",{cookie});assertOk(ownerPrivacy,"owner privacy request log");
  const staffPrivacy=await request("/api/privacy/requests",{cookie:staffCookie});assert.equal(staffPrivacy.response.status,403,"staff cannot access privacy rights requests");
  if(i===0){
   const privacyRequest=await request("/api/privacy/requests",{method:"POST",cookie,body:{requestType:"data_export",subject:"Automated export request "+runTag,details:"Test that the owner can create a privacy request without triggering destructive data operations."}});
   assert.equal(privacyRequest.response.status,201,"owner can register a privacy request");
   const exportData=await request("/api/privacy/export",{cookie});
   assertOk(exportData,"owner data export");
   assert.equal(exportData.data.export_version,"1.0");
   assert.ok(Array.isArray(exportData.data.customers)&&Array.isArray(exportData.data.orders));
   assert.ok(Array.isArray(exportData.data.menu_items)&&Array.isArray(exportData.data.campaigns));
   assert.ok(Array.isArray(exportData.data.audit_events)&&Array.isArray(exportData.data.invoice_lines));
   assert.ok(!Object.hasOwn(exportData.data,"sessions"),"raw session tokens must not be exported");
   assert.ok(!Object.hasOwn(exportData.data,"password_hash"),"password hashes must not be exported");
   const staffExport=await request("/api/privacy/export",{cookie:staffCookie});
   assert.equal(staffExport.response.status,403,"staff cannot export the restaurant's personal data");
   const privacyList=await request("/api/privacy/requests",{cookie});assertOk(privacyList,"privacy request list after create");
   assert.ok(privacyList.data.items.some(x=>x.id===privacyRequest.data.request.id));
  }
  if(i===0){
   const billing=await request("/api/billing",{cookie});assertOk(billing,"owner billing status");
   assert.equal(billing.data.checkoutEnabled,false,"Checkout must remain disabled until a sandbox key, Price IDs and webhook secret are configured");
   assert.equal(billing.data.mrrStatus,"NOT_TRACKED","no paid subscription must not create MRR");
   const checkoutBlocked=await request("/api/billing/checkout",{method:"POST",cookie,body:{requestId:"b3f3a7d5-ade0-4f64-9c6d-529a735c7ca6"}});
   assert.equal(checkoutBlocked.response.status,503,"unconfigured billing cannot create a Checkout session");
   const portalBlocked=await request("/api/billing/portal",{method:"POST",cookie,body:{}});
   assert.equal(portalBlocked.response.status,503,"unconfigured billing cannot create a Customer Portal session");
  }
  const orders=await request("/api/orders",{cookie});assertOk(orders,"owner order inbox");
  const reservations=await request("/api/reservations",{cookie});assertOk(reservations,"reservation inbox");
  const campaigns=await request("/api/campaigns",{cookie});assertOk(campaigns,"campaign workspace");
  assert.ok(campaigns.data.items.every(c=>c.status==="draft"),"no sample campaign should auto-send");
  checks.push("owner CRM, order, booking and campaign workspaces");

  const email="guest-agent-"+s.slug.replace(/^demo-/,"")+"-"+runTag+"@example.test";
  if(i===0){
   const noEmailConsent=await request("/api/orders",{method:"POST",body:{slug:s.slug,customerName:"Consent Agent",phone:"+1-604-555-0997",marketingConsent:true,orderType:"pickup",items:[{itemId:menu.data.items[0].id,quantity:1}]}});
   assert.equal(noEmailConsent.response.status,400,"email consent cannot be recorded without an email address");
  }
  const shouldConsent=i===0;
  const guestOrder=await request("/api/orders",{method:"POST",body:{
   slug:s.slug,customerName:"Pilot Guest Agent",email,phone:"+1-604-555-0999",
   marketingConsent:shouldConsent,orderType:"pickup",
   items:[{itemId:menu.data.items[0].id,quantity:1}],
   notes:"AUTOMATED DEMO PILOT "+runTag+" · unpaid test order"
  }});
  assert.equal(guestOrder.response.status,201,s.slug+" order intake: "+JSON.stringify(guestOrder.data));
  const orderId=guestOrder.data.order.id;assert.ok(orderId);
  assert.equal(guestOrder.data.order.status,"new");
  assert.equal(typeof guestOrder.data.unsubscribeUrl==="string"&&guestOrder.data.unsubscribeUrl.startsWith("/unsubscribe#token="),shouldConsent,"only an explicit opt-in returns a single-use withdrawal link");
  const createdOrders=await request("/api/orders",{cookie});assertOk(createdOrders,"owner sees the guest order");
  const created=createdOrders.data.items.find(o=>o.id===orderId);assert.ok(created,"new order visible inside same tenant");
  assert.equal(created.payment_status,"unpaid","agent workflow must never capture payment");
  const staffIllegal=await request("/api/orders/"+orderId,{method:"PATCH",cookie:staffCookie,body:{status:"completed"}});
  assert.equal(staffIllegal.response.status,403,"staff cannot skip kitchen stages");
  const illegal=await request("/api/orders/"+orderId,{method:"PATCH",cookie,body:{status:"completed"}});
  assert.equal(illegal.response.status,409,"invalid owner transition must still be rejected");
  for(const status of ["accepted","preparing","ready","completed"]){
   const result=await request("/api/orders/"+orderId,{method:"PATCH",cookie:staffCookie,body:{status}});
   assertOk(result,s.slug+" transition "+status);assert.equal(result.data.item.status,status);
  }
  checks.push("guest creates unpaid order; shift manager follows legal kitchen stages");

  const refreshedGuests=await request("/api/guests",{cookie});assertOk(refreshedGuests,"CRM refresh");
  const profile=refreshedGuests.data.items.find(g=>g.email===email);assert.ok(profile,"new guest added to CRM");
  assert.equal(profile.marketing_consent,shouldConsent,"marketing consent must reflect only the explicit checkbox");
  assert.equal(Number(profile.order_request_count),1,"guest request must be counted as an order request");
  assert.equal(Number(profile.visit_count),0,"unpaid request must not count as a paid visit");
  assert.equal(Number(profile.lifetime_spend_cents),0,"unpaid request must not increment lifetime paid spend");
  assert.equal(Number(profile.loyalty_points),0,"unpaid request must not award loyalty points");
  if(shouldConsent){
   const token=new URL(guestOrder.data.unsubscribeUrl,base).hash.replace(/^#token=/,"");
   assert.ok(token.length>=32,"the guest must receive a sufficiently random unsubscribe token");
   const withdrawn=await request("/api/consent/withdraw",{method:"POST",body:{token}});
   assertOk(withdrawn,"guest withdraws promotional consent");
   assert.equal(withdrawn.data.status,"unsubscribed");
   const replay=await request("/api/consent/withdraw",{method:"POST",body:{token}});
   assert.equal(replay.response.status,404,"a consumed unsubscribe token cannot be replayed");
   const afterWithdrawal=await request("/api/guests",{cookie});
   assertOk(afterWithdrawal,"CRM after withdrawal");
   const withdrawnProfile=afterWithdrawal.data.items.find(g=>g.email===email);
   assert.ok(withdrawnProfile);
   assert.equal(withdrawnProfile.marketing_consent,false,"withdrawal must suppress future marketing");
  }
  checks.push("consent provenance, withdrawal and replay protection");

  if(s.acceptingReservations){
   const booking=await request("/api/reservations",{method:"POST",body:{
    slug:s.slug,guestName:"Reservation Guest Agent",email:"booking-agent-"+s.slug.replace(/^demo-/,"")+"-"+runTag+"@example.test",
    phone:"+1-604-555-0998",partySize:2,reservedFor:new Date(Date.now()+(8+i%2)*86400000).toISOString(),
    notes:"AUTOMATED DEMO PILOT "+runTag+" · sample booking request"
   }});
   assert.equal(booking.response.status,201,s.slug+" reservation intake: "+JSON.stringify(booking.data));
   assert.equal(booking.data.reservation.status,"requested","guest booking must not be auto-confirmed");
   const bookingId=booking.data.reservation.id;
   for(const status of ["confirmed","seated","completed"]){
    const result=await request("/api/reservations/"+bookingId,{method:"PATCH",cookie:staffCookie,body:{status}});
    assertOk(result,s.slug+" booking transition "+status);
   }
   checks.push("guest request → owner confirmation → seated → completed");
   if(i===0){
    const concurrentAt=new Date(Date.now()+12*86400000).toISOString();
    const simultaneous=await Promise.all([0,1,2].map(n=>request("/api/reservations",{method:"POST",body:{
     slug:s.slug,guestName:"Concurrent Guest "+n,email:"concurrent-"+n+"-"+runTag+"@example.test",
     phone:"+1-604-555-0996",partySize:2,reservedFor:concurrentAt,
     notes:"AUTOMATED CONCURRENCY CHECK "+runTag
    }})));
    const accepted=simultaneous.filter(x=>x.response.status===201);
    const conflicted=simultaneous.filter(x=>x.response.status===409);
    assert.equal(accepted.length,2,"four configured covers accept exactly two concurrent parties of two");
    assert.equal(conflicted.length,1,"third concurrent party must be denied when configured covers are exhausted");
    checks.push("concurrent reservation capacity is serialized without overbooking");
   }
  }else{
   const rejected=await request("/api/reservations",{method:"POST",body:{
    slug:s.slug,guestName:"Reservation Guest Agent",email:"closed-"+s.slug+"-"+runTag+"@example.test",
    partySize:2,reservedFor:new Date(Date.now()+8*86400000).toISOString()
   }});
   assert.equal(rejected.response.status,400,"reservation-disabled restaurant must reject booking intake");
   checks.push("reservation-disabled policy enforced");
  }
  tenantRuns.push({slug:s.slug,restaurant:s.name,neighbourhood:s.area,ownerAgent:s.ownerName,staffRole:"staff",checks:checks.length,checklist:checks,createdOrderId:orderId,seedOrders:orders.data.items.length});
  console.log("PILOT PASS "+s.slug+" | "+checks.length+" checks");
 }

 // The first owner agent must not be able to mutate an order belonging to the second tenant.
 const firstSession=await request("/api/demo/session",{method:"POST",body:{slug:scenarios[0].slug}});
 const firstCookie=firstSession.response.headers.get("set-cookie").split(";")[0];
 const secondSession=await request("/api/demo/session",{method:"POST",body:{slug:scenarios[1].slug}});
 const secondCookie=secondSession.response.headers.get("set-cookie").split(";")[0];
 const secondOrders=await request("/api/orders",{cookie:secondCookie});assertOk(secondOrders,"second tenant orders");
 const crossTenant=await request("/api/orders/"+secondOrders.data.items[0].id,{method:"PATCH",cookie:firstCookie,body:{status:"cancelled"}});
 assert.equal(crossTenant.response.status,404,"cross-tenant mutation must return not found");
 const firstOrders=await request("/api/orders",{cookie:firstCookie});assertOk(firstOrders,"first tenant orders");
 assert.ok(firstOrders.data.items.every(o=>!secondOrders.data.items.some(other=>other.id===o.id)),"tenant inboxes must not share records");
 const revocationLaunch=await request("/api/demo/session",{method:"POST",body:{slug:scenarios[2].slug}});
 assertOk(revocationLaunch,"session revocation owner session");
 const revocationCookie=revocationLaunch.response.headers.get("set-cookie").split(";")[0];
 const revoked=await request("/api/auth/sessions/revoke-all",{method:"POST",cookie:revocationCookie,body:{}});
 assertOk(revoked,"owner revokes all active sessions");
 assert.equal(revoked.data.signedOut,true);
 const revokedMe=await request("/api/auth/me",{cookie:revocationCookie});
 assert.equal(revokedMe.response.status,401,"revoked session token cannot be reused");

 const summary={status:"passed",mode:process.env.BASE_URL?"railway-production-http":"isolated-postgres-e2e",syntheticRestaurantTenants:tenantRuns.length,ownerAgents:tenantRuns.length,staffAgents:tenantRuns.length,guestOrderAgents:tenantRuns.length,reservationEnabledTenants:scenarios.filter(s=>s.acceptingReservations).length,tenantRuns,crossTenantIsolation:"passed",paymentsTaken:0,outboundMessagesSent:0,generatedAt:new Date().toISOString()};
 writeFileSync("agent-pilot-report.json",JSON.stringify(summary,null,2)+"\n");
 console.log("PILOT SUMMARY "+JSON.stringify({restaurants:summary.syntheticRestaurantTenants,ownerAgents:summary.ownerAgents,staffAgents:summary.staffAgents,guestOrderAgents:summary.guestOrderAgents,reservationEnabled:summary.reservationEnabledTenants,crossTenantIsolation:summary.crossTenantIsolation}));
});
