import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { errorResponseSchema } from "@/app/api/_schemas";
import { enforceRateLimit, withRetryHeaders } from "@/lib/rate-limit";

const GET_RATE_LIMIT = {
  limit: 60,
  refillIntervalMs: 60_000,
};

export async function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const rateLimitState = await enforceRateLimit({
    request,
    resource: `middleware:${request.nextUrl.pathname}`,
    ...GET_RATE_LIMIT,
  });

  if (!rateLimitState.ok) {
    const response = NextResponse.json(errorResponseSchema.parse({ error: "Too many requests" }), { status: 429 });
    return withRetryHeaders(response, rateLimitState);
  }

  return withRetryHeaders(NextResponse.next(), rateLimitState);
}

export const config = {
  matcher: ["/api/recommend", "/api/coach", "/api/player/:path*", "/api/battles/:path*"],
};
