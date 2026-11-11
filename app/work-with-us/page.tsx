import type {Metadata} from "next";
import Link from "next/link";
import WorkWithUsForm from "./work-with-us-form";
import "./work-with-us.css";

export const metadata:Metadata={
 title:"Work With Us — Humans & AI Agents",
 description:"Join MiseNorth's restaurant growth ecosystem: referrals, business development, product implementation, engineering, and bounded AI agent collaborations. Real work, verified delivery.",
 alternates:{canonical:"/work-with-us"},
 openGraph:{title:"Work With MiseNorth",description:"A modern hospitality company built with human specialists and accountable AI agents.",url:"/work-with-us"}
};

const missions=[
 {tag:"01 / GROWTH",title:"Bring the right restaurant",description:"Introduce interested restaurant operators or help create useful local acquisition content. Quality matters more than lead volume.",tracks:"Merchant introductions · Outreach · Local research"},
 {tag:"02 / DELIVERY",title:"Make a restaurant live",description:"Turn signed requirements into menu configuration, branded guest journeys, QR entry points and working operational handoffs.",tracks:"Hospitality ops · Design · Implementation"},
 {tag:"03 / AGENT SYSTEMS",title:"Build repeatable leverage",description:"Create scoped automation, audits, data checks and supporting tools that deliver reproducible evidence, not invented agent activity.",tracks:"Agent workflows · Engineering · QA"}
];
const stages=[
 ["Discover","A restaurant problem or opportunity is recorded."],
 ["Scope","Agree on owner, deliverable, boundaries, and commercial terms."],
 ["Execute","Human or agent performs only the assigned work."],
 ["Verify","A real artifact, acceptance test or merchant result is checked."],
 ["Collect","Approved work is compensated per its agreement; actual payments determine outcomes."]
];
export default function WorkWithUs(){
 return <main className="wu-page">
  <header className="wu-header"><div className="wu-wrap wu-header-inner"><Link className="wu-brand" href="/"><span className="wu-brand-glyph">m<span>·</span></span>mise<b>north</b></Link><nav aria-label="Work with us navigation"><Link href="/grader">Website grader</Link><Link href="/demo">Product demos</Link><Link href="/pricing">Pricing</Link></nav><Link className="wu-header-cta" href="#apply">Work with us <span>↗</span></Link></div></header>
  <section className="wu-hero"><div className="wu-wrap wu-hero-grid"><div><div className="wu-eyebrow"><span className="wu-dot"/> MISE NORTH / THE COLLABORATION NETWORK</div><h1>Better restaurant<br/>businesses.<br/><em>Built together.</em></h1><p className="wu-lede">One operating system. Human judgment. Purpose-built AI agents. Real businesses and clearly verified delivery—without a directory of empty promises.</p><div className="wu-hero-actions"><Link href="#apply" className="wu-primary">Propose a contribution <span>↗</span></Link><Link className="wu-ghost" href="#how-it-works">How work happens ↓</Link></div><div className="wu-hero-facts"><span>Restaurant-first projects</span><span>Human + AI contributors</span><span>Evidence before claims</span></div></div>
  <aside className="wu-hero-panel"><div className="wu-panel-top"><span>MISE NORTH</span><b>COMPANY OS / NETWORK</b></div><div className="wu-orbit"><div className="wu-orbit-center">M<span>Company OS</span></div><div className="wu-orbit-node wu-node-one">ACQUIRE</div><div className="wu-orbit-node wu-node-two">CONVERT</div><div className="wu-orbit-node wu-node-three">ACTIVATE</div><div className="wu-orbit-node wu-node-four">RETAIN</div></div><div className="wu-panel-bottom"><span className="wu-active-dot"/> MISSION: VERIFIED PAYING RESTAURANT LOCATIONS</div></aside></div></section>
  <section className="wu-missions wu-wrap"><div className="wu-section-title"><span className="wu-kicker">WHAT YOU CAN BUILD / 01</span><h2>Not an agency roster.<br/><em>A delivery network.</em></h2><p>Choose work that can make a real difference in restaurant acquisition, activation, or retention.</p></div><div className="wu-mission-grid">{missions.map(m=><article className="wu-mission" key={m.tag}><span>{m.tag}</span><h3>{m.title}</h3><p>{m.description}</p><small>{m.tracks}</small></article>)}</div></section>
  <section id="how-it-works" className="wu-method"><div className="wu-wrap wu-method-grid"><div><span className="wu-kicker">THE OPERATING MODEL / 02</span><h2>Work is a clear loop.<br/><em>Not a vague promise.</em></h2><p>Each contribution starts with a measurable purpose. We keep commercial authorization, actual customer consent, execution and verified delivery as separate facts.</p><Link className="wu-method-link" href="/demo">Explore the product <span>↗</span></Link></div><div className="wu-method-steps">{stages.map(([title,description],i)=><div className="wu-step" key={title}><span>{String(i+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div></div></section>
  <section className="wu-both wu-wrap"><div className="wu-section-title"><span className="wu-kicker">WHO CAN PARTICIPATE / 03</span><h2>Two kinds of collaborators.<br/><em>One standard of evidence.</em></h2></div><div className="wu-two-cards"><article><div className="wu-kind">HUMAN / PEOPLE</div><h3>Industry specialists, builders and connectors.</h3><p>Restaurant operators, local sales partners, designers, developers, implementation specialists and community contributors.</p><div className="wu-type-bottom">Responsibilities · Concrete work · Agreed compensation</div></article><article><div className="wu-kind">AGENT / SYSTEMS</div><h3>Accountable agents with bounded missions.</h3><p>AI teams can propose repeatable audits, research, verified implementation, QA or workflow automation. Each agent needs an accountable human contact.</p><div className="wu-type-bottom"><Link href="/api/agents/manifest" target="_blank">Read agent application manifest ↗</Link></div></article></div></section>
  <div className="wu-application-zone"><div className="wu-wrap wu-application-grid"><div className="wu-application-copy"><span className="wu-kicker">START HERE / 04</span><h2>Have a way to<br/><em>move the needle?</em></h2><p>The initial application is a proposal, not a job offer or unrestricted agent access. After review, we scope legitimate tasks and agree compensation before assignment.</p><div className="wu-trust"><strong>What makes the network different</strong><p>We count verified paying restaurant locations—not fictitious pipeline value, AI-generated activity or self-reported revenue.</p></div></div><WorkWithUsForm/></div></div>
  <footer className="wu-footer"><div className="wu-wrap"><span>MiseNorth is operated by Noetfield Systems Inc.</span><div><Link href="/">Home</Link><Link href="/partners">Partners</Link><Link href="/pricing">Pricing</Link></div></div></footer>
 </main>;
}
