import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PublicDeckView } from "@/components/features/deck-builder/public-deck-view";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

interface PageProps {
  params: {
    userId: string;
    slug: string;
  };
}

async function getDeck(userId: string, slug: string) {
  if (!prisma) {
    return null;
  }

  try {
    const deck = await prisma.customDeck.findUnique({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Only show public decks or decks owned by the current user
    if (!deck || (!deck.isPublic && deck.userId !== userId)) {
      return null;
    }

    return deck;
  } catch (error) {
    console.error("[deck/[userId]/[slug]] Error fetching deck:", error);
    return null;
  }
}

async function incrementViewCount(userId: string, slug: string, viewerUserId?: string) {
  if (!prisma) return;

  try {
    // Only increment if viewer is not the owner
    const deck = await prisma.customDeck.findUnique({
      where: { userId_slug: { userId, slug } },
      select: { userId: true },
    });

    if (deck && deck.userId !== viewerUserId) {
      await prisma.customDeck.update({
        where: { userId_slug: { userId, slug } },
        data: { viewCount: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error("[deck/[userId]/[slug]] Error incrementing view count:", error);
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const deck = await getDeck(params.userId, params.slug);

  if (!deck) {
    return {
      title: "Deck Not Found | Decksy AI",
    };
  }

  const deckName = deck.name;
  const description = deck.description || `Check out ${deck.user?.name || "this player"}'s custom Clash Royale deck: ${deckName}`;
  const cardCount = Array.isArray(deck.cards) ? deck.cards.length : 0;

  return {
    title: `${deckName} | Decksy AI`,
    description,
    openGraph: {
      title: `${deckName} - Clash Royale Deck`,
      description,
      type: "article",
      siteName: "Decksy AI",
      images: [
        {
          url: "/og-image.png", // You can add a dynamic OG image generator later
          width: 1200,
          height: 630,
          alt: `${deckName} deck`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${deckName} - Clash Royale Deck`,
      description,
    },
  };
}

export default async function PublicDeckPage({ params }: PageProps) {
  const deck = await getDeck(params.userId, params.slug);

  if (!deck) {
    notFound();
  }

  // Increment view count asynchronously
  const session = await getServerAuthSession();
  incrementViewCount(params.userId, params.slug, session?.user?.id);

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PublicDeckView 
        deck={deck} 
        isOwner={session?.user?.id === deck.userId}
      />
    </Suspense>
  );
}
