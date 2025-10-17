import { describe, expect, test } from "vitest";

import { enforceRateLimit } from "@/lib/rate-limit";

function createRequest(ip: string) {
  return new Request("https://decksy.ai/api/test", {
    headers: {
      "x-forwarded-for": ip,
      "user-agent": "vitest-penetration-test",
    },
  });
}

describe("rate limiter penetration", () => {
  test("blocks bursts that exceed the configured limit", async () => {
    const resource = `pen-test:${Date.now()}`;
    const limit = 3;

    for (let i = 0; i < limit; i += 1) {
      const state = await enforceRateLimit({
        request: createRequest("203.0.113.10"),
        resource,
        limit,
        refillIntervalMs: 60_000,
      });

      expect(state.ok).toBe(true);
      expect(state.remaining).toBeGreaterThanOrEqual(0);
    }

    const blocked = await enforceRateLimit({
      request: createRequest("203.0.113.10"),
      resource,
      limit,
      refillIntervalMs: 60_000,
    });

    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).not.toBeNull();
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
