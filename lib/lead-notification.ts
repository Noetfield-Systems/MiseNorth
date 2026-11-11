export async function alertNewGrowthInquiry(input:{id:string;name:string;email:string;restaurantName:string;intent:string;message:string}):Promise<boolean>{
 const key=process.env.RESEND_API_KEY?.trim();
 const from=process.env.RESEND_FROM_EMAIL?.trim();
 const to=process.env.MISENORTH_LEAD_NOTIFY_TO?.trim();
 if(!key||!from||!to)return false;
 const base=process.env.NEXT_PUBLIC_APP_URL||"https://misenorth-growth-production.up.railway.app";
 const subject="MiseNorth inbound: "+input.intent;
 const body=[
  "A new MiseNorth inquiry was received.",
  "Name: "+input.name,"Email: "+input.email,
  "Restaurant: "+input.restaurantName,"Intent: "+input.intent,
  "Message: "+input.message,"Inquiry ID: "+input.id,
  "Open the private inbox: "+base+"/operator"
 ].join("\n");
 try{
  const res=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"authorization":"Bearer "+key,"content-type":"application/json"},
   body:JSON.stringify({from,to:[to],subject,text:body}),
   signal:AbortSignal.timeout(7000)
  });
  if(!res.ok){console.warn("[MiseNorth] lead alert provider unavailable",res.status);return false;}
  return true;
 }catch{console.warn("[MiseNorth] lead alert delivery failed");return false;}
}
