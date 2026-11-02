# Arclivo — Influencer Marketing

A responsive Next.js App Router application for an influencer marketing agency, with a MongoDB/Mongoose backend, validated public forms, Auth.js credentials authentication, and a role-protected agency management dashboard.

## Requirements

- Node.js 20.9 or later
- npm
- MongoDB (local or Atlas)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   - `MONGODB_URI`: local MongoDB or Atlas connection string.
   - `AUTH_SECRET`: a unique random secret (for example, generate one with `openssl rand -base64 32`).
   - `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`: the canonical application URL.

   Never commit `.env.local` or production credentials.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Run checks:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

## Authentication and roles

Authentication uses the stable NextAuth 4 credentials provider with encrypted JWT sessions in HTTP-only, same-site cookies. Passwords are bcrypt-hashed. Public registration permits only `brand` and `creator` roles; elevated roles cannot be assigned by public requests. Protected operations verify both the session and the current active database account. Password changes invalidate existing sessions.

Roles:

- `super_admin`: full access, including settings and financial records.
- `admin`: business operations, excluding settings and financial record management.
- `manager`: creators, campaigns, enquiries, contact inbox, content, analytics, notifications, and activity.
- `campaign_manager`: campaigns and read-only creator/brand information.
- `creator_manager`: creator profiles and applications, plus campaign visibility.
- `sales_executive`: assigned enquiries, contact messages, and read-only brand information.
- `finance_manager`: financial records, campaign visibility, and finance-authorized analytics.
- `brand`: brand-owned resources and campaign requests.
- `creator`: permitted creator profile operations.

Team permission overrides can only remove permissions granted to a role. Public registration cannot create internal roles; only authorized server-side team operations can issue invitations or change roles.

Email verification and password reset use expiring, single-use tokens. Resend delivery is optional and is only attempted by the protected scheduled dispatcher when both `RESEND_API_KEY` and `EMAIL_FROM` are configured. The outbox records pending, sent, failed, and blocked states; no email is reported as delivered merely because it was queued.

## Optional development seed

Set `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` in `.env.local`, then run:

```bash
npm run seed
```

The script refuses to run in production, creates demo services, blog posts, and creator profiles, and creates a super-admin only from the explicitly provided seed credentials. It does not contain a default administrator password.

## Admin dashboard

The protected workspace is available at `/admin/dashboard`. It includes creator applications and profiles, brand CRM, campaigns, enquiries, contact messages, team access, services and blog CMS, analytics, reports, notifications, activity logs, financial records (permission-gated), agency settings, and profile management.

The admin API uses resource routes protected by server-side role checks:

- `GET/POST /api/admin/[resource]`
- `GET/PATCH/DELETE /api/admin/[resource]/[id]`
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/dashboard/analytics`
- `GET /api/admin/reports` (CSV with `format=csv`)
- `GET/POST /api/admin/notes`
- `POST /api/admin/team/invite`
- `DELETE /api/admin/team/invitations/[id]`
- `PATCH /api/admin/notifications/read-all`
- `GET /api/admin/enquiries/export`
- `POST /api/auth/team-invitation/accept`

Resources include `creators`, `creator-applications`, `brands`, `campaigns`, `enquiries`, `contact-messages`, `team`, `services`, `blogs`, `notifications`, `activity-logs`, `settings`, and `transactions`. Campaign status transitions, enquiry ownership, team role limits, financial access, and notification ownership are checked on the server. Campaign budgets are not treated as revenue; dashboard revenue uses recorded financial transactions only.

Services and published insights are read from the database on the public site. If MongoDB is unavailable, the pages show clearly labeled sample content. Blog content is displayed as plain text paragraphs rather than rendered as untrusted HTML.

## Public API overview

All JSON responses use `{ success, message, data }` on success and `{ success, message, errors }` on failure.

| Area | Routes |
| --- | --- |
| Authentication | `POST /api/auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `/verify-email`; `GET /api/auth/session` |
| User profile | `GET/PATCH /api/users/me`; `PATCH /api/users/me/change-password` |
| Creators | `GET /api/creators`, `/api/creators/[id]`; `POST /api/creators/register`; `PATCH /api/creators/[id]` |
| Brands | `GET /api/brands/[id]`; `POST /api/brands/register` |
| Campaigns | `GET/POST /api/campaigns`; `GET /api/campaigns/[id]` |
| Enquiries | `POST /api/enquiries`; `GET /api/enquiries/[id]` |
| Contact | `POST /api/contact` |
| Services | `GET /api/services`, `/api/services/[slug]` |
| Blogs | `GET /api/blogs`, `/api/blogs/[slug]` |

Creator listings expose approved profiles only. Private records and management actions require authentication and the appropriate role. Public forms use server-side validation, origin checks, duplicate detection, and database-backed rate limits.

## Brand and creator portals

The self-service portals are available at `/brand` and `/creator`. Their dashboards, profile, marketplace, shortlist, campaign wizard/detail, collaboration, messaging, notifications, billing, and creator social-account/portfolio/package/deliverable/earnings views require an authenticated account with the matching role. Route layouts are not the only control: each API operation verifies the current role and scopes records to the signed-in user's brand or creator.

Portal API groups:

- Brand: `/api/brand/dashboard`, `/profile`, `/creators`, `/creators/[id]`, `/shortlists`, `/shortlists/[id]`, `/campaigns`, `/campaigns/[id]`, `/invitations`, `/collaborations`, `/billing`, and `/deliverables/[id]`.
- Creator: `/api/creator/dashboard`, `/profile`, `/profile/verify-metrics`, `/social-accounts`, `/social-accounts/[id]`, `/portfolio`, `/portfolio/[id]`, `/packages`, `/packages/[id]`, `/invitations`, `/invitations/[id]/accept`, `/invitations/[id]/reject`, `/collaborations`, `/campaigns/[id]`, `/deliverables`, and `/earnings`.
- Shared: `/api/conversations`, `/api/conversations/[id]/messages`, `/api/notifications`, `/api/notifications/[id]`, and `POST /api/uploads/sign`.
- Admin creator payable records continue to use the permission-protected `/api/admin/payments` routes and appear separately in the finance workspace.
- Finance users manage creator payment entries manually and can inspect currency-separated records at `/api/admin/finance/summary`.
- `GET /api/health` reports database readiness and configured/unconfigured provider states without exposing secrets. `GET /api/cron` is intended for a trusted scheduler and requires `Authorization: Bearer $CRON_SECRET`.

Creator discovery returns approved, available profiles and public fields only. Brand shortlists and campaigns are tenant-scoped; brand-created campaigns enter pending review and cannot set admin approval fields. Invitation acceptance validates state and creates collaboration/deliverables. Deliverable decisions are explicit reviewer actions. Creators can request metric verification; only authorized admins can approve or decline it, and creator-submitted metrics remain unverified until that review. Campaign budgets are not agency revenue.

Direct uploads use short-lived signed Cloudinary requests. Configure the Cloudinary cloud name/key/secret and separate signed image/media upload presets in `.env.local`. The API restricts purpose by role, media MIME type and extension, file size, and upload rate. Images are limited to 10 MB; MP4/WebM videos are limited to 100 MB. Admins can manage creator, brand, service, and blog image URLs from the agency workspace.

## Phase 5 integrations and documentation

See the implementation and launch notes:

- [INSTALLATION.md](./INSTALLATION.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [AUTHENTICATION_AND_ROLES.md](./AUTHENTICATION_AND_ROLES.md)
- [EMAIL_AND_NOTIFICATION_SETUP.md](./EMAIL_AND_NOTIFICATION_SETUP.md)
- [STORAGE_SETUP.md](./STORAGE_SETUP.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [PRODUCTION_LAUNCH_CHECKLIST.md](./PRODUCTION_LAUNCH_CHECKLIST.md)

## Data models

Mongoose models include platform accounts, campaigns, collaborations, user notifications, manually entered financial records, and portal resources. Operational models include `EmailOutbox` (delivery and retry state), `ScheduledJobRun` (scheduler execution log), campaign currency, and payout history on existing creator payment records. See [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).

## Current limitations and integration status

- External connections were not verified in this workspace. Cloudinary, Resend, MongoDB Atlas, and a production scheduler require operator credentials and deployment configuration.
- Campaign collections and creator payout settlement are handled manually outside the app. No online payment provider, refund workflow, or bank payout integration is configured.
- Creator payable records remain finance-entered records; there is no bank payout provider or independent bank settlement verification.
- Resend handles verification, password reset, and creator invitations through a MongoDB outbox. SMTP, delivery webhooks, the full requested notification-template catalogue, SMS/WhatsApp consent and providers are not implemented.
- Scheduler currently expires campaign invitations and dispatches eligible queued email. Other requested reminder/summary jobs are not implemented.
- Financial summaries use manually recorded database data. PDF export, advanced ROI, official social metrics and a complete multi-dimensional analytics suite are not implemented.
- Direct uploads use signed Cloudinary requests. Private-file authorization, malware scanning, and automated file deletion are not implemented. Do not upload confidential documents as public media.
- Social-account metrics are creator-submitted until reviewed by an administrator; no official Instagram/YouTube analytics integration is configured.
- The project has no configured MongoDB integration/E2E test database. Unit tests do not establish tenant isolation under live infrastructure.
- No legal or tax compliance determination is made here. Obtain qualified Indian privacy and GST advice; this documentation is not legal advice.
- Production rate limiting uses MongoDB; ensure the trusted reverse proxy overwrites forwarded-IP headers. The development seed command refuses production.

## Validation

The project checks are `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Automated unit coverage does not replace MongoDB-backed tenant-isolation and workflow integration tests; those require a configured test database.
