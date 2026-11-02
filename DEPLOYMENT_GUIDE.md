# Deployment guide

## Environments

Maintain distinct development, staging, and production projects, MongoDB databases, Cloudinary accounts or upload folders, email sender settings, and cron secrets. Do not copy production data into development without an approved redaction process.

## Production setup

1. Provision MongoDB Atlas with TLS, network restrictions, least-privilege app credentials, backups, and tested restore.
2. Configure hosting secrets from [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).
3. Deploy staging and run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and API authorization checks.
4. Verify indexes and health. Deploy additive schema changes first; no destructive migration is included.
5. Configure a trusted scheduler to call `GET /api/cron` every few minutes with the bearer secret. Do not depend on a browser being open.
6. Verify Cloudinary upload signatures, role restrictions, image delivery, and the 10 MB image limit in staging.
7. Enable Resend only after sender-domain verification. Review public/private media access before uploading any file.
8. Promote staging configuration to production using production-only credentials and perform the launch checklist.

## Monitoring and rollback

Poll `/api/health` for database and configured-service state. Monitor hosting logs, MongoDB availability, Cloudinary upload failures, Resend delivery/error rates, `ScheduledJobRun`, and failed email outbox records.

For rollback, redeploy the last known-good application build. Additive fields/indexes are backward-compatible; do not drop new collections during rollback. Stop scheduled jobs if repeated processing errors occur.

Campaign collection and settlement are handled outside this application; finance staff record creator payment references manually in the agency workspace.
