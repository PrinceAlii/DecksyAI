"use client";

import * as React from "react";
import {
  TrendingUp,
  X,
  Zap,
  Clock,
  Award,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  analyzeDeckUpgrades,
  getUpgradeRecommendation,
  formatGold,
  formatTimeEstimate,
} from "@/lib/upgrade-calculator";
import { getCardArtUrl } from "@/lib/data/card-art";

interface CardData {
  key: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  level?: number;
}

interface UpgradeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardData[];
}

export function UpgradeCalculatorModal({
  isOpen,
  onClose,
  cards,
}: UpgradeCalculatorModalProps) {
  const analysis = React.useMemo(
    () => analyzeDeckUpgrades(cards),
    [cards]
  );

  const recommendation = React.useMemo(
    () => getUpgradeRecommendation(analysis),
    [analysis]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-surface border border-border/60 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border/60 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">Upgrade Calculator</h2>
              <p className="text-sm text-text-muted">
                Plan your card upgrades efficiently
              </p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Gold */}
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Award className="size-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">
                    Total Gold Needed
                  </p>
                  <p className="text-2xl font-bold text-text">
                    {formatGold(analysis.totalGold)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Time Estimate */}
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">
                    Time Estimate
                  </p>
                  <p className="text-2xl font-bold text-text">
                    {formatTimeEstimate(analysis.estimatedDays)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Priority Upgrade */}
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Zap className="size-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">
                    Start With
                  </p>
                  <p className="text-sm font-bold text-text truncate">
                    {analysis.cardUpgrades[0]?.cardName || "All maxed!"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recommendation */}
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
            <div className="flex items-start gap-3">
              <Zap className="size-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text mb-1">
                  Upgrade Recommendation
                </p>
                <p className="text-sm text-text-muted">{recommendation}</p>
              </div>
            </div>
          </Card>

          {/* Card-by-Card Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
              Upgrade Priority
              <Badge variant="secondary" className="text-xs">
                {analysis.cardUpgrades.length} cards
              </Badge>
            </h3>
            <div className="space-y-2">
              {analysis.cardUpgrades.map((upgrade, index) => (
                <Card
                  key={upgrade.cardKey}
                  className="p-4 border-border/60 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Priority Badge */}
                    <div className="flex-shrink-0">
                      <Badge
                        variant={index === 0 ? "primary" : "secondary"}
                        className="text-xs font-bold"
                      >
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Card Image */}
                    <div className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getCardArtUrl({ key: upgrade.cardKey, image: upgrade.cardKey })}
                        alt={upgrade.cardName}
                        className="size-12 rounded-lg object-cover"
                      />
                    </div>

                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">
                        {upgrade.cardName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRarityColor(upgrade.rarity)}`}
                        >
                          {upgrade.rarity}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          Level {upgrade.currentLevel} → {upgrade.targetLevel}
                        </span>
                      </div>
                    </div>

                    {/* Costs */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-accent">
                        {formatGold(upgrade.goldNeeded)} 💰
                      </p>
                      <p className="text-xs text-text-muted">
                        {upgrade.cardsNeeded} cards
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="size-4 text-text-muted flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Total Cards Needed by Rarity */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-3">
              Cards Needed by Rarity
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(analysis.totalCards).map(([rarity, count]) => (
                <Card key={rarity} className="p-3 border-border/60 text-center">
                  <p
                    className={`text-xs font-medium mb-1 ${getRarityColor(rarity as any)}`}
                  >
                    {rarity}
                  </p>
                  <p className="text-2xl font-bold text-text">{count}</p>
                  <p className="text-xs text-text-muted">cards</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Tips */}
          <Card className="p-4 bg-surface-muted border-border/60">
            <h3 className="text-sm font-semibold text-text mb-2">💡 Tips</h3>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• Focus on upgrading your win conditions first</li>
              <li>• Common cards are easiest to max out</li>
              <li>• Join a clan for card donations</li>
              <li>• Complete daily quests for extra gold</li>
              <li>• Use tokens wisely on legendary/champion cards</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getRarityColor(
  rarity: "common" | "rare" | "epic" | "legendary" | "champion"
): string {
  switch (rarity) {
    case "common":
      return "text-gray-400";
    case "rare":
      return "text-orange-400";
    case "epic":
      return "text-purple-400";
    case "legendary":
      return "text-accent";
    case "champion":
      return "text-primary";
    default:
      return "text-text-muted";
  }
}
