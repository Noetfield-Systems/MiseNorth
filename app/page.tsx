import Link from "next/link";
import type {Metadata} from "next";
import MarketingAudit from "./components/marketing-audit";
import MarketingDemo from "./components/marketing-demo";
import RestaurantMath from "./components/restaurant-math";
import InquiryForm from "./components/inquiry-form";
export const metadata:Metadata={
 title:"MiseNorth — Make your restaurant website work harder",
 description:"See what your restaurant website could improve. Give guests a better way to explore your menu, request pickup, and book a table. Free website scan and working restaurant demos.",
 alternates:{canonical:"/"},
 openGraph:{title:"A website that does more for your restaurant.",description:"Find website issues, show guests your real menu and bring direct requests to your team. Free audit. Built for independent restaurants.",url:"/"}
};
const jobs=[
 {number:"01",icon:"↗",problem:"People find you. Then leave.",title:"Turn your online presence into a clear next step.",copy:"A menu link shouldn't be a dead end. Give guests one branded place to discover what you serve and contact your restaurant.",caption:"Restaurant website + mobile menu"},
 {number:"02",icon:"◈",problem:"Requests land everywhere.",title:"Keep guest requests in one working queue.",copy:"Pickup questions, table requests and menu actions belong in a workflow your team can see—not another scattered inbox.",caption:"Staff-managed guest requests"},
 {number:"03",icon:"◎",problem:"Your regulars stay invisible.",title:"Build a relationship you can recognize.",copy:"Keep guest history and explicit consent records in a tenant-scoped workspace so you can understand the relationship over time.",caption:"Guest CRM + consent controls"}
];
const questions=[
 ["Does MiseNorth replace my POS?","No. MiseNorth is a guest-facing website, menu and request workflow that sits alongside your current POS. Orders are requests for your team to review; there is no automatic POS synchronization today."],
 ["Can guests pay for meals on my site?","Not yet through MiseNorth. Pickup and dine-in flows create unpaid requests. Your restaurant handles food payments using its existing process. Our own subscription billing is a separate Stripe integration."],
 ["Will MiseNorth promise me new sales?","No company can reliably guarantee how many extra guests you will get. The free audit shows measured website issues; the working demo shows what the software can do. Any revenue scenario is hypothetical, never claimed as your forecast."],
 ["Do I need to switch my current website?","You can inspect the free audit and test a sample restaurant without changing anything. We can discuss the right branded site or menu setup for your existing operation before you decide."],
 ["Is this suitable for a small café or one location?","Yes. The founding offer is designed around independent restaurants, neighbourhood cafés and other single-location operators. Multi-location requirements can be scoped separately."],
 ["Do you charge a percentage of my food sales?","MiseNorth does not currently process food purchases or charge a per-food-order commission. The proposed SaaS pricing is per restaurant location, plus an onboarding fee. Charges on your existing payment processor remain separate."],
 ["Can I see a real product instead of a sales presentation?","Yes. Open the guest storefront of a clearly labelled fictional restaurant, or explore the operator demo. The workspaces are functional examples, not testimonials from paying customers."],
 ["How do I get started if signup is not active yet?","Request founding restaurant access below. The inquiry goes directly into our private operator inbox. We will discuss your menu, current website and the setup you need. No card is collected on the inquiry form."]
];
export default function Home(){
 return <main className="growth-home mn-site">
 <div className="mn-topbar"><div className="container mn-topbar-inner"><span><i/> BUILT FOR INDEPENDENT CANADIAN RESTAURANTS</span><Link href="/grader">Free restaurant website check <span aria-hidden="true">↗</span></Link></div></div>
 <header className="mn-header"><div className="container mn-head-inner">
  <Link href="/" className="mn-logo" aria-label="MiseNorth homepage"><span className="mn-logo-glyph">m<span>·</span></span>mise<span>north</span></Link>
  <nav className="mn-nav" aria-label="Main navigation"><Link href="#why">Why it matters</Link><Link href="#platform">See the platform</Link><Link href="#pricing">Pricing</Link><Link href="#faq">FAQ</Link><Link href="/work-with-us">Work with us</Link></nav>
  <div className="mn-nav-actions"><Link href="/login" className="mn-nav-login">Log in</Link><Link href="#get-started" className="mn-button mn-nav-button">See it for my restaurant <span>↗</span></Link></div>
 </div></header>
 <section className="mn-hero">
  <div className="container mn-hero-inner"><div className="mn-hero-copy">
   <div className="mn-eyebrow"><span className="mn-eyebrow-dot"/> RESTAURANT WEBSITES THAT DO MORE</div>
   <h1>They found<br/>your restaurant.<br/><em>Don’t lose them<br/>at the menu.</em></h1>
   <p className="mn-lede">Give guests a better reason to choose you: a beautiful restaurant website, a menu they can use, and a direct way to reach your team. <strong>Without replacing your POS.</strong></p>
   <div className="mn-hero-audit"><MarketingAudit/></div>
   <div className="mn-hero-fine"><span><span className="mn-tick">✓</span> Real website checks</span><span><span className="mn-tick">✓</span> No credit card</span><span><span className="mn-tick">✓</span> Restaurant-first setup</span></div>
   <div className="mn-hero-secondary"><Link href="#platform">See how the product works <span>↗</span></Link><Link href="#get-started">Talk about my restaurant <span>↗</span></Link></div>
  </div>
  <div className="mn-hero-visual">
    <div className="mn-photo-wrap"><img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1500&q=90" alt="Warm independent restaurant dining room" fetchPriority="high"/><div className="mn-photo-caption"><span>REAL RESTAURANTS DESERVE BETTER DIGITAL EXPERIENCES</span><strong>The next guest starts here.</strong></div></div>
    <div className="mn-phone">
      <div className="mn-phone-top"><span>9:41</span><i/><span>●●●</span></div>
      <div className="mn-phone-image"><img src="https://images.unsplash.com/photo-1547573854-74d2a71d0826?auto=format&fit=crop&w=700&q=85" alt="Example restaurant dish presentation"/><span>GUEST WEBSITE · EXAMPLE</span></div>
      <div className="mn-phone-body"><small>CEDAR & SALT · SAMPLE</small><h3>Good food, good company.</h3><p>Menus, pickup requests and table links in one place.</p><span className="mn-phone-action">Explore the menu <b>↗</b></span><div className="mn-phone-mini"><span>◎ Table QR</span><span>◈ Pickup</span><span>♡ Bookings</span></div></div>
    </div>
    <div className="mn-hero-ticket"><div className="mn-ticket-symbol">↗</div><div><strong>Guest request received</strong><span>Visible to the restaurant team</span><small>Illustrative workflow · not a paid order</small></div></div>
  </div></div>
 </section>
 <section className="mn-cred"><div className="container mn-cred-inner"><span>NOT ANOTHER MARKETPLACE.</span><span>YOUR RESTAURANT’S OWN GUEST CHANNEL.</span><span>YOUR EXISTING POS STAYS.</span></div></section>
 <section className="mn-problem" id="why"><div className="container">
  <div className="mn-section-heading"><div><span className="mn-eyebrow">THE REASON RESTAURANT OWNERS CARE</span><h2>Your website should bring<br/><em>people closer to your tables.</em></h2></div><p>A guest who finds your menu should immediately know what to do next. Make those next steps easy, branded and manageable.</p></div>
  <div className="mn-problem-grid">{jobs.map(j=><article className="mn-problem-card" key={j.number}><div className="mn-problem-top"><span>{j.number} / THE GAP</span><b>{j.icon}</b></div><div><span className="mn-problem-overline">{j.problem}</span><h3>{j.title}</h3><p>{j.copy}</p></div><div className="mn-problem-foot"><span className="mn-small-check">✓</span>{j.caption}</div></article>)}</div>
 </div></section>
 <section className="mn-platform" id="platform"><div className="container">
  <div className="mn-section-heading mn-platform-heading"><div><span className="mn-eyebrow">DON’T TAKE OUR WORD FOR IT. TRY THE SOFTWARE.</span><h2>See the journey.<br/><em>Not just a feature list.</em></h2></div><p>Explore the flow your guest and your team would actually use. Every preview is clearly identified as a demonstration.</p></div>
  <MarketingDemo/>
 </div></section>
 <section className="mn-offer-band"><div className="container mn-offer-inner">
  <div className="mn-offer-heading"><span className="mn-eyebrow">YOUR RESTAURANT, WITHOUT THE SOFTWARE CHAOS</span><h2>Keep what already works.<br/><em>Make the guest journey better.</em></h2></div>
  <div className="mn-offer-items"><div><b>01</b><strong>No POS replacement</strong><span>Run the new guest channel alongside your current setup.</span></div><div><b>02</b><strong>Simple setup</strong><span>Start with your menu, your restaurant details and your brand.</span></div><div><b>03</b><strong>One place to respond</strong><span>Bring new guest requests and reservation reviews into view.</span></div></div>
 </div></section>
 <section className="mn-audit-section" id="free-audit"><div className="container mn-audit-inner">
  <div className="mn-audit-copy"><span className="mn-eyebrow">START WITH SOMETHING USEFUL — FREE</span><h2>Is your website<br/><em>working as hard as you do?</em></h2><p>Scan your restaurant website for measurable technical issues. You’ll get a shareable report and a clearly labelled concept of what a stronger first impression could look like.</p><div className="mn-audit-benefits"><span>✓ Search-friendly HTML checks</span><span>✓ Mobile scores when available</span><span>✓ Clear issues to review</span><span>✓ No email gate</span></div><Link href="/grader" className="mn-button mn-dark-button">See the free audit <span>↗</span></Link></div>
  <div className="mn-audit-panel" aria-label="Illustrative report preview">
   <div className="mn-audit-panel-head"><span><i/> MISE NORTH / WEBSITE CHECK</span><span>EXAMPLE REPORT LAYOUT</span></div><div className="mn-audit-panel-main"><div className="mn-audit-gauge"><span>?</span><small>Measured when scanned</small></div><div className="mn-audit-results"><div><b>Search foundations</b><span/></div><div><b>Mobile performance</b><span/></div><div><b>Site accessibility</b><span/></div><div><b>Technical best practices</b><span/></div></div></div>
   <div className="mn-audit-finding"><span>01</span><div><b>Know what’s missing.</b><small>Issues appear only when measured. Unavailable categories are not scored.</small></div><span>↗</span></div>
   <div className="mn-audit-finding"><span>02</span><div><b>See a new website direction.</b><small>A concept preview, not a changed live website.</small></div><span>↗</span></div>
  </div>
 </div></section>
 <section className="mn-how"><div className="container"><div className="mn-section-heading"><div><span className="mn-eyebrow">START WITHOUT THE BIG SWITCH</span><h2>A practical path from<br/><em>“maybe” to “let’s do it.”</em></h2></div><p>Review your online presence, test a working example and discuss a setup that fits your team.</p></div>
 <div className="mn-steps-grid"><article><span>01</span><h3>See what needs work</h3><p>Run the free restaurant website check. Get a factual starting point before buying anything.</p><Link href="/grader">Run a free scan ↗</Link></article><article><span>02</span><h3>Experience it as a guest</h3><p>Open a working demo with a real menu flow, table links and restaurant request intake.</p><Link href="/r/demo-cedar-salt-cafe">Open the guest demo ↗</Link></article><article><span>03</span><h3>Discuss your setup</h3><p>Send your restaurant details. We’ll discuss what you need, what’s included and a commercial offer.</p><Link href="#get-started">Request a setup conversation ↗</Link></article></div>
 </div></section>
 <section className="mn-math-section" id="value"><div className="container mn-math-layout"><div><span className="mn-eyebrow">THE ECONOMICS, WITHOUT A MADE-UP ROI CLAIM</span><h2>What could one extra<br/><em>fulfilled request mean?</em></h2><p>Explore the arithmetic with your own assumptions. Then compare the scenario with the proposed monthly subscription. It's a conversation starter—not an estimate of your future sales.</p><Link href="#get-started" className="mn-text-link">Talk through your restaurant’s numbers ↗</Link></div><RestaurantMath/></div></section>
 <section className="mn-price-section" id="pricing"><div className="container mn-price-grid"><div className="mn-price-copy"><span className="mn-eyebrow">ONE CLEAR FOUNDING OFFER</span><h2>Made for the<br/><em>independent operator.</em></h2><p>A proposed per-location plan, without a percentage commission from MiseNorth on food sales. You keep your existing payment and POS setup.</p><Link href="/pricing" className="mn-text-link">Explore full pricing and scope ↗</Link></div>
  <div className="mn-price-card"><span className="mn-price-label">FOUNDING RESTAURANT · PROPOSED</span><div className="mn-price-amount"><strong>$99</strong><span>CAD / location / month</span></div><p>+ $149 CAD one-time setup proposal</p><div className="mn-price-rule"/><div className="mn-price-includes"><span>✓ Branded restaurant website and menu</span><span>✓ Mobile-friendly table QR links</span><span>✓ Pickup and dine-in requests</span><span>✓ Reservation requests and staff review</span><span>✓ Guest records and owner dashboard</span></div><Link href="#get-started" className="mn-button mn-price-cta">Discuss my restaurant setup <span>↗</span></Link><small>Founding pricing is a proposal; checkout is not yet active. Guest food payments, POS sync and automated outbound campaigns are not included.</small></div>
 </div></section>
 <section className="mn-faq" id="faq"><div className="container mn-faq-grid"><div><span className="mn-eyebrow">THE QUESTIONS WE’D ASK TOO</span><h2>Clear answers.<br/><em>Before you buy.</em></h2><p>Restaurant operators have enough surprises. You should know what is working today and what isn't.</p><Link href="#get-started" className="mn-text-link">Ask about your specific setup ↗</Link></div><div className="mn-faq-list">{questions.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>
 <section className="mn-final" id="get-started"><div className="container mn-final-grid"><div><span className="mn-eyebrow">READY TO SEE IT FOR YOUR RESTAURANT?</span><h2>Your next guest<br/><em>deserves a better path.</em></h2><p>Tell us the restaurant name and the best way to reach you. We’ll start with your current website and a setup conversation—not a credit card form.</p><div className="mn-final-points"><span>✓ No payment information required</span><span>✓ Specific to your restaurant</span><span>✓ Your existing POS stays</span></div><Link href="/demo" className="mn-final-demo">Not ready yet? Explore the working demo ↗</Link></div><div className="mn-final-form"><InquiryForm intent="restaurant" source="homepage" headline="See what MiseNorth could look like for you"/></div></div></section>
 <footer className="mn-footer"><div className="container mn-footer-top"><div><Link href="/" className="mn-logo"><span className="mn-logo-glyph">m<span>·</span></span>mise<span>north</span></Link><p>Practical restaurant technology.<br/>Designed in Vancouver, Canada.</p></div><div><b>Explore</b><Link href="/grader">Free website audit</Link><Link href="/demo">Working product demo</Link><Link href="/pricing">Pricing</Link><Link href="/restaurants/vancouver">Vancouver restaurants</Link></div><div><b>Company</b><Link href="/partners">Partners</Link><Link href="/investors">Investors</Link><Link href="/operator">Operator</Link></div><div><b>Your workspace</b><Link href="/login">Sign in</Link><Link href="/signup">Restaurant access</Link><Link href="/forgot-password">Account recovery</Link></div></div><div className="container mn-footer-bottom"><span>© {new Date().getFullYear()} MiseNorth · A product of Noetfield Systems Inc.</span><span>Built for independent restaurants. No invented testimonials or sales claims.</span></div></footer>
 <div className="mn-mobile-cta"><Link href="/grader">Free website audit ↗</Link><Link href="#get-started">Get my setup ↗</Link></div>
 </main>;
}
