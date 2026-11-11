export class EmailDeliveryNotConfiguredError extends Error {
  constructor(){super("EMAIL_DELIVERY_NOT_CONFIGURED");this.name="EmailDeliveryNotConfiguredError";}
}
export class EmailDeliveryError extends Error {
  constructor(){super("EMAIL_DELIVERY_FAILED");this.name="EmailDeliveryError";}
}
function escapeHtml(value:string):string{
  return value.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
}
function applicationOrigin():string{
  const configured=process.env.NEXT_PUBLIC_APP_URL?.trim();
  const railwayDomain=process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  const raw=configured||(railwayDomain?("https://"+railwayDomain):null);
  if(!raw)throw new EmailDeliveryNotConfiguredError();
  try{
    const url=new URL(raw);
    if(url.protocol!=="https:"&&url.hostname!=="localhost"&&url.hostname!=="127.0.0.1")throw new Error("invalid");
    return url.origin;
  }catch{
    throw new EmailDeliveryNotConfiguredError();
  }
}
export async function sendEmailVerification(input:{to:string;name:string;token:string}):Promise<{id:string}>{
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const from=process.env.RESEND_FROM_EMAIL?.trim();
  if(!apiKey||!from)throw new EmailDeliveryNotConfiguredError();
  const link=applicationOrigin()+"/verify-email#token="+encodeURIComponent(input.token);
  const name=escapeHtml(input.name);
  const url=escapeHtml(link);
  let response:Response;
  try{
    response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{authorization:"Bearer "+apiKey,"content-type":"application/json"},
      body:JSON.stringify({
        from,
        to:[input.to],
        subject:"Verify your MiseNorth restaurant account",
        html:"<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17251f\"><h1>Verify your MiseNorth account</h1><p>Hello "+name+",</p><p>Confirm your email address to activate your restaurant workspace.</p><p><a href=\""+url+"\" style=\"display:inline-block;padding:12px 18px;background:#244e45;color:white;text-decoration:none;border-radius:8px\">Verify email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this message.</p></div>",
        text:"Hello "+input.name+", verify your MiseNorth account: "+link+"\nThis link expires in 24 hours. If you did not create this account, ignore this message."
      }),
      signal:AbortSignal.timeout(10000)
    });
  }catch{
    throw new EmailDeliveryError();
  }
  if(!response.ok)throw new EmailDeliveryError();
  const payload=await response.json().catch(()=>null) as {id?:string}|null;
  if(!payload?.id)throw new EmailDeliveryError();
  return {id:payload.id};
}

export async function sendPasswordReset(input:{to:string;name:string;token:string}):Promise<{id:string}>{
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const from=process.env.RESEND_FROM_EMAIL?.trim();
  if(!apiKey||!from)throw new EmailDeliveryNotConfiguredError();
  const link=applicationOrigin()+"/reset-password#token="+encodeURIComponent(input.token);
  const name=escapeHtml(input.name);
  const url=escapeHtml(link);
  let response:Response;
  try{
    response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{authorization:"Bearer "+apiKey,"content-type":"application/json"},
      body:JSON.stringify({
        from,
        to:[input.to],
        subject:"Reset your MiseNorth password",
        html:"<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17251f\"><h1>Reset your password</h1><p>Hello "+name+",</p><p>A password reset was requested for your MiseNorth account. Use the link below to choose a new password.</p><p><a href=\""+url+"\" style=\"display:inline-block;padding:12px 18px;background:#244e45;color:white;text-decoration:none;border-radius:8px\">Reset password</a></p><p>This link expires in 2 hours. If you did not request this, you can ignore this message.</p></div>",
        text:"Hello "+input.name+", reset your MiseNorth password: "+link+"\nThis link expires in 2 hours. If you did not request this, ignore this message."
      }),
      signal:AbortSignal.timeout(10000)
    });
  }catch{
    throw new EmailDeliveryError();
  }
  if(!response.ok)throw new EmailDeliveryError();
  const payload=await response.json().catch(()=>null) as {id?:string}|null;
  if(!payload?.id)throw new EmailDeliveryError();
  return {id:payload.id};
}

export async function sendTeamInvite(input:{to:string;restaurantName:string;inviterName:string;role:"manager"|"staff";token:string}):Promise<{id:string}>{
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const from=process.env.RESEND_FROM_EMAIL?.trim();
  if(!apiKey||!from)throw new EmailDeliveryNotConfiguredError();
  const link=applicationOrigin()+"/accept-invite#token="+encodeURIComponent(input.token);
  const restaurant=escapeHtml(input.restaurantName);
  const inviter=escapeHtml(input.inviterName);
  const role=escapeHtml(input.role);
  const url=escapeHtml(link);
  let response:Response;
  try{
    response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{authorization:"Bearer "+apiKey,"content-type":"application/json"},
      body:JSON.stringify({
        from,
        to:[input.to],
        subject:"You have been invited to a MiseNorth restaurant workspace",
        html:"<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17251f\"><h1>Workspace invitation</h1><p>"+inviter+" invited you to join "+restaurant+" as "+role+".</p><p><a href=\""+url+"\" style=\"display:inline-block;padding:12px 18px;background:#244e45;color:white;text-decoration:none;border-radius:8px\">Accept invitation</a></p><p>This link expires in 7 days and can be used once. If you did not expect this invitation, ignore this message.</p></div>",
        text:inviter+" invited you to join "+input.restaurantName+" as "+input.role+". Accept: "+link+"\nThis link expires in 7 days."
      }),
      signal:AbortSignal.timeout(10000)
    });
  }catch{
    throw new EmailDeliveryError();
  }
  if(!response.ok)throw new EmailDeliveryError();
  const payload=await response.json().catch(()=>null) as {id?:string}|null;
  if(!payload?.id)throw new EmailDeliveryError();
  return {id:payload.id};
}
