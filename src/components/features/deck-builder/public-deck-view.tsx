"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Eye,
  Calendar,
  User,
  Share2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCardArtUrl, CARD_ART_PLACEHOLDER } from "@/lib/data/card-art";
import { detectDeckArchetype, getArchetypeColor } from "@/lib/deck-builder-utils";

interface DeckData {
  id: string;
  name: string;
  slug: string;
  cards: unknown;
  description: string | null;
  isPublic: boolean;
  viewCount: number;
  copyCount: number;
  aiAnalysis: unknown;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  } | null;
}

interface PublicDeckViewProps {
  deck: DeckData;
  isOwner: boolean;
}

interface CardData {
  key: string;
  name: string;
  elixir: number;
  category: "win-condition" | "support" | "spell" | "building";
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
}

// Mock card data - in production, fetch from API
const MOCK_CARD_DATA: Record<string, CardData> = {
  hog_rider: { key: "hog_rider", name: "Hog Rider", elixir: 4, category: "win-condition", rarity: "rare" },
  musketeer: { key: "musketeer", name: "Musketeer", elixir: 4, category: "support", rarity: "rare" },
  valkyrie: { key: "valkyrie", name: "Valkyrie", elixir: 4, category: "support", rarity: "rare" },
  cannon: { key: "cannon", name: "Cannon", elixir: 3, category: "building", rarity: "common" },
  fireball: { key: "fireball", name: "Fireball", elixir: 4, category: "spell", rarity: "rare" },
  log: { key: "log", name: "The Log", elixir: 2, category: "spell", rarity: "legendary" },
  ice_spirit: { key: "ice_spirit", name: "Ice Spirit", elixir: 1, category: "support", rarity: "common" },
  skeletons: { key: "skeletons", name: "Skeletons", elixir: 1, category: "support", rarity: "common" },
};

export function PublicDeckView({ deck, isOwner }: PublicDeckViewProps) {
  const router = useRouter();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const cardKeys = Array.isArray(deck.cards) ? (deck.cards as string[]) : [];
  const cardData = cardKeys.map((key) => MOCK_CARD_DATA[key] || { 
    key, 
    name: key, 
    elixir: 0, 
    category: "support" as const, 
    rarity: "common" as const 
  });
  
  const archetype = detectDeckArchetype(cardData);
  const archetypeColor = getArchetypeColor(archetype);
  
  const avgElixir = cardData.length > 0
    ? (cardData.reduce((sum, card) => sum + card.elixir, 0) / cardData.length).toFixed(1)
    : "0.0";

  const handleCopyDeck = async () => {
    if (copying) return;

    setCopying(true);
    try {
      // Call API to copy deck
      const response = await fetch("/api/deck/custom/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId: deck.id,
          userId: deck.userId,
          slug: deck.slug,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          // Redirect to login
          router.push(`/login?callbackUrl=/deck/${deck.userId}/${deck.slug}`);
          return;
        }
        throw new Error(data.error || "Failed to copy deck");
      }

      const data = await response.json();
      setCopyFeedback("Deck copied!");
      setTimeout(() => setCopyFeedback(null), 3000);

      // Redirect to deck builder with copied deck
      router.push(`/deck-builder?loadDeck=${data.deck.id}`);
    } catch (error) {
      console.error("Copy error:", error);
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(null), 3000);
    } finally {
      setCopying(false);
    }
  };

  const handleShareDeck = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: deck.name,
          text: deck.description || `Check out my ${archetype} deck!`,
          url,
        });
      } catch (error) {
        // User cancelled or error, fallback to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback("Link copied!");
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyFeedback("Link copied!");
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const cardsSection = (
    <Card className="p-6 border-border/60">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text">Deck Cards</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-text-muted">Avg Elixir:</span>
            <span className="ml-2 font-bold text-accent">{avgElixir}</span>
          </div>
          <div className="text-sm">
            <span className="text-text-muted">Cards:</span>
            <span className="ml-2 font-bold text-primary">{cardData.length}/8</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cardData.map((card) => (
          <div
            key={card.key}
            className="relative flex flex-col items-center gap-2 rounded-lg border border-primary/60 bg-primary/10 p-4 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border/40 bg-surface">
              <Image
                src={getCardArtUrl(card)}
                alt={card.name}
                fill
                sizes="200px"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-sm font-medium text-text text-center line-clamp-1">
              {card.name}
            </p>
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
              {card.elixir}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-surface/50 backdrop-blur-sm">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-text">{deck.name}</h1>
                <Badge variant="primary" className={cn("text-xs", archetypeColor)}>
                  {archetype}
                </Badge>
              </div>
              
              {deck.description && (
                <p className="text-text-muted mb-3">{deck.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span>{deck.user?.name || "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="size-4" />
                  <span>{deck.viewCount} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Copy className="size-4" />
                  <span>{deck.copyCount} copies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{new Date(deck.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareDeck}
                className="gap-2"
              >
                <Share2 className="size-4" />
                Share
              </Button>
              
              {!isOwner && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyDeck}
                  disabled={copying}
                  className="gap-2"
                >
                  {copying ? (
                    <>Loading...</>
                  ) : copyFeedback ? (
                    <>
                      <Check className="size-4" />
                      {copyFeedback}
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy Deck
                    </>
                  )}
                </Button>
              )}

              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/deck-builder?loadDeck=${deck.id}`)}
                  className="gap-2"
                >
                  <ExternalLink className="size-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deck Content */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Cards Grid */}
          {cardsSection as any}

          {/* AI Analysis (if available) */}
          {deck.aiAnalysis && typeof deck.aiAnalysis === 'object' && (
            <Card className="p-6 border-accent/60 bg-accent/5">
              <h2 className="text-xl font-bold text-text mb-4">AI Analysis</h2>
              <div className="prose prose-invert max-w-none">
                <pre className="text-sm text-text-muted whitespace-pre-wrap">
                  {JSON.stringify(deck.aiAnalysis, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          {/* Call to Action */}
          {!isOwner && (
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 text-center">
              <h3 className="text-lg font-semibold text-text mb-2">
                Like this deck?
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Copy it to your collection and start building your own decks!
              </p>
              <Button
                variant="primary"
                onClick={handleCopyDeck}
                disabled={copying}
                className="gap-2"
              >
                {copying ? "Copying..." : "Copy to My Decks"}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
