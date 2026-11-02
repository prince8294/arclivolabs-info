# Authentication and roles

Auth.js Credentials uses HTTP-only, same-site session cookies. Passwords are bcrypt-hashed. Public registration permits brand and creator roles only. Verification and password-reset tokens are single-use and expire; changing a password invalidates existing sessions.

## Role boundaries

- `super_admin`: all application permissions, including finance and settings.
- `admin`: business operations, excluding finance management and settings.
- `manager`, `campaign_manager`, `creator_manager`, and `sales_executive`: bounded operational permissions defined in `src/lib/admin/permissions.ts`.
- `finance_manager`: finance read/manage permissions and campaign read access.
- `brand` and `creator`: owner-scoped portal actions.

API handlers enforce authorization; a dashboard page returning an HTML shell is not the security boundary. Brand and creator endpoints scope queries to their authenticated profile. Webhooks use provider HMAC verification; scheduled jobs use a constant-time bearer secret comparison.

Admin settings show provider configuration state only. Raw environment secrets are never returned by settings APIs. Protect deployment access and rotate secrets after suspected exposure.

## Privacy and legal review

Do not treat this implementation as a DPDP Act compliance determination. Before launch, obtain qualified Indian privacy counsel review, publish appropriate privacy/retention notices, define data-subject request handling, and confirm any required consent and processor agreements.
