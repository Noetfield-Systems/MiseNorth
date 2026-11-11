# MiseNorth — Restaurant Growth & Guest Operations

**A Vancouver-built restaurant growth platform.** Free real website audits, branded menus, QR links, pickup/dine-in order requests, reservations, owner/staff workflows, guest CRM and SaaS billing scaffolding.

- Product: https://misenorth-growth-production.up.railway.app/
- Free grader: https://misenorth-growth-production.up.railway.app/grader
- Ten synthetic demos: https://misenorth-growth-production.up.railway.app/demo
- Partners: /partners · Investor overview: /investors

## Source
This is the independent product repository. It contains 71 source files ported from the Noetfield Systems `sina_founder_os` monorepo (P0 commercial truth branch, commit `3b7329f6ca87845d8eac7c42848be0fd981d1a15`), plus the growth experience. The old service is retained separately on Railway.

## Technology
Next.js 16, TypeScript, PostgreSQL, Stripe Billing scaffolding, Google PageSpeed Insights. Deployment is through Railway with a PostgreSQL reference.

## Run
```sh
npm install
npm test
npm run typecheck
npm run build
npm run dev
```
For a database-backed local runtime, configure `DATABASE_URL` (see `.env.example`). New tenants cannot complete email verification without the verified sender credentials. `/api/health` checks the database.

## Product truth
- Free grader uses actual Google PageSpeed/Lighthouse metrics. Missing measurements remain unknown. Reports are stored and shareable; website audit does not require email.
- Ten demo restaurants are *synthetic*, not paying customers or growth results.
- Guest orders are *unpaid requests*, not processed food payments; requested value is not collected revenue.
- Restaurant subscription Stripe integration exists as source code but is **not live** until a real Stripe Product, recurring CAD Price, setup Price, webhook signing secret, API key and the commercial/tax settings are commissioned.
- Outbound messaging, POS sync, restaurant payment collection and delivery partner integration are not yet connected.
- Inbound restaurant, partner and investor inquiries persist to PostgreSQL; no marketing consent is inferred.
- The published founding price is a proposal until checkout is live.

For deploy facts, configuration and remaining constraints see [docs/GROWTH-LAUNCH-2026-11-10.md](docs/GROWTH-LAUNCH-2026-11-10.md).
