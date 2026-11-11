# MiseNorth Privacy Policy — Draft for Legal Review

**Status:** Working draft. Not approved for publication.  
**Last prepared:** 8 November 2026  
**Operator:** Noetfield Systems Inc., Vancouver, British Columbia, Canada  
**Privacy contact:** operations@noetfield.com

This draft is an operational disclosure baseline, not legal advice or a representation that MiseNorth is compliant with every applicable privacy law. Have qualified Canadian privacy counsel review and approve it before publishing or onboarding live guest data.

## 1. Who operates MiseNorth

MiseNorth is a restaurant digital-operations platform operated by Noetfield Systems Inc. ("MiseNorth", "we", "us"). Restaurants that use the platform ("Restaurant Customers") control their own guest relationships and decide what guest information they collect and how they use it. Depending on the activity, a Restaurant Customer may be responsible for its own collection/use of guest data while MiseNorth processes that information to provide the service. The exact legal roles and contractual allocation require counsel review.

## 2. Information processed

Depending on product features enabled, the platform may process:

- Restaurant workspace and business information, including restaurant name, address, telephone, email, website, timezone, tax-rate settings and branding.
- Account information, including owner/employee name, work email, role, password hash, email-verification status, session records and audit events.
- Guest information provided in a restaurant request, including name, email, telephone, order contents, order notes, reservation party size and requested time.
- Guest preference records, including marketing-consent events, the source/evidence for consent, withdrawal events and unsubscribe-token state.
- Restaurant operational records, including menu items, table/QR labels, unpaid order requests, reservation requests, support tickets, privacy requests and campaign drafts.
- Billing information for MiseNorth subscriptions when Stripe Billing is enabled, including Stripe customer/subscription identifiers, invoice identifiers, invoice amounts/statuses and subscription entitlements. MiseNorth does not store payment-card numbers or CVCs.
- Technical information such as timestamps, request metadata, rate-limit records, error logs and audit events.

The current guest flow is an **unpaid order-request** workflow. It does not collect guest card payments. Order request values are not proof of food sales, payment, visits or lifetime guest spend.

## 3. Purposes

Information is used to:
- Create and secure restaurant workspaces and authenticate authorized users.
- Publish restaurant pages, menus and QR links.
- Receive, display and manage order and reservation requests.
- Maintain tenant-scoped guest and consent records.
- Provide support, security monitoring, auditability, privacy requests and data exports.
- Operate MiseNorth subscription billing when enabled.
- Diagnose faults and improve reliability.

We do not use synthetic demo records as real customers, transactions, traffic or revenue.

## 4. Guest marketing and consent

A guest is not automatically opted in to promotional email or SMS. The current order-request flow records explicit email marketing consent only when the guest selects the separate optional checkbox and supplies an email address. Consent provenance and withdrawal events are stored separately from operational order requests.

A guest may withdraw email marketing consent using a single-use unsubscribe link issued by the restaurant flow. Withdrawal updates the restaurant-scoped consent record and revokes outstanding unsubscribe tokens. Operational messages concerning an order or reservation are distinct from promotional marketing.

**Outbound email and SMS delivery are disabled until the restaurant/provider sender, domain, unsubscribe handling, suppression controls and delivery monitoring are commissioned.** A campaign draft is not a sent campaign. Public business contact information is not permission for MiseNorth or a restaurant to send unsolicited commercial messages.

## 5. Service providers and disclosures

MiseNorth currently runs on Railway with a PostgreSQL database. The inspected Production project and database are in the **SFO region (United States), not Canada**. This is a material data-residency disclosure and must be reviewed before live customer onboarding.

Potential or planned providers include:
- Railway — application hosting and PostgreSQL infrastructure.
- Stripe — MiseNorth SaaS subscription billing, if enabled. Guest food payments and Stripe Connect are not currently commissioned.
- Resend — transactional email, if configured for verification and password recovery.
- Other POS, messaging or analytics providers only after a restaurant-authorized integration is actually connected and verified.

A provider appearing in an integration catalogue does not mean that provider is connected. Restaurant credentials are not used without explicit authorization.

## 6. Storage, safeguards and access

We use tenant-scoped database queries, server-side role authorization, secure password hashing, hashed session tokens, HttpOnly cookies, session expiry, rate limits, same-origin checks on state-changing browser requests, audit records and signed webhooks for Stripe events.

No security safeguard guarantees absolute security. We maintain an incident response process and will investigate suspected unauthorized access.

Raw session tokens, password hashes, API secrets and payment-card details are not included in owner data exports. Access to guest records is restricted by restaurant tenant and role.

## 7. Retention and deletion

Restaurant records are retained to provide the service, meet contractual/business needs, maintain security and satisfy applicable legal obligations. Specific retention periods must be approved in the Data Retention Schedule and customer agreement.

Restaurant owners can request an export of restaurant operational data. Erasure, correction and access requests can be registered in the product; destructive erasure is not automatic. Requests are reviewed for identity, scope, legal retention and third-party dependencies before action.

Backups, provider logs and statutory records may persist for defined periods after operational deletion. Exact periods and procedures require legal and infrastructure approval.

## 8. Cross-border processing

Because Production is currently hosted in SFO, information may be stored or processed outside Canada. Do not assume Canadian data residency. No region migration should occur without a documented backup, restore test, migration plan, rollback and approval.

## 9. Privacy requests and contact

Restaurant owners can submit access, export, correction or erasure requests through the owner Privacy & Data area. Guests should first contact the restaurant that collected their information; where MiseNorth is involved as processor/service provider, the restaurant may coordinate with us.

Privacy contact: operations@noetfield.com.

## 10. Changes and approval

This draft must be updated with:
- counsel-approved identification of controller/processor/service-provider roles;
- final retention periods and deletion/backup schedules;
- current subprocessors and their locations;
- breach-notification thresholds, timelines and procedures;
- contact and complaint/escalation procedures;
- finalized terms, order-data handling and customer contract provisions.

**Do not publish this draft as final until legal review is complete.**
