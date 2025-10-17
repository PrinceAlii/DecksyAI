import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware is disabled for now because rate limiting with Redis (ioredis)
 * is incompatible with Edge Runtime. Rate limiting is handled in individual
 * API route handlers instead.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/recommend", "/api/coach", "/api/player/:path*", "/api/battles/:path*"],
};
