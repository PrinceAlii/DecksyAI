import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    sessionId: string;
    rating: number;
    notes?: string;
  };

  const recommendation = await prisma.recommendation.findUnique({ where: { sessionId: body.sessionId } });
  if (!recommendation) {
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      recommendationId: recommendation.id,
      rating: body.rating,
      notes: body.notes,
    },
  });

  return NextResponse.json(feedback, { status: 200 });
}

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ feedback: [] }, { status: 200 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const where: Prisma.FeedbackWhereInput = sessionId
    ? { recommendation: { sessionId } }
    : {};

  const feedback = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feedback }, { status: 200 });
}
