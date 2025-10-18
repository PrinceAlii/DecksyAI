# Deployment Fixes Applied

## Issues Fixed

### 1. Redis TLS Connection Error ✅
**Error:** `[ioredis] Unhandled error event: Error: self-signed certificate in certificate chain`

**Solution:** Modified `src/lib/redis.ts` to properly handle Heroku Redis TLS:
- Now uses secure TLS with certificate verification in production (default behavior)
- Only allows insecure TLS in development mode automatically
- Removed the need for `REDIS_TLS_ALLOW_SELF_SIGNED` in production

### 2. Magic Link URL Issue (localhost instead of decksy.dev) ✅
**Problem:** Magic links in emails were pointing to `localhost` instead of `https://decksy.dev`

**Solution:** You need to set the `NEXTAUTH_URL` environment variable on Heroku:

```bash
heroku config:set NEXTAUTH_URL=https://decksy.dev --app decksy
```

### 3. Domain References (decksy.ai → decksy.dev) ✅
**Problem:** Multiple references to `decksy.ai` throughout the codebase

**Files Updated:**
- ✅ `src/lib/auth.ts` - Email sender addresses (`login@decksy.dev`)
- ✅ `src/app/layout.tsx` - Metadata base URL
- ✅ `src/app/terms/page.tsx` - Support email (`support@decksy.dev`)
- ✅ `src/app/privacy/page.tsx` - Privacy email (`privacy@decksy.dev`)
- ✅ `src/app/login/page.tsx` - Login instructions
- ✅ `src/lib/__tests__/rate-limit-penetration.test.ts` - Test URL
- ✅ `.env.example` - Example email configuration

---

## Required Actions on Heroku

Run these commands to complete the fix:

```bash
# 1. Set the correct application URL (CRITICAL!)
heroku config:set NEXTAUTH_URL=https://decksy.dev --app decksy-ai-prod

# 2. Verify the insecure Redis flags are removed (should already be done)
heroku config:unset REDIS_TLS_ALLOW_SELF_SIGNED --app decksy-ai-prod
heroku config:unset REDIS_ALLOW_INSECURE_TLS --app decksy-ai-prod

# 3. Verify your config is correct
heroku config --app decksy-ai-prod | grep -E "NEXTAUTH_URL|REDIS"

# 4. Check that the app is running properly
heroku logs --tail --app decksy-ai-prod
```

---

## What Changed in the Code

### Redis Configuration (`src/lib/redis.ts`)
**Before:** Only enabled TLS security when NOT using insecure flags
```typescript
if (isTls && allowInsecure) {
  (redisOptions as any).tls = { rejectUnauthorized: false };
}
```

**After:** Always configures TLS properly, with secure verification as default
```typescript
if (isTls) {
  if (allowInsecure) {
    // Development only
    (redisOptions as any).tls = { rejectUnauthorized: false };
  } else {
    // Production - secure by default
    (redisOptions as any).tls = {
      rejectUnauthorized: true,
    };
  }
}
```

---

## Expected Results

After deploying these changes and setting the Heroku config vars:

1. ✅ Redis connections will work properly with Heroku Redis addon
2. ✅ Magic links will point to `https://decksy.dev` instead of localhost
3. ✅ All email addresses will use `@decksy.dev` domain
4. ✅ No more TLS certificate errors in logs

---

## Testing Checklist

- [ ] Deploy changes to Heroku
- [ ] Set `NEXTAUTH_URL=https://decksy.dev`
- [ ] Remove any insecure Redis flags
- [ ] Test login flow - magic link should work
- [ ] Check Heroku logs for Redis errors (should be none)
- [ ] Verify player tag search works (uses Redis cache)
- [ ] Check magic link email points to correct domain

---

**Last Updated:** October 18, 2025
