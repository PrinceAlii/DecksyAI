import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { generateCustomDeckAnalysis } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

const analyzeSchema = z.object({
  cards: z.array(z.string()).length(8),
  deckId: z.string().optional(), // If provided, save analysis to this deck
});

/**
 * POST /api/analyze/custom
 * Analyze a custom deck using Gemini AI
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = analyzeSchema.parse(body);

    // Generate AI analysis
    const analysis = await generateCustomDeckAnalysis(validated.cards);

    // If deckId provided, save analysis to database
    if (validated.deckId && prisma) {
      const deck = await prisma.customDeck.findUnique({
        where: { id: validated.deckId },
      });

      if (deck && deck.userId === session.user.id) {
        await prisma.customDeck.update({
          where: { id: validated.deckId },
          data: { aiAnalysis: analysis },
        });
      }
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[api/analyze/custom] POST error:", error);
    return NextResponse.json(
      { error: "Failed to analyze deck" },
      { status: 500 }
    );
  }
}
