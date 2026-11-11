# MiseNorth — Restaurant Company OS v1 · North Star & execution charter
**Date:** 2026-11-10 (Vancouver)  
**Owner:** Noetfield Systems Inc.  
**Product ID:** `noetfield.misenorth`  
**Status:** executable operating contract; evidence gates distinguish shipped code from external commercial facts.

## 1. Single company goal

**North Star: verified paying restaurant locations (VPRL).**

A location counts only if it is NOT a demo, its subscription and entitlement are active, the latest Stripe invoice is confirmed paid, and the paid period has not expired. The application must display **unavailable**, not zero, when live billing/verified ledger data is not connected. A "Won" CRM stage is not a payment; a registered restaurant workspace is not a paid location. Requested guest order value and gift card value are not MiseNorth receipts.

Metrics under the North Star:

| Funnel | Leading measure | Accepted evidence |
|---|---|---|
| Discover | Useful website audits | Persisted source, URL, timestamp and report ID |
| Capture | Restaurant-initiated inquiries | Persisted non-test inbound inquiry |
| Qualify | Merchant opportunities | Operator classification, owner and next action |
| Propose | Offers actually presented | Proposal terms, customer acknowledgment |
| Checkout | Stripe checkout started | Server-generated Checkout session ID |
| Collect | Paid locations | Verified live Stripe events/invoices joined to restaurant entitlement |
| Activate | Working restaurant | Live non-demo tenant, menu/QR/guest workflows tested by merchant |
| Retain | Paid locations retained | Live subscription and successful continued use |

The front-door offer is practical: branded restaurant website + digital menu + unpaid direct request workflow + guest relationship operations, without replacing POS. Never promise meal checkout, automated POS sync, or revenue uplift until genuinely available and measured.

## 2. Specialized business operating system

One business, six desks:
1. **Acquire**: Local research, public grader, SEO, organic acquisition. Owner: Growth.
2. **Convert**: Inbound CRM, appropriate demo, follow-up, scoped proposal. Owner: Sales.
3. **Activate**: Restaurant-specific setup, menu import, QR signage, guest request/reservation operations. Owner: Delivery.
4. **Retain**: Operator support, issue prevention and measurable merchant value. Owner: Customer Success.
5. **Collect**: Correct Stripe account, payment state, invoices, tax and recovery. Owner: Finance.
6. **Partner**: Human and agent applications, work packet assignment, contribution review. Owner: Partnerships.

Operating loop: **DISCOVER → AUDIT → DEMO → INQUIRE → QUALIFY → PROPOSE → ONBOARD → CHECKOUT → VERIFIED PAYMENT → ACTIVATE → RETAIN**.

A work packet is `{id, domain, trigger, objective, owner, priority, action, evidenceRequired, href, state}`. Initial state is `proposed_not_executed`. This is intentionally not a fictional agent execution transcript.

Public collaboration API: `GET /api/agents/manifest` and `POST /api/work-with-us`. Internal command: `GET /api/operator/company-os`, collaborator queue: `GET /api/operator/collaborators`, operator review via `PATCH /api/operator/collaborators/:id`. Existing `GET /api/internal/company-os/snapshot` is extended to carry the North Star, departments and task packets, and **still requires the existing bearer shared-secret configuration**. Never claim the Sina Founder OS runtime has consumed this export until a successful authorized request and receipt are observed.

## 3. Work With Us: human and agent economics

**Human lanes:** restaurant introducers, local business development, creative/marketing, implementation, support, engineering. A merchant referral is eligible for proposed compensation only when an explicit agreed referral attribution AND actual paid invoice are verified; no automatic percentage, guaranteed commission or entitlement is created by application.

**Agent lanes:** website research, structured audit summaries, deterministic qualification support, QA regression, site asset generation, data hygiene, and bounded implementation. Self-declared capabilities are not proof of a working agent. Every accepted agent requires an accountable human operator and a separate job scope; no public API key or access to merchant data is issued on sign-up.

**Selection sequence:** apply → review → optional scope and terms → explicit assignment → run within boundary → independent acceptance evidence → invoice/payout under agreed commercial terms. The application page states no employment or payment promise.

Contributions should preferably be single, verifiable packets:
- Intro: a consenting restaurant lead, correctly attributed to its origin;
- Grader: reproducible report, URL, timestamp and source quality;
- Delivery: a live tenant acceptance run with menu, QR and guest workflow;
- Agent QA: deterministic reproduction, test output, reviewed PR or public report.

Do not store production secrets in application metadata or expose contact data from the public endpoint. Public submissions are rate-limited, validated, idempotent and operator-only after ingestion.

## 4. Operating sales strategy

**Best first buyer:** owner-operated Vancouver restaurants with 1–3 locations, weak mobile menu/guest funnel and a clear decision maker. Do not lead with an all-in-one POS replacement. Show the merchant one concrete problem, one measured audit finding, one real product demo and one scoped recurring offer.

**Offer:** use the currently published founding proposal of **CAD $99 / location / month plus CAD $149 one-time setup** only after its customer-facing terms and actual Stripe prices are reconciled. No paid checkout claim until the exact `acct_1SfSseJ03eJkL57J` live account, CAD prices, signed webhooks, taxes, portal, and entitlement updates are verified.

**First seven commercially relevant actions:**
1. Confirm live Grader → report → tailored preview → customer-initiated inquiry works.
2. Produce three public, attributable restaurant-site research briefs.
3. Identify a narrow initial Vancouver segment; prioritize independent operators over large chain procurement.
4. Contact only appropriate business channels for relevant, non-misleading outreach and respect response/opt-out rules.
5. Run one owner demo with a clear merchant use case and time-to-value.
6. Offer real founding terms and a defined implementation scope.
7. Convert first actual merchant through signed-up account, confirmed payment and a working location.

**30-day scorecard:** number of relevant audited businesses; consented inquiries; first demos; qualified proposals; verified paying locations; onboarding elapsed time; churn/retention signals. Refuse fabricated conversion rates when denominators are too small.

**90-day flywheel:** audited site → useful report → relevant branded workflow → referral introduced by merchant → repeatable onboarding → retained paid location → documented public case study ONLY with permission.

## 5. Three real Vancouver businesses: research-led validation

These are **independent public-site research cases, not MiseNorth customers or endorsements**. No merchant data or payment is created from this dossier. Verified source information below is not proof of pain or willingness to pay.

### Case A — Nuba: multi-location hospitality
**Verified public facts:** `https://www.nuba.ca/` describes the brand and four Vancouver locations, plus event/catering and online gift cards. `https://www.nuba.ca/contact` lists the Gastown, Yaletown, Kitsilano and Mount Pleasant locations and existing reservation options.

**Story:** guest discovers site → selects correct location and desired service → sees clear menu/booking/event path → if interested, reaches merchant through its current booking tool. **Product hypothesis:** a MiseNorth guest site could unify location-specific menu, inquiry and staff routing without replacing the restaurant's existing reservation tools. This is a hypothesis, not an observed defect.

**Test contract:** public website audit → attributed research report → synthetic non-customer lead in isolated CI → qualification with explicit location requirement → proposal state → prove no paid location is counted. Do not merge Nuba locations into one billing tenant.

### Case B — Tacofino: fast casual and pickup
**Verified public facts:** `https://www.tacofino.com/locations` lists Lower Mainland locations, pickup ordering links, and delivery marketplace links.

**Story:** guest picks location → chooses pickup → existing ordering journey is used → restaurant sees existing workflow. **Product hypothesis:** MiseNorth could add an owned guest hub and repeat-guest flow; it must not falsely claim there are no existing direct pickup or delivery channels.

**Test contract:** public audit → synthetic isolated inquiry with pickup intent → qualification → proposal → verify an unpaid request is not recorded as a Stripe food payment or paid subscription.

### Case C — Vij's: premium reservation-led dining
**Verified public facts:** `https://www.vijs.ca/` shows its Cambie Street location, reservation path, and published dining information; the Michelin Guide has an independent listing.

**Story:** guest finds a celebrated dining experience → reviews food and restaurant information → follows the restaurant's actual booking process. **Product hypothesis:** MiseNorth could complement the branded guest experience and guest follow-up if the owner sees value; do not claim the current booking journey is broken.

**Test contract:** public audit → synthetic research inquiry for reservation-related workflow → CRM qualification → proposal → check that a reservation request is not a confirmed booking and no merchant was contacted.

**What is and is not verified:** Public business identity and websites are source-supported. Three isolated CRM life-cycle simulations are covered by `tests/three-business-stories.e2e.mjs`. Actual public website scanning is separately attempted by `scripts/three-real-business-audits.mjs` and publishes a machine-readable artifact; failed/limited scans remain NOT_VERIFIED. No merchant consent, sales conversation, signed contract, actual charge or paid retention has been demonstrated by these tests.

## 6. Acceptance, operating boundaries, and immediate value

A release is eligible when unit and E2E tests pass, unauthorized operator endpoints reject access, the Work With Us public form persists accurate applications, the operator can review them, the Company OS shows a truthful North Star and packets, existing restaurant flows do not regress, and the deployed commit and live health are verified.

**Business acceptance is distinct:** first customer initiating an inquiry, genuinely accepting terms, completing Stripe payment, operating a live non-demo location and having the invoice reconcilable to that location. Only that evidence makes the North Star increment. Design polish and synthetic CI passes do not substitute for it.
