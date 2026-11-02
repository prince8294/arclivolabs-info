# Email and notification setup

## Resend email

Set `RESEND_API_KEY` and a verified `EMAIL_FROM` sender. Account registration queues verification email, password recovery queues a single-use reset link, brand campaign invitations queue creator messages for linked accounts, and confirmed campaign collections queue payment confirmation. `GET /api/cron` dispatches messages from the MongoDB `EmailOutbox`, with dedupe keys, bounded retries, timeouts, status codes, and seven-day expiry.

Queueing is not delivery. Without provider credentials, email remains pending; API and configuration status do not claim delivery. Provider failures are recorded without logging recipient content or action tokens. Resend/SMTP adapters beyond the current Resend integration, provider delivery webhooks, and the full requested lifecycle-template catalogue are not implemented.

Run a trusted external scheduler every few minutes against `/api/cron`, passing `Authorization: Bearer <CRON_SECRET>`. Monitor `EmailOutbox` statuses and Resend delivery events. Protect database access because pending verification links are sensitive.
Super Admins can inspect redacted delivery status at `/api/admin/email-deliveries` and retry unexpired blocked records. The API does not expose recipients or verification tokens.

## In-app, SMS, and WhatsApp

Existing in-app notifications are authenticated and recipient-scoped. The application does not send SMS or WhatsApp messages. Those channels remain disabled; do not enable them without an authorized provider, user preferences, documented consent, rate limiting, and delivery-status handling. Do not use this system for unsolicited bulk messaging.
