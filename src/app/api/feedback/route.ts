import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { feedbackListQuerySchema, feedbackRequestSchema, errorResponseSchema } from "@/app/api/_schemas";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, isInternalRequest, RateLimitResult, withRetryHeaders } from "@/lib/rate-limit";
import { getServerEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(errorResponseSchema.parse({ error: "Database not configured" }), { status: 503 });
  }

  const primaryLimit = await enforceRateLimit({
    request,
    resource: "api:feedback:post",
    limit: 10,
    refillIntervalMs: 60_000,
  });

  if (!primaryLimit.ok) {
    const response = NextResponse.json(errorResponseSchema.parse({ error: "Too many feedback submissions" }), { status: 429 });
    return withRetryHeaders(response, primaryLimit);
  }

  const parsedBody = feedbackRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    const response = NextResponse.json(
      errorResponseSchema.parse({ error: "Invalid feedback payload", details: parsedBody.error.flatten() }),
      { status: 400 },
    );
    return withRetryHeaders(response, primaryLimit);
  }

  const body = parsedBody.data;

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const env = getServerEnv();
  const blocklist = env.FEEDBACK_USER_AGENT_BLOCKLIST
    ? env.FEEDBACK_USER_AGENT_BLOCKLIST.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean)
    : [];

  if (!isInternalRequest(request) && blocklist.some((needle) => userAgent.toLowerCase().includes(needle))) {
    const denyState: RateLimitResult = {
      ok: false,
      remaining: 0,
      limit: 0,
      retryAfterMs: 86_400_000,
      resetInMs: 86_400_000,
      bypassed: false,
    };
    const response = NextResponse.json(errorResponseSchema.parse({ error: "Feedback temporarily unavailable" }), {
      status: 429,
    });
    return withRetryHeaders(response, denyState);
  }

  const uaLimit = await enforceRateLimit({
    request,
    resource: "api:feedback:ua",
    limit: 3,
    refillIntervalMs: 10 * 60_000,
    identifier: userAgent.toLowerCase(),
  });

  if (!uaLimit.ok) {
    const response = NextResponse.json(errorResponseSchema.parse({ error: "Feedback temporarily rate limited" }), {
      status: 429,
    });
    return withRetryHeaders(response, uaLimit);
  }

  const recommendation = await prisma.recommendation.findUnique({ where: { sessionId: body.sessionId } });
  if (!recommendation) {
    const response = NextResponse.json(errorResponseSchema.parse({ error: "Recommendation not found" }), { status: 404 });
    return withRetryHeaders(response, primaryLimit);
  }

  const feedback = await prisma.feedback.create({
    data: {
      recommendationId: recommendation.id,
      rating: body.rating,
      notes: body.notes,
    },
  });

  const response = NextResponse.json(feedback, { status: 200 });
  return withRetryHeaders(response, primaryLimit);
}

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ feedback: [] }, { status: 200 });
  }

  const query = feedbackListQuerySchema.safeParse({ sessionId: request.nextUrl.searchParams.get("sessionId") ?? undefined });
  if (!query.success) {
    return NextResponse.json(errorResponseSchema.parse({ error: "Invalid query" }), { status: 400 });
  }

  const where: Prisma.FeedbackWhereInput = query.data.sessionId
    ? { recommendation: { sessionId: query.data.sessionId } }
    : {};

  const feedback = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feedback }, { status: 200 });
}
