import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Mark route as dynamic (uses searchParams)
export const dynamic = "force-dynamic";

// Validation schema for query params
const browseParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(["newest", "views", "copies"]).default("newest"),
  archetype: z.string().optional(),
  cardKey: z.string().optional(),
  search: z.string().optional(),
});

/**
 * GET /api/deck/custom/public
 * Browse public decks with filters and pagination
 */
export async function GET(req: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const params = browseParamsSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "newest",
      archetype: searchParams.get("archetype") || undefined,
      cardKey: searchParams.get("cardKey") || undefined,
      search: searchParams.get("search") || undefined,
    });

    // Build where clause
    const where: any = {
      isPublic: true,
    };

    // Search by deck name
    if (params.search) {
      where.name = {
        contains: params.search,
        mode: "insensitive",
      };
    }

    // Filter by card (if cards array contains the key)
    if (params.cardKey) {
      where.cards = {
        array_contains: [params.cardKey],
      };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (params.sortBy) {
      case "views":
        orderBy = { viewCount: "desc" };
        break;
      case "copies":
        orderBy = { copyCount: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // Calculate pagination
    const skip = (params.page - 1) * params.limit;

    // Fetch decks with user info
    const [decks, totalCount] = await Promise.all([
      prisma.customDeck.findMany({
        where,
        orderBy,
        skip,
        take: params.limit,
        select: {
          id: true,
          name: true,
          slug: true,
          cards: true,
          description: true,
          isPublic: true,
          viewCount: true,
          copyCount: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.customDeck.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / params.limit);
    const hasNextPage = params.page < totalPages;
    const hasPrevPage = params.page > 1;

    return NextResponse.json({
      decks,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[api/deck/custom/public] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch public decks" },
      { status: 500 }
    );
  }
}
