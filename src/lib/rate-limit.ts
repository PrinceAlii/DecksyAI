import { createHash } from "crypto";

import { getServerEnv, isDevelopment } from "@/lib/env";
import { getRedis } from "@/lib/redis";

interface TokenBucketConfig {
  /** Maximum number of tokens allowed in the bucket. */
  limit: number;
  /** Interval in milliseconds to fully replenish `refillAmount` tokens. */
  refillIntervalMs: number;
  /** Number of tokens restored every `refillIntervalMs`. Defaults to `limit`. */
  refillAmount?: number;
}

interface RateLimitState {
  ok: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number | null;
  resetInMs: number;
  bypassed: boolean;
}

interface ApplyRateLimitOptions extends TokenBucketConfig {
  /** Identifier for the resource being protected, e.g. `api:feedback`. */
  resource: string;
  /** The HTTP request being limited. */
  request: Request;
  /** Additional identifier appended to the bucket key (e.g. session or UA hash). */
  identifier?: string;
  /** When true, skip rate limiting entirely. */
  forceBypass?: boolean;
}

const memoryBuckets = new Map<
  string,
  { tokens: number; updatedAt: number; limit: number; refillIntervalMs: number; refillAmount: number }
>();

const LUA_TOKEN_BUCKET = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local interval = tonumber(ARGV[2])
local refill = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local bucket = redis.call("HMGET", key, "tokens", "updatedAt")
local tokens = tonumber(bucket[1])
local updatedAt = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  updatedAt = now
end

if now > updatedAt then
  local delta = now - updatedAt
  local rate = refill / interval
  if rate > 0 then
    tokens = math.min(capacity, tokens + (delta * rate))
  end
  updatedAt = now
end

local allowed = 0
local retryAfter = 0
local rate = refill / interval
local resetIn = 0

if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
else
  if rate > 0 then
    local needed = 1 - tokens
    retryAfter = math.ceil(needed / rate)
    local deficit = capacity - tokens
    resetIn = math.ceil(deficit / rate)
  else
    retryAfter = interval
    resetIn = interval
  end
end

redis.call("HMSET", key, "tokens", tokens, "updatedAt", updatedAt)
redis.call("PEXPIRE", key, math.max(interval, 1000))

return {allowed, tokens, retryAfter, resetIn}
`;

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildBucketKey(resource: string, identifier: string): string {
  return `rate:${resource}:${hashIdentifier(identifier)}`;
}

function resolveIdentifier(request: Request, explicit?: string): string {
  if (explicit) return explicit;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && forwarded.length > 0) {
    const [first] = forwarded.split(",");
    if (first) return first.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fall back to user-agent which is at least stable per client.
  const ua = request.headers.get("user-agent") ?? "unknown";
  return `${ua}`;
}

async function applyRedisTokenBucket(bucketKey: string, config: Required<TokenBucketConfig>): Promise<RateLimitState> {
  const redis = getRedis();

  if (!redis) {
    return applyMemoryTokenBucket(bucketKey, config);
  }

  try {
    const now = Date.now();
    const [allowedRaw, tokensRaw, retryAfterRaw, resetRaw] = (await redis.eval(
      LUA_TOKEN_BUCKET,
      1,
      bucketKey,
      config.limit,
      config.refillIntervalMs,
      config.refillAmount,
      now,
    )) as [unknown, unknown, unknown, unknown];

    const allowed = Number(allowedRaw);
    const tokens = Number(tokensRaw);
    const retryAfter = Number(retryAfterRaw);
    const reset = Number(resetRaw);

    const ok = allowed === 1;
    const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;

    return {
      ok,
      remaining: Math.max(0, Math.floor(tokens)),
      limit: config.limit,
      retryAfterMs,
      resetInMs: Number.isFinite(reset) && reset > 0 ? reset : config.refillIntervalMs,
      bypassed: false,
    };
  } catch (error) {
    if (isDevelopment()) {
      console.warn("Redis rate limiter unavailable, falling back to memory store", error);
    }
    return applyMemoryTokenBucket(bucketKey, config);
  }
}

function applyMemoryTokenBucket(bucketKey: string, config: Required<TokenBucketConfig>): RateLimitState {
  const now = Date.now();
  const bucket = memoryBuckets.get(bucketKey) ?? {
    tokens: config.limit,
    updatedAt: now,
    limit: config.limit,
    refillIntervalMs: config.refillIntervalMs,
    refillAmount: config.refillAmount,
  };

  const delta = now - bucket.updatedAt;
  const rate = bucket.refillAmount / bucket.refillIntervalMs;
  if (delta > 0 && rate > 0) {
    bucket.tokens = Math.min(bucket.limit, bucket.tokens + delta * rate);
    bucket.updatedAt = now;
  }

  let ok = false;
  let retryAfterMs: number | null = null;
  let resetInMs = bucket.refillIntervalMs;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    ok = true;
  } else if (rate > 0) {
    const needed = 1 - bucket.tokens;
    retryAfterMs = Math.ceil(needed / rate);
    const deficit = bucket.limit - bucket.tokens;
    resetInMs = Math.ceil(deficit / rate);
  } else {
    retryAfterMs = bucket.refillIntervalMs;
    resetInMs = bucket.refillIntervalMs;
  }

  memoryBuckets.set(bucketKey, bucket);

  return {
    ok,
    remaining: Math.max(0, Math.floor(bucket.tokens)),
    limit: bucket.limit,
    retryAfterMs,
    resetInMs,
    bypassed: false,
  };
}

export function isInternalRequest(request: Request): boolean {
  const token = request.headers.get("x-decksy-internal-token") ?? undefined;
  const env = getServerEnv();
  if (!env.INTERNAL_API_TOKEN) {
    return false;
  }
  return token === env.INTERNAL_API_TOKEN;
}

export function shouldBypassRateLimit(request: Request, explicit = false): boolean {
  if (explicit) {
    return true;
  }
  const internal = isInternalRequest(request);
  if (internal) {
    return true;
  }
  return false;
}

export async function enforceRateLimit(options: ApplyRateLimitOptions): Promise<RateLimitState> {
  const refillAmount = options.refillAmount ?? options.limit;
  const config: Required<TokenBucketConfig> = {
    limit: options.limit,
    refillIntervalMs: options.refillIntervalMs,
    refillAmount,
  };

  if (shouldBypassRateLimit(options.request, options.forceBypass)) {
    return {
      ok: true,
      remaining: config.limit,
      limit: config.limit,
      retryAfterMs: null,
      resetInMs: config.refillIntervalMs,
      bypassed: true,
    };
  }

  const identifier = resolveIdentifier(options.request, options.identifier);
  const bucketKey = buildBucketKey(options.resource, identifier);

  return applyRedisTokenBucket(bucketKey, config);
}

export function withRetryHeaders(response: Response, state: RateLimitState): Response {
  if (state.retryAfterMs && state.retryAfterMs > 0) {
    response.headers.set("Retry-After", Math.ceil(state.retryAfterMs / 1000).toString());
  }
  response.headers.set("X-RateLimit-Limit", state.limit.toString());
  response.headers.set("X-RateLimit-Remaining", state.remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(state.resetInMs / 1000).toString());
  if (state.bypassed) {
    response.headers.set("X-RateLimit-Bypass", "internal");
  }
  return response;
}

export type RateLimitResult = RateLimitState;
