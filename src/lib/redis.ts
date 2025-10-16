import Redis from "ioredis";

import { getServerEnv, isDevelopment } from "@/lib/env";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) {
    return client;
  }

  const { REDIS_URL } = getServerEnv();

  if (!REDIS_URL) {
    if (isDevelopment()) {
      console.warn("REDIS_URL not set. Falling back to in-memory cache.");
    }
    return null;
  }

  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
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
