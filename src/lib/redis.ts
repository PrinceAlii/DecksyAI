import Redis from "ioredis";

import { getServerEnv, isDevelopment } from "@/lib/env";

let insecureRedisWarningEmitted = false;

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) {
    return client;
  }

  const env = getServerEnv();
  const { REDIS_URL } = env;

  if (!REDIS_URL) {
    if (isDevelopment()) {
      console.warn("REDIS_URL not set. Falling back to in-memory cache.");
    }
    return null;
  }

  // Opt-in TLS behavior: only disable certificate verification when the
  // env var REDIS_TLS_ALLOW_SELF_SIGNED is set to true and the URL uses TLS.
  const { REDIS_TLS_ALLOW_SELF_SIGNED, REDIS_ALLOW_INSECURE_TLS } = env;
  const isTls = REDIS_URL.startsWith("rediss://");

  const redisOptions: Record<string, unknown> = {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  };

  // Accept either env var as an alias for the opt-in behavior. For local
  // development, enable the insecure TLS fallback automatically so the
  // developer doesn't have to modify their `.env`. In non-development
  // environments this must be explicitly set via environment variables.
  const allowInsecure = Boolean(
    REDIS_TLS_ALLOW_SELF_SIGNED || REDIS_ALLOW_INSECURE_TLS || isDevelopment()
  );

  if (isTls) {
    if (allowInsecure) {
      if ((REDIS_TLS_ALLOW_SELF_SIGNED || REDIS_ALLOW_INSECURE_TLS) && !insecureRedisWarningEmitted) {
        console.warn(
          "[redis] Insecure TLS verification disabled via REDIS_TLS_ALLOW_SELF_SIGNED/REDIS_ALLOW_INSECURE_TLS. Use only in local development and monitor deployments closely.",
        );
        insecureRedisWarningEmitted = true;
      }

      // Note: disabling rejectUnauthorized weakens TLS verification. Use only
      // when you understand the security implications (e.g., quick Heroku
      // workaround). Prefer providing a proper CA when possible.
      // ioredis types are a bit loose here; cast to any to avoid TS complaints.
      (redisOptions as any).tls = { rejectUnauthorized: false };
    } else {
      // In production (Heroku), use proper TLS with certificate verification
      // This is the secure default for Heroku Redis addon
      (redisOptions as any).tls = {
        rejectUnauthorized: true,
        // Heroku Redis uses valid certificates, no need to disable verification
      };
    }
  }

  client = new Redis(REDIS_URL, redisOptions as any);

  return client;
}

const inMemoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();

  if (redis) {
    const result = await redis.get(key);
    return result ? (JSON.parse(result) as T) : null;
  }

  const entry = inMemoryCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    inMemoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();

  if (redis) {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return;
  }

  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
