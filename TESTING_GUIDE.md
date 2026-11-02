# Testing guide

## Local checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The unit suite covers validation and application logic. `npm test` does not call live Cloudinary, Resend, or MongoDB services.

## Provider and database testing

Use an isolated MongoDB database. Verify admin finance permissions for manual creator payment records, require references before recording a payment as paid, and check that campaign budgets are not treated as actual revenue.

Test email with a verified test sender and inspect the outbox for queued/sent/failed/retried states. Test a provider timeout without exposing tokens in logs. Verify cron bearer authentication, duplicate invocation, and invitation expiry. In a non-production Cloudinary account, test the signed upload flow, purpose restrictions, allowed MIME types/extensions, image/video size limits, and upload failures.

## Remaining coverage

No MongoDB-backed integration or end-to-end test environment was available here. Do not consider route unit primitives a substitute for end-to-end finance, tenant isolation, email retry, deployment, mobile UI, or accessibility testing.
