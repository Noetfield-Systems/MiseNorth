"use client";
import {useState} from "react";
import Link from "next/link";
const steps=[
 {key:"guest",title:"Guest experience",eyebrow:"1 · FOUND ONLINE",headline:"A place guests can actually use.",desc:"Guests open a branded menu, browse dishes and send a pickup or dine-in request directly to your team.",tag:"GUEST VIEW",cta:"Open a working guest site",href:"/r/demo-cedar-salt-cafe"},
 {key:"team",title:"Staff workflow",eyebrow:"2 · HANDLED BY YOUR TEAM",headline:"Requests don't disappear into a generic inbox.",desc:"Your staff see new requests and take them through a clear operating queue, instead of losing details in messages.",tag:"OWNER VIEW",cta:"Explore the owner dashboard",href:"/demo"},
 {key:"booking",title:"Reservations",eyebrow:"3 · EVERY DETAIL IN VIEW",headline:"Guests ask. Your staff confirm.",desc:"Restaurant booking requests stay visible for review and confirmation. Nothing is represented as an automatic confirmed table.",tag:"REQUEST VIEW",cta:"Try a sample restaurant",href:"/r/demo-harbour-pine-kitchen"}
] as const;
export default function MarketingDemo(){
 const [selected,setSelected]=useState(0),step=steps[selected];
 return <div className="mn-product">
  <div className="mn-product-tabs" role="tablist" aria-label="Explore the product journey">{steps.map((x,i)=><button key={x.key} type="button" role="tab" aria-selected={i===selected} onClick={()=>setSelected(i)} className={i===selected?"active":""}><span>0{i+1}</span> {x.title}</button>)}</div>
  <div className="mn-product-main">
   <div className="mn-product-showcase" role="tabpanel">
    <div className="mn-showcase-top"><div className="mn-browser-dots"><span/><span/><span/></div><small>{selected===1?"misenorth / owner workspace":selected===2?"misenorth / reservations":"yourrestaurant.ca / guest menu"}</small><span className="mn-showcase-live">INTERACTIVE DEMO</span></div>
    {selected===0?<div className="mn-guest-visual">
      <div className="mn-menu-cover"><img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85" alt="Warmly lit restaurant dining space" loading="lazy"/><div><span>NEIGHBOURHOOD CAFE · SAMPLE</span><strong>Cedar & Salt</strong><small>Welcome in. Stay a while.</small></div></div>
      <div className="mn-menu-inner"><div><b>Find your next favourite.</b><small>All-day menu · Pickup requests · Table QR</small></div><span>View menu ↗</span></div>
      <div className="mn-menu-cards"><article><img src="https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=440&q=80" alt="Breakfast plate" loading="lazy"/><span>Breakfast</span></article><article><img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=440&q=80" alt="Colourful salad bowl" loading="lazy"/><span>Lunch</span></article><article><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=440&q=80" alt="Coffee cups" loading="lazy"/><span>Coffee</span></article></div>
    </div>:selected===1?<div className="mn-ops-visual">
      <div className="mn-ops-sidebar"><strong>m<span>·</span></strong><i>▦</i><i>▤</i><i>♧</i></div>
      <div className="mn-ops-area"><span className="mn-ops-label">SAMPLE WORKSPACE · NOT REAL TRANSACTIONS</span><h3>Today's requests</h3><div className="mn-ops-filter"><b>New requests</b><span>In preparation</span><span>Ready</span></div><article><div><strong>Pickup request</strong><small>Demo guest · Request #101</small></div><b>New</b></article><article><div><strong>Dine-in request</strong><small>Demo guest · Table QR</small></div><b>In view</b></article><article><div><strong>Menu update</strong><small>Restaurant owner's workspace</small></div><b>Editable</b></article><div className="mn-ops-footer">Request flow only · Payment is handled separately</div></div>
    </div>:<div className="mn-booking-visual">
      <div className="mn-booking-photo"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=85" alt="Restaurant dining table set for a reservation" loading="lazy"/><div><small>HARBOUR & PINE · SAMPLE</small><strong>Make room for a good night.</strong></div></div>
      <div className="mn-booking-form"><span>TABLE REQUEST</span><h3>Save a seat.</h3><label>Party size <strong>2 guests</strong></label><label>Preferred date <strong>Choose a date</strong></label><label>Preferred time <strong>Select a time</strong></label><span className="mn-booking-button">Request a table ↗</span><small>Restaurant staff confirm availability.</small></div>
    </div>}
    <div className="mn-demo-caption">Illustrative product walkthrough using fictional restaurant examples; open the actual demo to test real guest and owner workflows.</div>
   </div>
   <div className="mn-product-copy"><span className="mn-eyebrow">{step.eyebrow}</span><h3>{step.headline}</h3><p>{step.desc}</p><Link href={step.href} className="mn-text-link">{step.cta} <span aria-hidden="true">↗</span></Link><div className="mn-product-help"><span>✓ Branded for each restaurant</span><span>✓ No POS replacement</span><span>✓ Guest requests stay visible</span></div></div>
  </div>
 </div>;
}
