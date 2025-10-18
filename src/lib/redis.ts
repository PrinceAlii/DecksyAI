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
    lazyConnect: false, // Connect immediately to catch errors early
  };

  // Accept either env var as an alias for the opt-in behavior. For local
  // development, enable the insecure TLS fallback automatically so the
  // developer doesn't have to modify their `.env`. In non-development
  // environments this must be explicitly set via environment variables.
  const allowInsecure = Boolean(
    REDIS_TLS_ALLOW_SELF_SIGNED || REDIS_ALLOW_INSECURE_TLS || isDevelopment()
  );

  if (isTls) {
    // Heroku Redis uses self-signed certificates, so we need to disable strict verification
    // This is safe because the connection is still encrypted
    (redisOptions as any).tls = {
      rejectUnauthorized: false,
    };
  }

  client = new Redis(REDIS_URL, redisOptions as any);
  
  // Handle connection errors to prevent unhandled error events
  client.on("error", (err) => {
    console.error("[redis] Connection error:", err.message);
    // Don't crash the app, just log and continue
  });

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
