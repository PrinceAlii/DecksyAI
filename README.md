# Decksy AI

Decksy AI is a Next.js 14 application that helps Clash Royale players discover decks tailored to their card collection, trophies, and preferred playstyle. Recommendations are enriched with Gemini explainers, battle coaching, and now a production-ready account system.

## Features

- **Deterministic deck scoring** that blends collection readiness, arena context, and playstyle fit.
- **Gemini-powered explainers** with JSON schema parsing, caching, and resilient fallbacks when the API is unavailable.
- **Account & authentication** using Auth.js (magic links + GitHub OAuth), Prisma persistence, audit logging, and self-serve session revocation.
- **Responsive dark UI** powered by Tailwind CSS, Radix primitives, and bespoke Clash Royale card artwork placeholders.

## Player Tag Format

Decksy AI uses the Clash Royale API to fetch player data. Player tags must:

- Use only these characters: `0`, `2`, `8`, `9`, `P`, `Y`, `L`, `Q`, `G`, `R`, `J`, `C`, `U`, `V`
- Be 7-14 characters long
- The app automatically normalizes tags (strips `#`, uppercases, removes separators, corrects common mistakes like `O` → `0`)

Examples of valid input:
- `#2L2098J` (7 characters)
- `py lqgrjc` (normalized to `PYLQGRJC`)
- `o28yqgrj` (normalized to `028YQGRJ`, `O` corrected to `0`)

## Getting Started

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

Run quality checks before committing:

```bash
npm run lint
npm run test
```

## Environment variables

Create a `.env.local` file and populate the values below as needed:

| Variable | Purpose |
| --- | --- |
| `CLASH_ROYALE_API_KEY` | Required for live player, card, and battle data. |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Enables Gemini explainers; falls back to deterministic copy when omitted. |
| `DATABASE_URL` / `DIRECT_URL` | PostgreSQL connection strings for Prisma + Auth.js. |
| `NEXTAUTH_SECRET` | Secret used to sign Auth.js tokens. Generate with `openssl rand -base64 32`. |
| `ACCOUNT_EXPORT_ENCRYPTION_KEY` | Base64-encoded 32-byte key for encrypting account export bundles. Required in production. |
| `ACCOUNT_EXPORT_KEY_ID` | Optional identifier for the active export key to simplify rotations. |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Enable GitHub OAuth sign-in. |
| `RESEND_API_KEY` & `EMAIL_FROM` | Send production magic links via Resend. In development the magic link is logged when unset. |
| `REDIS_URL` | Optional Redis cache for Clash Royale and Gemini responses. |
| `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN` | Analytics and monitoring (planned). |

## Authentication configuration

1. Apply Prisma migrations to provision the Auth.js tables:
   ```bash
   # Create migrations locally (run once, commit the migrations)
   npx prisma migrate dev --name init

   # Apply migrations in production (Heroku will run this automatically if you
   # include a Procfile with a release phase). You can also run it manually:
   npx prisma migrate deploy
   ```

Note: this repository includes a `Procfile` that runs `npx prisma migrate deploy` during Heroku releases. Ensure you have created and committed migration files locally (via `npx prisma migrate dev`) before deploying so the release step can apply them.
2. Configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and either Resend (`RESEND_API_KEY` + `EMAIL_FROM`) or a trusted SMTP provider.

Note for Heroku deployments: set the `NEXTAUTH_SECRET` config var in the Heroku dashboard (Settings → Config Vars). You can generate a suitable value locally with:

```bash
openssl rand -base64 32
```

Heroku will not populate this automatically; omitting it causes Auth.js to throw a runtime error in production.
3. (Optional) Add GitHub OAuth credentials to enable one-click sign-in.
4. Start the app. The login page now issues 10-minute magic links, persists sessions, and exposes session revocation controls under `/account`.

### Troubleshooting: Prisma P2022 (missing columns)

If you see runtime errors like `PrismaClientKnownRequestError` with code `P2022` mentioning a missing column (for example `The column 'User.name' does not exist`), it means your database schema is out of sync with `prisma/schema.prisma`.

Common fixes:

- Make sure you have created and committed migration files locally using:

```bash
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "prisma: add migrations"
```

- Deploy your app. The included `Procfile` will run `npx prisma migrate deploy` during Heroku release to apply committed migrations. Alternatively, run the deploy command manually on your production database:

```bash
npx prisma migrate deploy --preview-feature
```

- If you cannot apply migrations to the live database, you can inspect the current schema using `npx prisma db pull` (be careful: `db push` and `--accept-data-loss` can be destructive).

If you're unsure, share the exact `P2022` message and I can suggest the safest remediation steps.

## Redis TLS (Heroku / managed providers)

If you're using a managed Redis provider that exposes a TLS endpoint (for example `rediss://` on Heroku), you may encounter the error:

```
[ioredis] Unhandled error event: Error: self-signed certificate in certificate chain
```

Set one of the environment variables below when connecting to a `rediss://` URL to disable strict certificate verification **during local development only**:

- `REDIS_TLS_ALLOW_SELF_SIGNED=true` (existing name)
- `REDIS_ALLOW_INSECURE_TLS=true` (alias)

Security note: disabling certificate verification weakens TLS and should only be used if you understand the risk. Prefer configuring a trusted CA (for example using `NODE_EXTRA_CA_CERTS`) or using a Redis provider that presents a certificate trusted by Node. The Decksy server now refuses to start with these flags enabled outside development and logs whenever the insecure fallback is active so you can monitor usage during testing.
