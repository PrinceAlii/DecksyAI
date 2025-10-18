"use client";

import { useState } from "react";
import Image from "next/image";
import { X, TrendingUp, Zap, Shield, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compareDecks } from "@/lib/deck-comparison";
import { getCardArtUrl } from "@/lib/data/card-art";
import { cn } from "@/lib/utils";

interface CardData {
  key: string;
  name: string;
  category: "win-condition" | "support" | "spell" | "building";
  elixir: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
}

interface DeckComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck1: {
    name: string;
    cards: string[];
  };
  deck2: {
    name: string;
    cards: string[];
  };
  allCards: CardData[];
}

export function DeckComparisonModal({
  isOpen,
  onClose,
  deck1,
  deck2,
  allCards,
}: DeckComparisonModalProps) {
  if (!isOpen) return null;

  const comparison = compareDecks(deck1.cards, deck2.cards, allCards);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <Card className="border-border/60 bg-surface shadow-2xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="size-6 text-primary" />
                <h2 className="text-2xl font-semibold text-text">Compare Decks</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-text-muted hover:text-text"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Deck Names */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text">{deck1.name}</h3>
                <p className="text-sm text-text-muted">Your Deck</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text">{deck2.name}</h3>
                <p className="text-sm text-text-muted">Comparison Target</p>
              </div>
            </div>

            {/* Card Grids */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Deck 1 Cards */}
              <div className="grid grid-cols-4 gap-2">
                {comparison.deck1Cards.map((card) => {
                  const isCommon = comparison.commonCards.some(c => c.key === card.key);
                  const isUnique = comparison.uniqueToDeck1.some(c => c.key === card.key);
                  
                  return (
                    <div
                      key={card.key}
                      className={cn(
                        "relative aspect-[3/4] rounded-md border overflow-hidden",
                        isCommon && "border-accent/60 ring-2 ring-accent/30",
                        isUnique && "border-primary/60 ring-2 ring-primary/30"
                      )}
                    >
                      <Image
                        src={getCardArtUrl(card)}
                        alt={card.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                        unoptimized
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-1 right-1 text-xs"
                      >
                        {card.elixir}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Deck 2 Cards */}
              <div className="grid grid-cols-4 gap-2">
                {comparison.deck2Cards.map((card) => {
                  const isCommon = comparison.commonCards.some(c => c.key === card.key);
                  const isUnique = comparison.uniqueToDeck2.some(c => c.key === card.key);
                  
                  return (
                    <div
                      key={card.key}
                      className={cn(
                        "relative aspect-[3/4] rounded-md border overflow-hidden",
                        isCommon && "border-accent/60 ring-2 ring-accent/30",
                        isUnique && "border-orange-400/60 ring-2 ring-orange-400/30"
                      )}
                    >
                      <Image
                        src={getCardArtUrl(card)}
                        alt={card.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                        unoptimized
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-1 right-1 text-xs"
                      >
                        {card.elixir}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-accent/60 ring-2 ring-accent/30" />
                <span className="text-text-muted">Common Cards ({comparison.commonCards.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-primary/60 ring-2 ring-primary/30" />
                <span className="text-text-muted">Unique to Your Deck</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-orange-400/60 ring-2 ring-orange-400/30" />
                <span className="text-text-muted">Unique to Comparison</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="border-border/60 bg-background/60">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="size-6 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text">
                    {comparison.metrics.cardOverlap}/8
                  </p>
                  <p className="text-xs text-text-muted">Cards Match</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/60">
                <CardContent className="p-4 text-center">
                  <Zap className="size-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text">
                    {comparison.metrics.deck1AvgElixir.toFixed(1)} vs{" "}
                    {comparison.metrics.deck2AvgElixir.toFixed(1)}
                  </p>
                  <p className="text-xs text-text-muted">Avg Elixir Cost</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/60">
                <CardContent className="p-4 text-center">
                  <Shield className="size-6 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text">
                    {Math.abs(comparison.metrics.elixirDiff).toFixed(1)}
                  </p>
                  <p className="text-xs text-text-muted">Elixir Difference</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison */}
            <div className="space-y-4 mb-6">
              <Card className="border-border/60 bg-background/60">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-text mb-2">Card Type Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-text-muted">
                      <span className="font-medium text-text">Win Conditions:</span>{" "}
                      {comparison.metrics.winConditionComparison}
                    </p>
                    <p className="text-text-muted">
                      <span className="font-medium text-text">Spells:</span>{" "}
                      {comparison.metrics.spellComparison}
                    </p>
                    <p className="text-text-muted">
                      <span className="font-medium text-text">Buildings:</span>{" "}
                      {comparison.metrics.buildingComparison}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Unique Cards */}
              {(comparison.uniqueToDeck1.length > 0 || comparison.uniqueToDeck2.length > 0) && (
                <Card className="border-border/60 bg-background/60">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-text mb-3">Unique Cards</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-primary mb-2">Your Deck Only:</p>
                        <ul className="space-y-1">
                          {comparison.uniqueToDeck1.map(card => (
                            <li key={card.key} className="text-text-muted">
                              • {card.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-orange-400 mb-2">Comparison Only:</p>
                        <ul className="space-y-1">
                          {comparison.uniqueToDeck2.map(card => (
                            <li key={card.key} className="text-text-muted">
                              • {card.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Insight */}
              <Card className="border-accent/60 bg-accent/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="size-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-text mb-1">Analysis</h4>
                      <p className="text-sm text-text-muted">{comparison.insight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex justify-end">
              <Button variant="primary" onClick={onClose}>
                Close Comparison
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
