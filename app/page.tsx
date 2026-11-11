import Link from "next/link";

const strengths=[
 {number:"01",eyebrow:"Get discovered",title:"A website that works for your restaurant.",body:"Give guests a branded home for your menu, location and direct actions. Your restaurant should own its first impression.",label:"Branded storefront"},
 {number:"02",eyebrow:"Turn interest into orders",title:"Make the next step effortless.",body:"Let guests send pickup and dine-in order requests, scan a table QR, and request reservations from one familiar experience.",label:"Direct guest channel"},
 {number:"03",eyebrow:"Keep the relationship",title:"Know your guests beyond their first visit.",body:"Keep consent-aware guest history, request tracking and campaign drafts together—without pretending unpaid requests are paid sales.",label:"Guest relationships"}
];
export default function Home(){
 return <main className="growth-home">
  <div className="growth-announcement"><span className="growth-pulse"/><span>Built for independent restaurants in Canada</span><Link href="/grader">Try the free website audit <span aria-hidden="true">↗</span></Link></div>
  <header className="growth-header">
   <div className="container growth-header-inner">
    <Link href="/" className="growth-logo"><span className="growth-logo-mark">M<span>.</span></span><span>MiseNorth</span></Link>
    <nav className="growth-desktop-nav" aria-label="Main"><Link href="#platform">Platform</Link><Link href="#how">How it works</Link><Link href="/pricing">Pricing</Link><Link href="/demo">Live demo</Link></nav>
    <div className="growth-nav-right"><Link className="growth-signin" href="/login">Log in</Link><Link href="/grader" className="growth-nav-cta">Free website audit <span>↗</span></Link></div>
   </div>
  </header>
  <section className="growth-hero">
   <div className="growth-orb growth-orb-one"/><div className="growth-orb growth-orb-two"/>
   <div className="container growth-hero-grid">
    <div className="growth-hero-copy">
     <div className="growth-kicker"><span className="growth-kicker-dot"/> THE RESTAURANT GROWTH PLATFORM</div>
     <h1>Your restaurant.<br/>Your guests.<br/><em>Your growth.</em></h1>
     <p>Everything independent restaurants need to show up online, capture direct guest requests, and build stronger relationships. One beautiful home. Your existing POS stays.</p>
     <div className="growth-hero-actions"><Link href="/grader" className="growth-primary">Grade my restaurant website <span>↗</span></Link><Link href="/demo" className="growth-secondary">Explore the platform <span>↗</span></Link></div>
     <div className="growth-hero-proof"><span>✓ Free, measured website audit</span><span>✓ No POS replacement required</span><span>✓ Made for Canadian restaurants</span></div>
    </div>
    <div className="growth-product-scene" aria-label="Illustrative restaurant website and operating dashboard preview">
      <div className="growth-preview-browser">
       <div className="growth-browser-bar"><div className="growth-browser-dots"><i/><i/><i/></div><span>your-restaurant.com</span><span className="growth-browser-lock">◈</span></div>
       <div className="growth-storefront"><div className="growth-storefront-photo"><div className="growth-photo-plate"><div className="growth-photo-bite"/><div className="growth-photo-bite two"/><div className="growth-photo-herb"/></div></div>
       <div className="growth-storefront-copy"><span className="growth-storefront-eyebrow">YOUR BRAND. YOUR GUESTS.</span><strong>Good food.<br/>Right here.</strong><span className="growth-storefront-sub">A lovely place to discover what’s on the menu.</span><span className="growth-storefront-button">Explore the menu ↗</span></div></div>
      </div>
      <div className="growth-float-card"><div className="growth-float-icon">↗</div><div><span className="growth-float-label">A DIRECT GUEST JOURNEY</span><strong>Discover → Menu → Request</strong><small>Illustrative product experience</small></div></div>
      <div className="growth-small-card"><span>MISE<span style={{color:"#b9ec87"}}>NORTH</span> / OWNER VIEW</span><div className="growth-mini-flow"><b>Guest request</b><i>Received</i></div><div className="growth-mini-flow"><b>Kitchen queue</b><i>In view</i></div><div className="growth-mini-flow"><b>Guest history</b><i>Connected</i></div><small>Sample interface · no real merchant data</small></div>
    </div>
   </div>
  </section>
  <section className="growth-strip"><div className="container growth-strip-inner"><span>LESS FRICTION.</span><span>MORE CONTROL.</span><span>BETTER GUEST EXPERIENCES.</span><span>BUILT FOR RESTAURANTS.</span></div></section>
  <section className="growth-audit-spotlight" id="audit">
   <div className="container growth-audit-grid"><div><span className="growth-section-eyebrow">YOUR FIRST WIN IS FREE</span><h2>Know what your website is <em>missing.</em></h2><p>Before changing anything, understand your restaurant’s mobile speed, SEO fundamentals, accessibility and website best practices—with real Lighthouse measurements, not a made-up rating.</p><Link className="growth-dark-button" href="/grader">Get my free restaurant website report ↗</Link></div>
   <div className="growth-audit-illustration"><div className="growth-report-head"><span>WEBSITE HEALTH CHECK</span><span>Mobile · Lighthouse</span></div><div className="growth-report-middle"><div className="growth-report-circle"><span>—</span><small>Measured when scanned</small></div><div className="growth-report-lines"><div><span>SEO fundamentals</span><b/></div><div><span>Mobile performance</span><b/></div><div><span>Accessibility</span><b/></div><div><span>Best practices</span><b/></div></div></div><div className="growth-report-foot">No invented grades. Every result comes from an actual scan.</div></div></div>
  </section>
  <section className="growth-features-section" id="platform"><div className="container"><div className="growth-section-top"><span className="growth-section-eyebrow">ONE CONNECTED GUEST EXPERIENCE</span><h2>Everything guests need.<br/><em>Nothing they don’t.</em></h2><p>From the first Google search to the next visit, make every touchpoint feel like your restaurant.</p></div><div className="growth-feature-grid">{strengths.map(s=><article className="growth-feature" key={s.number}><div className="growth-feature-top"><span>{s.number}</span><span>{s.label} ↗</span></div><div className="growth-feature-art"><span className="growth-art-ring"/><span className="growth-art-tile">{s.number==="01"?"⌁":s.number==="02"?"↗":"♡"}</span></div><div className="growth-feature-content"><span className="growth-feature-eyebrow">{s.eyebrow}</span><h3>{s.title}</h3><p>{s.body}</p></div></article>)}</div></div></section>
  <section className="growth-how" id="how"><div className="container growth-how-grid"><div><span className="growth-section-eyebrow light">SIMPLE FROM DAY ONE</span><h2>From overlooked<br/>to <em>outstanding.</em></h2><p>Don't hire an agency or rip out your existing tools just to get started. Begin with the guest experience and improve what you can measure.</p><Link href="/signup" className="growth-primary">Create your workspace ↗</Link></div><div className="growth-steps"><div><span>01</span><section><strong>Scan your current website</strong><p>See real website performance and prioritized technical improvements.</p></section></div><div><span>02</span><section><strong>Create your branded restaurant home</strong><p>Set up a menu, pickup and dine-in request flows, table QR links and reservation intake.</p></section></div><div><span>03</span><section><strong>Manage requests and guest relationships</strong><p>Keep guest requests visible to staff and use consent-aware contact records for future growth.</p></section></div></div></div></section>
  <section className="growth-approach"><div className="container growth-approach-grid"><div><span className="growth-section-eyebrow">BUILT AROUND RESTAURANT REALITY</span><h2>Keep the tools that work.<br/><em>Improve what guests see.</em></h2></div><div><p>MiseNorth is a direct guest channel and operational companion—not a replacement for your existing POS. Pickup and dine-in are currently request flows; payment processing, live POS sync and automated campaigns are separate integrations.</p><Link href="/pricing">See exactly what is included ↗</Link></div></div></section>
  <section className="growth-bottom"><div className="container growth-bottom-card"><div><span className="growth-kicker">THE NEXT CHAPTER STARTS WITH YOUR RESTAURANT</span><h2>Own your next<br/><em>guest relationship.</em></h2><p>Start with a free audit. See the product. Decide what makes sense for your team.</p><Link href="/grader" className="growth-primary">Get my website report ↗</Link></div><div className="growth-bottom-symbol" aria-hidden="true">M<span>.</span></div></div></section>
  <footer className="growth-footer"><div className="container growth-footer-grid"><div><Link href="/" className="growth-logo"><span className="growth-logo-mark">M<span>.</span></span><span>MiseNorth</span></Link><p>Restaurant technology designed in Vancouver, Canada.</p></div><div><b>Platform</b><Link href="/grader">Free website audit</Link><Link href="/demo">Product demo</Link><Link href="/pricing">Pricing</Link></div><div><b>Company</b><Link href="/partners">Partners & cofounders</Link><Link href="/investors">Investor overview</Link><Link href="/signup">Get started</Link></div><div><b>Existing customers</b><Link href="/login">Sign in</Link><Link href="/forgot-password">Account recovery</Link></div></div><div className="container growth-footer-bottom"><span>© {new Date().getFullYear()} MiseNorth · A Noetfield Systems Inc. product</span><span>Built for restaurants, not marketplaces.</span></div></footer>
 </main>;
}
