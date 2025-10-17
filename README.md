# Decksy AI

Decksy AI is a Next.js 14 application that helps Clash Royale players discover decks tailored to their card collection, trophies, and preferred playstyle. Recommendations are enriched with Gemini explainers, battle coaching, and now a production-ready account system.

## Features

- **Deterministic deck scoring** that blends collection readiness, arena context, and playstyle fit.
- **Gemini-powered explainers** with JSON schema parsing, caching, and resilient fallbacks when the API is unavailable.
- **Account & authentication** using Auth.js (magic links + GitHub OAuth), Prisma persistence, audit logging, and self-serve session revocation.
- **Responsive dark UI** powered by Tailwind CSS, Radix primitives, and bespoke Clash Royale card artwork placeholders.

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
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Enable GitHub OAuth sign-in. |
| `RESEND_API_KEY` & `EMAIL_FROM` | Send production magic links via Resend. In development the magic link is logged when unset. |
| `REDIS_URL` | Optional Redis cache for Clash Royale and Gemini responses. |
| `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN` | Analytics and monitoring (planned). |

## Authentication configuration

1. Apply Prisma migrations to provision the Auth.js tables:
   ```bash
   npx prisma migrate deploy
   ```
2. Configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and either Resend (`RESEND_API_KEY` + `EMAIL_FROM`) or a trusted SMTP provider.

Note for Heroku deployments: set the `NEXTAUTH_SECRET` config var in the Heroku dashboard (Settings → Config Vars). You can generate a suitable value locally with:

```bash
openssl rand -base64 32
```

Heroku will not populate this automatically; omitting it causes Auth.js to throw a runtime error in production.
3. (Optional) Add GitHub OAuth credentials to enable one-click sign-in.
4. Start the app. The login page now issues 10-minute magic links, persists sessions, and exposes session revocation controls under `/account`.

## Redis TLS (Heroku / managed providers)

If you're using a managed Redis provider that exposes a TLS endpoint (for example `rediss://` on Heroku), you may encounter the error:

```
[ioredis] Unhandled error event: Error: self-signed certificate in certificate chain
```

Set one of the environment variables below when connecting to a `rediss://` URL to disable strict certificate verification:

- `REDIS_TLS_ALLOW_SELF_SIGNED=true` (existing name)
- `REDIS_ALLOW_INSECURE_TLS=true` (alias)

Security note: disabling certificate verification weakens TLS and should only be used if you understand the risk. Prefer configuring a trusted CA (for example using `NODE_EXTRA_CA_CERTS`) or using a Redis provider that presents a certificate trusted by Node.
