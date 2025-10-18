import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Validation schema
const copyDeckSchema = z.object({
  deckId: z.string(),
  userId: z.string(),
  slug: z.string(),
});

/**
 * POST /api/deck/custom/copy
 * Copy a public deck to user's collection
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to copy decks." },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = copyDeckSchema.parse(body);

    // Fetch the source deck
    const sourceDeck = await prisma.customDeck.findUnique({
      where: {
        userId_slug: {
          userId: validated.userId,
          slug: validated.slug,
        },
      },
    });

    if (!sourceDeck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    // Verify the deck is public or owned by the user
    if (!sourceDeck.isPublic && sourceDeck.userId !== session.user.id) {
      return NextResponse.json(
        { error: "This deck is private" },
        { status: 403 }
      );
    }

    // Don't allow copying own deck
    if (sourceDeck.userId === session.user.id) {
      return NextResponse.json(
        { error: "You already own this deck" },
        { status: 400 }
      );
    }

    // Generate new slug for the copied deck
    const newName = `${sourceDeck.name} (Copy)`;
    const baseSlug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Make slug unique
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // Create the copied deck
    const copiedDeck = await prisma.customDeck.create({
      data: {
        userId: session.user.id,
        name: newName,
        slug: uniqueSlug,
        cards: sourceDeck.cards as any, // Type assertion needed for JsonValue -> InputJsonValue
        description: sourceDeck.description 
          ? `${sourceDeck.description}\n\nCopied from ${sourceDeck.name}` 
          : `Copied from ${sourceDeck.name}`,
        isPublic: false, // Copied decks are private by default
      },
    });

    // Increment copy count on source deck
    await prisma.customDeck.update({
      where: {
        id: sourceDeck.id,
      },
      data: {
        copyCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ 
      deck: copiedDeck,
      message: "Deck copied successfully!" 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[api/deck/custom/copy] POST error:", error);
    return NextResponse.json(
      { error: "Failed to copy deck" },
      { status: 500 }
    );
  }
}
