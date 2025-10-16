# Decksy AI

A Next.js application that helps Clash Royale players discover and learn decks tailored to their collection, trophies, and preferred playstyle.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS with custom dark theme tokens
- Radix UI primitives + tailwind variants for composable UI

## Getting Started

```bash
npm install
npm run dev
```

The app will be available at http://localhost:3000.

## Redis TLS (Heroku / managed providers)

If you're using a managed Redis provider that exposes a TLS endpoint (for
example `rediss://` on Heroku), you may encounter the error:

```
[ioredis] Unhandled error event: Error: self-signed certificate in certificate chain
```

This repository supports an opt-in workaround. Set one of the environment
variables below when connecting to a `rediss://` URL to disable strict
certificate verification:

- `REDIS_TLS_ALLOW_SELF_SIGNED=true` (existing name)
- `REDIS_ALLOW_INSECURE_TLS=true` (alias)

When set, the Redis client will be created with `tls.rejectUnauthorized =
false`.

Security note: disabling certificate verification weakens TLS and should only
be used if you understand the risk. Prefer configuring a trusted CA (for
example using `NODE_EXTRA_CA_CERTS`) or using a Redis provider that presents
a certificate trusted by Node.
# Decksy AI

A Next.js application that helps Clash Royale players discover and learn decks tailored to their collection, trophies, and preferred playstyle.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS with custom dark theme tokens
- Radix UI primitives + tailwind variants for composable UI

## Getting Started

```bash
npm install
npm run dev
```

The app will be available at http://localhost:3000.
