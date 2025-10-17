# Operations

## API rate limiting

Decksy AI now uses Redis-backed token buckets for high-traffic API routes. The limiter is applied to:

- `POST /api/recommend`
- `POST /api/coach`
- `POST /api/feedback`
- Middleware covering `GET` requests to `/api/recommend`, `/api/coach`, `/api/player/[tag]`, and `/api/battles/[tag]`

All 429 responses include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers. Internal services can bypass rate limits by setting the `x-decksy-internal-token` header to the value of the `INTERNAL_API_TOKEN` environment variable.

## Feedback abuse controls

User-agent throttles run alongside the standard rate limit on `/api/feedback`. To temporarily block noisy clients, provide a comma-separated list of case-insensitive substrings via `FEEDBACK_USER_AGENT_BLOCKLIST`. Requests whose `User-Agent` matches any entry receive a 429 response with a one-day retry window unless they include the internal bypass token.

The honeypot field exposed by the recommendation feedback form is validated on the server. Any non-empty value triggers a schema failure and the submission is rejected.
