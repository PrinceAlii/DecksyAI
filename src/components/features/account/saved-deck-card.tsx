"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Play, Sparkles, Calendar, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCardArtUrl, CARD_ART_PLACEHOLDER } from "@/lib/data/card-art";

interface SavedDeck {
  id: string;
  name: string;
  slug: string;
  cards: string[]; // Array of card keys
  description?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: any;
}

interface SavedDeckCardProps {
  deck: SavedDeck;
  onLoad: (deck: SavedDeck) => void;
  onEdit: (deck: SavedDeck) => void;
  onDelete: (deck: SavedDeck) => void;
  onAnalyze: (deck: SavedDeck) => void;
}

// Helper to calculate average elixir (simplified - you can import from actual card data)
function calculateAvgElixir(cardKeys: string[]): number {
  // This is a simplified version - in production, look up actual elixir costs
  const mockElixirCosts: Record<string, number> = {
    hog_rider: 4,
    musketeer: 4,
    valkyrie: 4,
    fireball: 4,
    log: 2,
    ice_spirit: 1,
    cannon: 3,
    skeletons: 1,
    // Add more as needed
  };
  
  const total = cardKeys.reduce((sum, key) => sum + (mockElixirCosts[key] || 3), 0);
  return total / cardKeys.length;
}

// Helper to format relative date
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function SavedDeckCard({ deck, onLoad, onEdit, onDelete, onAnalyze }: SavedDeckCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const avgElixir = calculateAvgElixir(deck.cards);
  const hasAnalysis = !!deck.aiAnalysis;

  const handleImageError = (cardKey: string) => {
    setImageErrors(prev => new Set(prev).add(cardKey));
  };

  return (
    <Card className="group border-border/60 bg-surface/80 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text truncate group-hover:text-primary transition">
              {deck.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="size-3" />
              <span>{formatRelativeDate(deck.updatedAt)}</span>
              {hasAnalysis && (
                <>
                  <span>•</span>
                  <Badge variant="primary" className="text-xs gap-1">
                    <Sparkles className="size-3" />
                    AI Analyzed
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card Grid (4x2) */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {deck.cards.map((cardKey, index) => (
            <div
              key={`${cardKey}-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-md border border-border/40 bg-background"
            >
              <Image
                src={imageErrors.has(cardKey) ? CARD_ART_PLACEHOLDER : getCardArtUrl({ key: cardKey })}
                alt={cardKey}
                fill
                sizes="80px"
                className="object-cover"
                onError={() => handleImageError(cardKey)}
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-accent" />
            <span className="text-text-muted">{avgElixir.toFixed(1)} avg</span>
          </div>
          <div className="text-text-muted">
            {deck.cards.length} cards
          </div>
        </div>

        {/* Description */}
        {deck.description && (
          <p className="mb-4 text-sm text-text-muted line-clamp-2">
            {deck.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onLoad(deck)}
            className="flex-1 gap-2"
          >
            <Play className="size-3.5" />
            Load
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyze(deck)}
            className="gap-2"
          >
            <Sparkles className="size-3.5" />
            {hasAnalysis ? "View" : "Analyze"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(deck)}
            className="size-8 p-0"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(deck)}
            className="size-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
