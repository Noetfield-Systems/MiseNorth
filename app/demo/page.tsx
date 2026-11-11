import Link from "next/link";
import DemoLauncher from "./demo-launcher";
import scenarios from "../../fixtures/demo-scenarios.json";

export const metadata={
 title:"Vancouver restaurant pilot · MiseNorth",
 description:"Explore ten synthetic Vancouver restaurant customer workspaces operated by role-based test agents."
};

export default function DemoPage(){
 const sampleGuests=scenarios.reduce((sum,s)=>sum+s.guests.length,0);
 const sampleOrders=scenarios.reduce((sum,s)=>sum+s.orders.length,0);
 const neighbourhoods=new Set(scenarios.map(s=>s.area)).size;
 return <main className="demo-page">
  <div className="container demo-nav"><Link href="/" className="brand"><span className="brand-mark">M</span>MiseNorth</Link><div><span className="tiny muted">Vancouver · British Columbia</span><Link href="/signup" className="btn small">Create a real restaurant account</Link></div></div>
  <section className="container demo-intro">
   <div className="eyebrow">Vancouver · Agent-operated product pilot</div>
   <h1>Ten restaurant models.<br/><span>One connected service platform.</span></h1>
   <p>Ten independent sample workspaces across Vancouver neighbourhoods. Each includes a fictional owner, menu, tables, guest history, kitchen activity and a booking flow matched to its restaurant type.</p>
   <div className="demo-assurance"><b>10 SYNTHETIC PILOT CUSTOMERS</b><span>These are fictional restaurant accounts and role-based agent simulations, not real businesses, live customers, reviews, sales or market traction. No payment is taken and no campaign is sent. Every sample tenant is isolated from real merchant workspaces.</span></div>
   <div className="demo-pilot-summary"><div><b>{scenarios.length}</b><span>restaurant workspaces</span></div><div><b>{sampleGuests}</b><span>sample guest profiles</span></div><div><b>{sampleOrders}</b><span>opening sample orders</span></div><div><b>{neighbourhoods}</b><span>Vancouver neighbourhoods</span></div></div>
  </section>
  <section className="container demo-grid">{scenarios.map((s,i)=><article className={"demo-card "+(["sage","blue","clay"][i%3])} key={s.slug}>
   <div className="demo-card-top"><span className="demo-number">{String(i+1).padStart(2,"0")}</span><span className="demo-tag">SYNTHETIC PILOT</span></div>
   <div className="eyebrow">{s.businessType} · {s.area}</div><h2>{s.name}</h2><p>{s.description}</p>
   <div className="demo-focus">{s.focus}</div>
   <div className="demo-proof"><span>✓ Independent tenant & owner agent</span><span>✓ {s.categories.length} menu categories · {s.tables.length} tables</span><span>✓ {s.guests.length} guest profiles · {s.orders.length} sample orders</span><span>{s.acceptingReservations?"✓ Reservation workflow included":"— Reservations intentionally disabled"}</span></div>
   <div className="demo-card-foot"><span>Owner agent · {s.ownerName}</span><div className="demo-actions"><Link className="btn ghost small" href={"/r/"+s.slug} target="_blank">Guest storefront ↗</Link><DemoLauncher slug={s.slug}/></div></div>
  </article>)}</section>
  <section className="container demo-next"><div><div className="eyebrow">Agent testing protocol</div><h2>Guest request → owner inbox → kitchen or booking decision.</h2><p>Automated role-based agents validate each tenant's storefront, menu, unpaid order intake, legal order progression, guest CRM, reservation policy and cross-tenant access boundary.</p></div><Link href="/" className="btn secondary">Back to MiseNorth</Link></section>
  <footer className="container footer"><span>© {new Date().getFullYear()} MiseNorth</span><span>Vancouver · synthetic pilot cohort · no real transactions</span></footer>
 </main>;
}
