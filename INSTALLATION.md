# Installation

## Requirements

- Node.js 20.9 or newer and npm.
- MongoDB Atlas or a local MongoDB version supported by the installed Mongoose release.
- Cloudinary credentials if image/media uploads are needed.

## Local setup

1. Install packages: `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Configure `MONGODB_URI`, `AUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL`.
4. Configure the Cloudinary credentials and two signed upload presets to enable uploads; other optional services can stay unset.
5. Start MongoDB, then run `npm run dev`.
6. Open `http://localhost:3000`.

The agency manages campaign workflows and creator payment records manually. The app does not offer online payment checkout or bank settlement.

## Development administrator

Set `SEED_ADMIN_EMAIL` and a unique strong `SEED_ADMIN_PASSWORD` in `.env.local`, then run `npm run seed`. The script is development-only and refuses to seed when `NODE_ENV=production`. Never place seed credentials into production deployment settings.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) and [STORAGE_SETUP.md](./STORAGE_SETUP.md) for configuration details.
