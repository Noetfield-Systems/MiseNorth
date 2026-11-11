import Link from "next/link";

function amount(name:string,fallback:number){
 const raw=process.env[name];
 if(!raw)return fallback;
 const n=Number(raw);
 return Number.isInteger(n)&&n>=0?n:fallback;
}
function cad(cents:number){
 return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(cents/100);
}
export default function Pricing(){
 const setup=amount("MISENORTH_FOUNDING_SETUP_CENTS",14900);
 const monthly=amount("MISENORTH_FOUNDING_MONTHLY_CENTS",4900);
 const published=process.env.MISENORTH_PRICING_PUBLIC_STATE==="published";
 return <main className="marketing">
  <header className="container marketing-nav"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><nav><Link href="/">Platform</Link><Link href="/demo">Explore demos</Link><Link href="/login">Sign in</Link><Link className="btn small" href="/signup">Request pilot access ↗</Link></nav></header>
  <section className="marketing-hero"><div className="container marketing-hero-grid"><div className="marketing-copy">
   <div className="eyebrow">Simple, location-based pricing</div>
   <h1>Keep your guest channel.<br/><span>Keep your POS.</span></h1>
   <p>MiseNorth is designed as a guest-facing digital operations layer for independent restaurants—not a POS replacement and not a percentage-of-sales marketplace.</p>
   <div className="marketing-proof"><span>Month-to-month hypothesis</span><span>Per-location pricing</span><span>No food-sales commission</span></div>
  </div>
  <aside className="panel" style={{padding:28,alignSelf:"center",background:"white",color:"#182d27",borderRadius:22}}>
   <div className="eyebrow">Founding restaurant partner</div>
   <h2 style={{fontSize:30,margin:"12px 0 6px"}}>{cad(setup)} <small style={{fontSize:14,fontWeight:500}}>one-time setup</small></h2>
   <div style={{fontSize:32,fontWeight:750,marginBottom:6}}>{cad(monthly)}<small style={{fontSize:14,fontWeight:500}}>/location/month</small></div>
   <span className="status">{published?"Published pricing":"Pricing hypothesis · discovery only"}</span>
   <p className="tiny muted" style={{marginTop:14}}>These amounts are configurable using MISENORTH_FOUNDING_SETUP_CENTS and MISENORTH_FOUNDING_MONTHLY_CENTS. They are not a live subscription offer until Stripe Billing is commissioned and commercial terms are approved.</p>
   <Link className="btn full" href="/signup">Request a founding-partner discussion ↗</Link>
   <p className="tiny muted" style={{marginTop:12}}>No percentage commission on guest food sales. No charge is taken by this page.</p>
  </aside></div></section>
  <section className="container marketing-section"><div className="marketing-section-head"><div className="eyebrow">Included in the initial scope</div><h2>Focused on the guest journey.</h2><p>Useful on its own, without pretending to be the restaurant's payment processor or POS.</p></div>
   <div className="marketing-feature-grid">
    <article><span>01</span><h3>Branded guest page</h3><p>Restaurant identity, live menu, category and item information, location and contact details.</p></article>
    <article><span>02</span><h3>QR menu access</h3><p>Table-specific QR links to the restaurant's guest menu and request context.</p></article>
    <article><span>03</span><h3>Direct order requests</h3><p>Unpaid pickup and dine-in requests in an owner/staff inbox. Payment remains with the restaurant.</p></article>
    <article><span>04</span><h3>Reservation intake</h3><p>Booking requests and staff confirmation. No automatic floor-plan or table allocation engine.</p></article>
    <article><span>05</span><h3>Guest records</h3><p>Request history and marketing consent. Paid visits, lifetime spend and food payments are not inferred.</p></article>
    <article><span>06</span><h3>Owner and staff access</h3><p>Tenant-scoped operations with role restrictions and a visible audit trail for supported actions.</p></article>
   </div>
  </section>
  <section className="marketing-demo-band"><div className="container"><div><div className="eyebrow">Not included yet</div><h2>No hidden feature promises.</h2><p>Live POS synchronisation, guest card payments, automated marketing delivery, inventory, food cost, labour scheduling and full table allocation are separate future commissioning gates.</p></div><Link className="btn pale" href="/demo">Inspect the product first ↗</Link></div></section>
  <footer className="container footer"><span>© {new Date().getFullYear()} MiseNorth</span><span>Vancouver, BC · CAD · Month-to-month price hypothesis</span></footer>
 </main>;
}
