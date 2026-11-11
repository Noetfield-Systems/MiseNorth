# MiseNorth Growth OS launch baseline
Date: 2026-11-10

## Current source of truth
This standalone repository contains the prior multi-tenant restaurant application, ported from Noetfield-Systems/sina_founder_os at commit 3b7329f6ca87845d8eac7c42848be0fd981d1a15 (the P0 financial truth and tax remediation branch), and a premium acquisition and conversion layer.

## Revenue path
Free technical grader -> saved report URL -> inbound setup inquiry -> manually qualified restaurant -> workspace -> subscription checkout only when Stripe Billing is configured -> SaaS recurring invoices tracked from signed Stripe webhooks. Paid food orders, collected food revenue and merchant POS data are NOT represented by unpaid guest requests.

## Audit integrity
The grader invokes Google PageSpeed Insights (mobile; performance, SEO, accessibility, best practices). Missing categories remain N/A; returned measured categories get a weight-normalized composite. Audits are point-in-time technical diagnostics, not estimates of SEO rank, revenue, sales, retention or marketing ROI. The upstream service may be rate-limited or fail, in which case no fabricated score is displayed. Free audits do not require an email.

## Founder sales implementation
Inbound inquiries are stored in misenorth_growth_inquiries; a submission is NOT marketing subscription consent. Outreach and follow-up must use only permitted channels. A production operator view or governed Company OS connection still needs operational commissioning; database persistence alone does not deliver email alerts.

## Activation facts
The prior Railway project misenorth-vancouver had a live service and PostgreSQL. This repository is the independent product source; branch-to-service Railway connection and post-deploy validation are separate actions.
Stripe Billing source code exists; live billing requires legitimate Stripe account secrets, two CAD Price IDs (monthly + setup), webhook secret, and account tax settings.
Resend sender and verification emails require sender DNS verification and API key before new workspace owners can verify email. Public Privacy/Terms drafts remain drafts, not legal approvals. A verified backup/recovery test and review of relevant Canadian privacy obligations should precede processing production guest/customer records.
Restaurant POS, food payment capture, refunds for food transactions, delivery networks and automated outbound marketing remain uncommissioned.

## No fictional traction
All ten demo restaurant workspaces are synthetic; they are not clients. Do not use demo orders, inquiry counts or audit reports as collected cash, MRR, customer lifetime spend, contracted locations or externally verified adoption.
