# MiseNorth Data Retention Schedule — Draft

**Status:** Proposed operational schedule; requires privacy/legal and infrastructure approval.  
**System:** MiseNorth Production (Railway, SFO region at time of preparation).

| Record class | Proposed retention | Action / control |
|---|---|---|
| Restaurant workspace and menu | Contract term plus 90 days after termination, unless legal hold | Owner export before closure; then delete or anonymize after dependency review |
| User accounts | Account term; security/audit minimum thereafter per counsel | Disable at termination; delete credentials; preserve required audit records |
| Sessions | 14-day expiry; delete expired sessions during auth activity; revoke on password reset/all-device sign-out | Store hash only; never export raw token |
| Authentication/rate-limit attempts | 48 hours for auth attempts; API rate-limit buckets until expiry and periodic cleanup | No passwords stored; subject/email keyed with SHA-256 |
| Email verification tokens | 24 hours | Hash at rest; single-use; revoke older tokens |
| Password reset tokens | 2 hours | Hash at rest; single-use; revoke prior links and all sessions after reset |
| Guest profiles | Restaurant contract term or until lawful erasure request, subject to legal retention | Tenant-scoped export, correction and reviewed erasure |
| Order request records | Restaurant contract term, plus retention period approved for accounting/disputes | Requests are unpaid; do not classify as payment evidence |
| Reservation requests | Restaurant contract term; then reviewed deletion/anonymization | Minimize access and notes retention |
| Consent events | Retain while marketing relationship exists and for a counsel-approved proof period after withdrawal | Append-only grant/withdrawal history; legacy consent without evidence is unverified |
| Unsubscribe tokens | Until consumed/revoked plus short abuse-prevention period | Hash only; revoke all active tokens on withdrawal |
| Loyalty records | Until customer relationship ends or request is reviewed | Current loyalty activity from unpaid guest requests is prohibited |
| Campaign drafts | Restaurant contract term or owner deletion | Drafts are not sent messages |
| Support tickets | Until resolved plus proposed 24 months | Minimize sensitive details; tenant-scoped |
| Privacy requests | Proposed 7 years after completion, subject to counsel | Retain request metadata and outcome, minimize copied personal data |
| Audit events | Proposed 24 months; extend only for security/legal holds | No secrets or raw tokens |
| Billing invoices/subscriptions | Statutory/accounting retention as advised by Canadian accountant/counsel | Keep invoice and payment status evidence; no card data |
| Application/runtime logs | Proposed 30 days; security logs may require longer | Redact credentials and guest payloads |
| Database backups | Proposed daily rolling 30 days, weekly 12 weeks, monthly 12 months | Not yet demonstrated in current Railway environment; restore tests required |

## Operational rules

1. Apply retention by tenant, not by a shared global deletion query.
2. Keep consent withdrawal evidence after the active marketing flag is set false.
3. Do not erase invoice, tax, dispute or security records while legal/accounting retention applies.
4. Treat a deletion request as received/reviewed until dependencies and legal hold checks are complete.
5. Any destructive deletion requires an auditable approval and a recoverable backup.
6. Verify restore before enabling live production migrations or changing data region.
7. Revisit this schedule after the first customer contracts and provider/subprocessor review.

**Important:** This is a proposal, not a proven backup policy. Current Production backup/restore has not yet been demonstrated.
