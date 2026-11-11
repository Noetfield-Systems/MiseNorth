# MiseNorth Security Incident Response — Draft Runbook

**Status:** Operational draft; requires security/legal approval and contact assignment.

## Severity model

- **SEV-1 Critical:** confirmed cross-tenant exposure, credential/secret compromise, unauthorized production access, suspected exfiltration or materially incorrect financial entitlements.
- **SEV-2 High:** broad service outage, tenant isolation failure contained before confirmed exposure, verified abuse of account recovery, webhook forgery attempt with processing risk.
- **SEV-3 Medium:** isolated tenant workflow failure, suspected spam/credential stuffing, support-system or provider integration issue with no confirmed data compromise.
- **SEV-4 Low:** cosmetic issue, low-risk defect or informational alert.

## First response

1. Record UTC timestamp, reporter, affected service, tenant scope and observed evidence.
2. Preserve relevant application, proxy, database and provider evidence without copying more guest PII than necessary.
3. Assign incident ID and severity; notify Security and Support owners.
4. For credential/session risk: revoke affected sessions, rotate affected credentials using approved secret-management workflow, and disable compromised accounts.
5. For tenant isolation or suspected exfiltration: disable the affected route or access path; do not silently continue processing.
6. For Stripe billing/webhook issues: disable billing via environment guard if integrity is uncertain; reconcile against Stripe invoice/subscription source records before restoring entitlements.
7. For email abuse: disable provider sends and enforce tenant suppression while investigating.
8. Preserve database state. Do not run destructive cleanup before incident evidence and recovery are secured.

## Containment and recovery

- Confirm scope using tenant ID, event ID, request ID and bounded time range.
- Run negative access tests after patching.
- Validate database constraints and audit records.
- Restore only from a verified backup; prove data integrity in an isolated target first.
- Release via a pinned SHA and smoke tests.
- Record an independent verification outcome and closure owner.

## Communications and legal review

Security and Privacy must assess whether the incident triggers contractual, regulatory, individual or provider notification duties. Do not invent legal notification deadlines. Consult qualified counsel and applicable authorities; preserve the record of the decision and rationale.

## Post-incident

- Root cause and exploitability.
- Tenant and data categories affected.
- Timeline and containment evidence.
- Fix commit and regression test.
- Independent QA result.
- Provider actions and notification decision.
- Preventive controls and owner.

## Open operational dependencies

- Name an on-call security lead and backup.
- Approve notification contacts and escalation tree.
- Finalize SLA and service communications.
- Demonstrate backup/restore and recovery targets.
- Connect monitored alerting to an owned incident queue.

