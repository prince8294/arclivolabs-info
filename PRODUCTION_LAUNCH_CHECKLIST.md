# Production launch checklist

## Required before launch

- [ ] Run lint, typecheck, unit tests, and production build on the final commit.
- [ ] Provision isolated production MongoDB, backups, restore test, network access, and indexes.
- [ ] Configure production-only Auth.js secret and canonical URLs; verify cookie/session behavior behind the production proxy.
- [ ] Confirm campaign budgets and operating currency with the agency team. Campaign budgets do not represent collected money.
- [ ] Verify manual finance roles and ensure only authorized admins can create or update creator payment records.
- [ ] Configure verified Resend sender and test delivery, failure, retry, and outbox monitoring; verify email links use the canonical HTTPS origin.
- [ ] Configure a trusted cron scheduler with a strong secret and test duplicate invocation and alerting.
- [ ] Configure Cloudinary credentials and test signed uploads, role/purpose checks, image delivery, size limits, and account access.
- [ ] Review CSP, proxy forwarded headers, rate limits, admin access, audit logs, and incident/credential-rotation procedures.
- [ ] Conduct MongoDB-backed tenant-isolation and end-to-end tests across public, admin, brand, and creator journeys.
- [ ] Review DPDP/privacy notices, data retention/export/deletion processes, and GST/invoice requirements with qualified counsel/advisors.
- [ ] Perform responsive/accessibility review and document any remaining unfinished areas.

## Not currently implemented or verified

- [ ] Online payment collection, refunds, and automatic bank payouts are not part of this app; arrange settlement separately and record relevant creator payouts manually.
- [ ] No GST calculation or compliant tax invoice/PDF generation.
- [ ] SMS/WhatsApp providers and consent workflow are disabled/not implemented.
- [ ] Full scheduled reminder and summary catalogue is not implemented; scheduler currently expires invitations and dispatches email.
- [ ] Private media authorization, malware scanning, and automated file deletion are not implemented.
- [ ] PDF reports, verified social analytics/ROI, error monitoring provider, and live production deployment were not configured or tested.

Do not describe the platform as launch-ready until the required operator configuration, independent reviews, and end-to-end tests are complete.
