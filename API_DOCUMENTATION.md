# API documentation

All application APIs return `{ success, message, data }` on success and a structured error response on failure. Protected routes use the Auth.js session and server-side role/ownership checks.

## Manual finance

| Method and route | Access | Behavior |
|---|---|---|
| `GET/POST /api/admin/payments` | `finance:read` / `finance:manage` | Lists and manually records creator payment entries. |
| `PATCH /api/admin/payments/[id]` | `finance:manage` | Updates a pending manual payment entry and records its reference/history. |
| `GET /api/brand/billing` | Brand | Shows campaign budget summaries and agency-entered creator payment records. |
| `GET /api/creator/earnings` | Creator | Shows creator payment entries manually recorded by agency finance staff. |
| `GET /api/admin/finance/summary` | `finance:read` | Returns currency-separated creator payables and campaign budgets. Supports `from`, `to`, `brand`, and `campaign` filters. |

Payment collection and settlement are handled outside the application. Campaign budgets are planning values, not proof of payment. Manual records do not trigger a bank transfer or verify a bank settlement.

## Media uploads

| Method and route | Access | Behavior |
|---|---|---|
| `POST /api/uploads/sign` | Brand or creator, limited by upload purpose | Creates a short-lived Cloudinary upload signature; the browser then uploads directly to Cloudinary. |

The server validates role, purpose, file type, extension, declared size, and upload rate before signing. Configure the Cloudinary cloud name, API key/secret, and signed image/media presets as server-only environment variables. The presets enforce maximum sizes at Cloudinary. Admins can add Cloudinary image URLs to creator, brand, service, and blog records.

## Creator applications

`POST /api/creators/register` accepts a short application with a name, primary platform, social profile, follower/subscriber count, and at least one contact method (email or phone). In `/admin/creators?type=creator-applications`, authorized creator managers can complete the remaining profile details, add private internal notes, and move applications through `pending`, `contacted`, `qualified`, `approved`, or `rejected`. Approval creates or updates the creator profile; admins must first fill the email, phone, category, and location needed by that profile.

## Operations and messaging

- `GET /api/health`: database readiness and configured service status only.
- `GET /api/cron`: trusted scheduler; requires the configured bearer secret. Expires overdue invitations and dispatches queued email.
- `GET /api/admin/email-deliveries`: Super Admin-only delivery log without recipient addresses or template secrets. `POST` with `{ "id": "<deliveryId>" }` retries an unexpired blocked delivery.
- Authenticated notification routes under `/api/notifications` remain user-scoped.
- Email verification, password reset, and campaign invitation events enqueue email; actual delivery requires Resend configuration and a scheduled dispatcher.

See [README.md](./README.md) for existing public, admin, brand, and creator API groups.
