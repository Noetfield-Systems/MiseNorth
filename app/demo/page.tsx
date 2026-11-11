import Link from "next/link";
import type {Metadata} from "next";
import DemoLauncher from "./demo-launcher";
import scenarios from "../../fixtures/demo-scenarios.json";
export const metadata:Metadata={title:"See MiseNorth in Action — Restaurant Product Demos",description:"Explore working guest menus, table QR flows and the restaurant owner workspace with clearly labelled fictional restaurant examples.",alternates:{canonical:"/demo"}};
const images=[
 "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
 "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
 "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80"
];
export default function Demo(){
 const featured=scenarios.slice(0,3),more=scenarios.slice(3);
 return <main className="growth-home mn-site mn-demo-page"><div className="mn-topbar"><div className="container mn-topbar-inner"><span><i/> TRY THE WORKING SOFTWARE</span><Link href="/grader">Free website audit ↗</Link></div></div>
 <header className="mn-header"><div className="container mn-head-inner"><Link href="/" className="mn-logo"><span className="mn-logo-glyph">m<span>·</span></span>mise<span>north</span></Link><nav className="mn-nav"><Link href="/">Platform</Link><Link href="/pricing">Pricing</Link><Link href="/grader">Free audit</Link></nav><div className="mn-nav-actions"><Link href="/login" className="mn-nav-login">Log in</Link><Link href="/#get-started" className="mn-button mn-nav-button">Discuss my restaurant ↗</Link></div></div></header>
 <section className="mn-demo-intro"><div className="container"><span className="mn-eyebrow"><span className="mn-eyebrow-dot"/> NO SLIDES. REAL WORKFLOWS.</span><h1>See it like your guests<br/><em>and your team would.</em></h1><p>Browse a restaurant website, open a menu, try the request flow and explore the private owner workspace. All demo restaurants and guests are <strong>fictional examples</strong>, not real clients or sales results.</p><div className="mn-demo-assurance">✓ Functional demos <span>·</span> ✓ No card required <span>·</span> ✓ No real food payments</div></div></section>
 <section className="mn-demo-featured"><div className="container"><div className="mn-section-heading"><div><span className="mn-eyebrow">PICK A RESTAURANT YOU RECOGNIZE</span><h2>Three ways to<br/><em>experience MiseNorth.</em></h2></div><p>Each demo has its own menu, operating model and owner workspace. Start with the scenario closest to your restaurant.</p></div>
 <div className="mn-demo-cards">{featured.map((s,i)=><article key={s.slug} className="mn-demo-tile">
  <div className="mn-demo-image"><img src={images[i]} alt={s.businessType+" restaurant example"} loading="lazy"/><span>FICTIONAL WORKING DEMO</span></div>
  <div className="mn-demo-card-body"><small>{s.businessType} · {s.area}</small><h3>{s.name}</h3><p>{s.description}</p><div className="mn-demo-actions"><Link href={"/r/"+s.slug} className="mn-button">Guest experience ↗</Link><DemoLauncher slug={s.slug}/></div></div>
 </article>)}</div></div></section>
 <section className="mn-demo-more"><div className="container"><div className="mn-section-heading"><div><span className="mn-eyebrow">EXPLORE MORE CONFIGURATIONS</span><h2>Different restaurants.<br/><em>Same simple journey.</em></h2></div><p>These fictional examples demonstrate tenant isolation and different menu and reservation settings; none is a paying customer.</p></div><div className="mn-demo-more-grid">{more.map(s=><article key={s.slug}><small>{s.area} · {s.businessType}</small><h3>{s.name}</h3><p>{s.focus}</p><div><Link href={"/r/"+s.slug}>Visit guest website ↗</Link><DemoLauncher slug={s.slug}/></div></article>)}</div></div></section>
 <section className="mn-scan-bottom"><div className="container mn-scan-bottom-inner"><div><span className="mn-eyebrow">LIKE WHAT YOU SEE?</span><h2>See how it fits your restaurant.</h2><p>Tell us what you serve and how guests find you today. No payment commitment required.</p></div><Link href="/#get-started" className="mn-button">Request my restaurant setup ↗</Link></div></section>
 <footer className="mn-footer"><div className="container mn-footer-bottom"><Link href="/">← MiseNorth homepage</Link><span>10 fictional workspaces · No verified client or revenue metrics</span></div></footer></main>;
}
