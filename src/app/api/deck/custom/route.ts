import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Validation schemas
const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
  cards: z.array(z.string()).length(8),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(false),
});

const updateDeckSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  aiAnalysis: z.any().optional(),
});

const deleteDeckSchema = z.object({
  id: z.string(),
});

/**
 * GET /api/deck/custom
 * List user's custom decks
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const decks = await prisma.customDeck.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        cards: true,
        description: true,
        isPublic: true,
        viewCount: true,
        copyCount: true,
        aiAnalysis: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ decks });
  } catch (error) {
    console.error("[api/deck/custom] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deck/custom
 * Create a new custom deck
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

    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = createDeckSchema.parse(body);

    // Generate slug from name
    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists for this user
    const existingDeck = await prisma.customDeck.findUnique({
      where: {
        userId_slug: {
          userId: session.user.id,
          slug,
        },
      },
    });

    if (existingDeck) {
      // Append timestamp to make it unique
      const uniqueSlug = `${slug}-${Date.now()}`;
      const deck = await prisma.customDeck.create({
        data: {
          userId: session.user.id,
          name: validated.name,
          slug: uniqueSlug,
          cards: validated.cards,
          description: validated.description,
          isPublic: validated.isPublic,
        },
      });

      return NextResponse.json({ deck }, { status: 201 });
    }

    const deck = await prisma.customDeck.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        slug,
        cards: validated.cards,
        description: validated.description,
        isPublic: validated.isPublic,
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[api/deck/custom] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/deck/custom
 * Update an existing custom deck
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
    const validated = updateDeckSchema.parse(body);

    // Verify ownership
    const existingDeck = await prisma.customDeck.findUnique({
      where: {
        id: validated.id,
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    if (existingDeck.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update deck
    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.isPublic !== undefined) updateData.isPublic = validated.isPublic;
    if (validated.aiAnalysis !== undefined) updateData.aiAnalysis = validated.aiAnalysis;

    const deck = await prisma.customDeck.update({
      where: {
        id: validated.id,
      },
      data: updateData,
    });

    return NextResponse.json({ deck });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[api/deck/custom] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deck/custom
 * Delete a custom deck
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Deck ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingDeck = await prisma.customDeck.findUnique({
      where: {
        id,
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    if (existingDeck.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.customDeck.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/deck/custom] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}
