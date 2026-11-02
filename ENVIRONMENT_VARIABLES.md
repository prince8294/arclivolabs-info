# Environment variables

Set deployment values in the hosting provider's secret manager. Do not commit `.env.local` or paste secret values into support logs.

| Variable | Required | Purpose |
|---|---:|---|
| `MONGODB_URI` | Yes | MongoDB connection string. Use a separate database/user per environment. |
| `AUTH_SECRET` | Yes | Auth.js signing/encryption secret; generate a strong random value. |
| `NEXTAUTH_URL` | Yes | Canonical application origin used by Auth.js. |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical public origin used when building email and sitemap URLs. |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | For uploads | Cloudinary API key; safe to return only as part of a short-lived, signed upload request. |
| `CLOUDINARY_API_SECRET` | For uploads | Server-only Cloudinary API secret. Never expose as `NEXT_PUBLIC_*`. |
| `CLOUDINARY_IMAGE_UPLOAD_PRESET` | For uploads | Signed preset restricted to approved image formats and a 10 MB maximum. |
| `CLOUDINARY_MEDIA_UPLOAD_PRESET` | For uploads | Signed preset restricted to approved image/video formats and a 100 MB maximum. |
| `RESEND_API_KEY` | Email | Server-only Resend API key. |
| `EMAIL_FROM` | Email | Verified sender identity, e.g. `Arclivo <notifications@example.com>`. |
| `CRON_SECRET` | Scheduler | Random bearer token for `GET /api/cron`. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Development only | Explicit credentials for the guarded seed script. |

`NEXT_PUBLIC_*` values are public. Keep database, authentication, email, Cloudinary, and cron secrets server-only.

Campaign budgets use each campaign's ISO currency. Campaign collection and creator payout settlement are managed manually outside this application; finance staff can record creator payment references in the admin workspace.
