import Stripe from "stripe";

let cachedClient:Stripe|null=null;
let cachedKey="";

export type StripeMode="test"|"live";
export class BillingNotConfiguredError extends Error{
 constructor(){super("BILLING_NOT_CONFIGURED");this.name="BillingNotConfiguredError";}
}
export class LiveBillingDisabledError extends Error{
 constructor(){super("LIVE_BILLING_DISABLED");this.name="LiveBillingDisabledError";}
}
export function stripeModeFromKey(key:string):StripeMode{
 if(key.startsWith("sk_test_")||key.startsWith("rk_test_"))return "test";
 if(key.startsWith("sk_live_")||key.startsWith("rk_live_"))return "live";
 throw new BillingNotConfiguredError();
}
export function billingConfiguration(){
 const key=process.env.STRIPE_SECRET_KEY?.trim()||"";
 const recurringPrice=process.env.MISENORTH_STRIPE_RECURRING_PRICE_ID?.trim()||"";
 const setupPrice=process.env.MISENORTH_STRIPE_SETUP_PRICE_ID?.trim()||"";
 const webhookSecret=process.env.MISENORTH_STRIPE_WEBHOOK_SECRET?.trim()||process.env.STRIPE_WEBHOOK_SECRET?.trim()||"";
 let mode:StripeMode|null=null;
 try{if(key)mode=stripeModeFromKey(key);}catch{}
 const enabled=process.env.MISENORTH_BILLING_ENABLED==="true";
 const liveApproved=process.env.MISENORTH_BILLING_LIVE_APPROVED==="true";
 const taxReviewed=process.env.MISENORTH_TAX_REVIEWED==="true";
 const taxConfigured=process.env.MISENORTH_TAX_CONFIGURED==="true";
 const expectedMonthlyCents=Number(process.env.MISENORTH_FOUNDING_MONTHLY_CENTS||4900);
 const expectedSetupCents=Number(process.env.MISENORTH_FOUNDING_SETUP_CENTS||14900);
 const recurringPriceReady=Boolean(recurringPrice)&&Number.isInteger(expectedMonthlyCents)&&expectedMonthlyCents>0;
 const setupPriceReady=Boolean(setupPrice)&&Number.isInteger(expectedSetupCents)&&expectedSetupCents>=0;
 const webhookReady=Boolean(webhookSecret);
 const configured=enabled&&Boolean(key)&&recurringPriceReady&&setupPriceReady&&webhookReady&&Boolean(mode)&&(mode!=="live"||(liveApproved&&taxReviewed&&taxConfigured));
 const reasons:string[]=[];
 if(!enabled)reasons.push("billing_disabled");
 if(!key)reasons.push("stripe_key_missing");
 if(key&&!mode)reasons.push("stripe_key_invalid");
 if(!recurringPriceReady)reasons.push("recurring_price_or_amount_missing");
 if(!setupPriceReady)reasons.push("setup_price_or_amount_missing");
 if(!webhookReady)reasons.push("webhook_secret_missing");
 if(mode==="live"&&!liveApproved)reasons.push("live_billing_not_approved");
 if(mode==="live"&&!taxReviewed)reasons.push("tax_review_not_approved");
 if(mode==="live"&&!taxConfigured)reasons.push("tax_collection_not_configured");
 return {configured,enabled,mode,liveApproved,taxReviewed,taxConfigured,expectedMonthlyCents,expectedSetupCents,recurringPrice,setupPrice,webhookSecret,reasons};
}
export function getStripeClient():Stripe{
 const cfg=billingConfiguration();
 if(!cfg.configured)throw new BillingNotConfiguredError();
 const key=process.env.STRIPE_SECRET_KEY!.trim();
 if(cachedClient&&cachedKey===key)return cachedClient;
 cachedClient=new Stripe(key);
 cachedKey=key;
 return cachedClient;
}
export function publicAppOrigin():string{
 const configured=process.env.NEXT_PUBLIC_APP_URL?.trim();
 const railwayDomain=process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
 const raw=configured||(railwayDomain?("https://"+railwayDomain):"https://misenorth-web-production.up.railway.app");
 try{
  const url=new URL(raw);
  if(url.protocol!=="https:"&&url.hostname!=="localhost"&&url.hostname!=="127.0.0.1")throw new Error("invalid");
  return url.origin;
 }catch{throw new BillingNotConfiguredError();}
}
