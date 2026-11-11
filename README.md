# MiseNorth — Vancouver Restaurant Platform

MiseNorth is a multi-tenant restaurant operations application with a Choice-style starting scope: restaurant web presence, digital menu, QR tables, direct pickup/dine-in requests, reservation intake, owner command centre, guest CRM, loyalty and campaign drafts.

## Ten-customer synthetic pilot
- `/demo` exposes ten independent, fictional Vancouver restaurant workspaces in Kitsilano, Gastown, Mount Pleasant, Yaletown, West End, Commercial Drive, Kerrisdale, Chinatown, Olympic Village and Marpole.
- Each has a separately seeded demo tenant with owner, manager and staff identities, CAD menu, tables, three sample guests, three opening orders, loyalty entries and a campaign draft. Booking policy differs by restaurant. Demo seeding is explicit (`MISENORTH_SEED_DEMOS=true`); normal Production startup does not rewrite fixtures.
- These are test customers, not real merchants, acquisition, reviews, payments, sales or traction. Synthetic contacts use reserved `.test` domains; no messages are sent and sample orders are unpaid.
- The public owner-agent session endpoint accepts only the ten allowlisted fixture slugs and rows marked `is_demo=true`. Demo password login is disabled.
- `tests/agent-pilot.e2e.mjs` runs owner, guest and shift-manager test agents against a running Next.js service and PostgreSQL. It tests storefronts, owner/manager/staff binding, role boundaries, order intake and progression, CRM consent and withdrawal, booking policy, account recovery, session revocation, support/privacy requests, data export and cross-tenant access.
- GitHub Actions runs the suite against isolated PostgreSQL and, on the Production branch, against the Railway Production HTTP endpoint. Reports are uploaded as workflow artifacts.

## Operational behaviour
- Each restaurant has an isolated tenant; owner resource queries are scoped by restaurant ID.
- CAD and America/Vancouver defaults. New merchants start at 0% and unverified; owners must explicitly attest to their own tax setting before order requests are accepted. Existing rates are never silently reinterpreted. MiseNorth does not determine legal tax obligations.
- Guest order submissions are unpaid requests, not sales. Requested order value is not collected revenue; food payments, paid visits and collected guest spend remain `NOT_TRACKED` until a verified payment/reconciliation flow exists. Unpaid requests do not award loyalty points.
- Orders enter as unpaid requests and require staff acceptance and kitchen progression.
- Reservations remain requests until staff confirmation. Capacity checks and inserts are serialized per restaurant using a PostgreSQL advisory transaction lock. This is a cover-level overlap guard, not table assignment or a waitlist engine.
- Marketing consent is not inferred; campaigns remain drafts.
- Card processing, POS sync, delivery networks and outbound messaging require separate provider commissioning.

## Runtime
- Next.js App Router, TypeScript, PostgreSQL.
- Railway project: `misenorth-vancouver`; service root: `/products/misenorth`.
- Build: `npm audit --audit-level=high && npm run build`.
- Health: `/api/health`.
- Public app: `misenorth-web-production.up.railway.app`.

## Commercial implementation and remaining activation gates
- Stripe Billing Checkout, Customer Portal, signed webhook validation, idempotent event storage, subscription entitlements and invoice/line-item reconciliation are implemented in the remediation branch. No MiseNorth Stripe Product/Price, subscription, webhook endpoint or app credentials are configured in the connected Sandbox/Production environment. Checkout remains fail-closed until CAD monthly and one-time Price IDs, test credentials and webhook secret are provided. Live mode additionally requires explicit approval and tax configuration/review.
- Guest food payments, Stripe Connect, restaurant settlements, refunds/disputes for food orders and marketplace commissions are not implemented.
- Square/Clover/Lightspeed POS and DoorDash/Uber Direct are not connected or verified.
- Email verification, password recovery, consent ledger, single-use unsubscribe and suppression state are implemented. Resend sender credentials are absent from MiseNorth Railway; new accounts remain pending until email delivery is configured. Promotional campaigns remain drafts and no marketing sends occur.
- Owner/manager/staff role enforcement, owner-controlled one-time team invitations, member role updates and suspension, invitation revocation, database-backed rate limits, same-origin protections, email verification, password recovery, session revocation, privacy requests, owner JSON export, support intake and audit records are implemented in the remediation branch. Actual invitation and verification emails require configured Resend credentials.
- Privacy Policy, Terms, Data Retention and Incident Response drafts exist under legal/. They are not approved legal documents. Counsel review is still required before publication or live customer onboarding.
- Multi-location operations, complete reservation/table allocation, real paid-visit/loyalty accrual, inventory/food-cost, labour scheduling and hardware KDS remain incomplete.
- Railway and PostgreSQL are hosted in SFO, not Canada. Data residency and processor obligations must be assessed before onboarding live merchants. Production backup/restore has not yet been demonstrated.
- Company OS and Sina OS do not yet have a verified end-to-end MiseNorth integration or governed runtime receipt path.
