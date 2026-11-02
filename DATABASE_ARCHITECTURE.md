# Database architecture

MongoDB with Mongoose is the persistence layer. Configure separate databases and least-privilege users for development, staging, and production. API handlers connect through `connectToDatabase()` and use strict Mongoose schemas.

## Financial records

- `Campaign.budget` and `Campaign.currency` describe approved campaign budgets only.
- `PaymentTransaction` stores creator-side payment entries entered and updated manually by authorized finance staff. A recorded reference is not independently verified by a bank connection.
- `FinancialTransaction` stores manual agency revenue/expense records. Do not derive agency revenue from the full campaign budget.
- Campaign collection and creator payout settlement happen outside the application. The app does not create online payment orders, process refunds, or execute bank transfers.

## Delivery/operations records

- `EmailOutbox` stores the recipient, template data, deduplication key, retry state, provider message ID, and an expiry time. It expires after seven days.
- `ScheduledJobRun` records the daily invitation-expiry job and its result.
- `Notification` records in-app updates; optional `dedupeKey` values prevent duplicate notifications where used.
- `RateLimit` stores database-backed rate counters.

## Indexes and deployment

Schemas declare unique indexes for email dedupe keys, scheduled job periods, and applicable portal ownership queries. Create/verify indexes in staging before production. Existing collections are not automatically backfilled by schema defaults; Mongoose defaults are applied to hydrated records, and aggregation pipelines explicitly use `$ifNull` for legacy campaign currency.

For rollout: take a backup, deploy code with additive schema fields, allow index builds to complete, verify health, and test with staging data. No destructive migration is required. Do not run demo seed scripts against production. Configure automated Atlas backups and test restore procedures outside production.

Financial amounts in `PaymentTransaction` and `FinancialTransaction` remain major currency units for backward compatibility.
