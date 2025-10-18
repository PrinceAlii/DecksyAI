"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Sparkles, Trash2, Save, Share2, TrendingUp, Search, Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCardArtUrl, CARD_ART_PLACEHOLDER } from "@/lib/data/card-art";
import { normalizePlayerTag } from "@/lib/player-tag";

interface CardData {
  key: string;
  name: string;
  category: "win-condition" | "support" | "spell" | "building";
  elixir: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  owned?: boolean;
  level?: number;
}

interface DeckBuilderProps {
  playerCards?: CardData[];
  showOnlyOwned?: boolean;
  onSaveDeck?: (cards: CardData[], deckName: string) => void;
  onAnalyzeDeck?: (cards: CardData[]) => void;
}

const CARD_CATEGORIES = [
  { id: "win-condition", label: "Win Conditions", description: "Primary damage dealers" },
  { id: "support", label: "Support Troops", description: "Defensive and offensive support" },
  { id: "spell", label: "Spells", description: "Direct damage and control" },
  { id: "building", label: "Buildings", description: "Defensive structures" },
] as const;

// Sample card data - in production, this would come from your API
const ALL_CARDS: CardData[] = [
  // Win Conditions
  { key: "hog_rider", name: "Hog Rider", category: "win-condition", elixir: 4, rarity: "rare" },
  { key: "giant", name: "Giant", category: "win-condition", elixir: 5, rarity: "rare" },
  { key: "royal_giant", name: "Royal Giant", category: "win-condition", elixir: 6, rarity: "common" },
  { key: "goblin_barrel", name: "Goblin Barrel", category: "win-condition", elixir: 3, rarity: "epic" },
  { key: "miner", name: "Miner", category: "win-condition", elixir: 3, rarity: "legendary" },
  { key: "graveyard", name: "Graveyard", category: "win-condition", elixir: 5, rarity: "legendary" },
  { key: "x_bow", name: "X-Bow", category: "win-condition", elixir: 6, rarity: "epic" },
  { key: "mortar", name: "Mortar", category: "win-condition", elixir: 4, rarity: "common" },
  { key: "balloon", name: "Balloon", category: "win-condition", elixir: 5, rarity: "epic" },
  { key: "pekka", name: "P.E.K.K.A", category: "win-condition", elixir: 7, rarity: "epic" },
  { key: "golem", name: "Golem", category: "win-condition", elixir: 8, rarity: "epic" },
  { key: "lava_hound", name: "Lava Hound", category: "win-condition", elixir: 7, rarity: "legendary" },
  { key: "battle_ram", name: "Battle Ram", category: "win-condition", elixir: 4, rarity: "rare" },
  { key: "ram_rider", name: "Ram Rider", category: "win-condition", elixir: 5, rarity: "legendary" },
  { key: "royal_hogs", name: "Royal Hogs", category: "win-condition", elixir: 5, rarity: "rare" },
  { key: "wall_breakers", name: "Wall Breakers", category: "win-condition", elixir: 2, rarity: "epic" },
  { key: "goblin_drill", name: "Goblin Drill", category: "win-condition", elixir: 4, rarity: "epic" },
  { key: "electro_giant", name: "Electro Giant", category: "win-condition", elixir: 7, rarity: "epic" },
  
  // Support Troops
  { key: "knight", name: "Knight", category: "support", elixir: 3, rarity: "common" },
  { key: "musketeer", name: "Musketeer", category: "support", elixir: 4, rarity: "rare" },
  { key: "valkyrie", name: "Valkyrie", category: "support", elixir: 4, rarity: "rare" },
  { key: "mega_minion", name: "Mega Minion", category: "support", elixir: 3, rarity: "rare" },
  { key: "ice_golem", name: "Ice Golem", category: "support", elixir: 2, rarity: "rare" },
  { key: "skeletons", name: "Skeletons", category: "support", elixir: 1, rarity: "common" },
  { key: "bats", name: "Bats", category: "support", elixir: 2, rarity: "common" },
  { key: "ice_spirit", name: "Ice Spirit", category: "support", elixir: 1, rarity: "common" },
  { key: "electro_spirit", name: "Electro Spirit", category: "support", elixir: 1, rarity: "common" },
  { key: "fire_spirit", name: "Fire Spirit", category: "support", elixir: 1, rarity: "common" },
  { key: "archers", name: "Archers", category: "support", elixir: 3, rarity: "common" },
  { key: "goblin_gang", name: "Goblin Gang", category: "support", elixir: 3, rarity: "common" },
  { key: "baby_dragon", name: "Baby Dragon", category: "support", elixir: 4, rarity: "epic" },
  { key: "electro_wizard", name: "Electro Wizard", category: "support", elixir: 4, rarity: "legendary" },
  { key: "ice_wizard", name: "Ice Wizard", category: "support", elixir: 3, rarity: "legendary" },
  { key: "princess", name: "Princess", category: "support", elixir: 3, rarity: "legendary" },
  { key: "bandit", name: "Bandit", category: "support", elixir: 3, rarity: "legendary" },
  { key: "royal_ghost", name: "Royal Ghost", category: "support", elixir: 3, rarity: "legendary" },
  { key: "magic_archer", name: "Magic Archer", category: "support", elixir: 4, rarity: "legendary" },
  { key: "dark_prince", name: "Dark Prince", category: "support", elixir: 4, rarity: "epic" },
  { key: "prince", name: "Prince", category: "support", elixir: 5, rarity: "epic" },
  { key: "guards", name: "Guards", category: "support", elixir: 3, rarity: "epic" },
  { key: "minions", name: "Minions", category: "support", elixir: 3, rarity: "common" },
  { key: "firecracker", name: "Firecracker", category: "support", elixir: 3, rarity: "common" },
  { key: "hunter", name: "Hunter", category: "support", elixir: 4, rarity: "epic" },
  { key: "fisherman", name: "Fisherman", category: "support", elixir: 3, rarity: "legendary" },
  { key: "mother_witch", name: "Mother Witch", category: "support", elixir: 4, rarity: "legendary" },
  { key: "phoenix", name: "Phoenix", category: "support", elixir: 4, rarity: "legendary" },
  { key: "night_witch", name: "Night Witch", category: "support", elixir: 4, rarity: "legendary" },
  { key: "lumberjack", name: "Lumberjack", category: "support", elixir: 4, rarity: "legendary" },
  { key: "inferno_dragon", name: "Inferno Dragon", category: "support", elixir: 4, rarity: "legendary" },
  { key: "sparky", name: "Sparky", category: "support", elixir: 6, rarity: "legendary" },
  { key: "mega_knight", name: "Mega Knight", category: "support", elixir: 7, rarity: "legendary" },
  
  // Champions
  { key: "golden_knight", name: "Golden Knight", category: "support", elixir: 4, rarity: "champion" },
  { key: "archer_queen", name: "Archer Queen", category: "support", elixir: 5, rarity: "champion" },
  { key: "skeleton_king", name: "Skeleton King", category: "support", elixir: 4, rarity: "champion" },
  { key: "mighty_miner", name: "Mighty Miner", category: "support", elixir: 4, rarity: "champion" },
  { key: "monk", name: "Monk", category: "support", elixir: 5, rarity: "champion" },
  { key: "little_prince", name: "Little Prince", category: "support", elixir: 3, rarity: "champion" },
  
  // Spells
  { key: "zap", name: "Zap", category: "spell", elixir: 2, rarity: "common" },
  { key: "log", name: "The Log", category: "spell", elixir: 2, rarity: "legendary" },
  { key: "fireball", name: "Fireball", category: "spell", elixir: 4, rarity: "rare" },
  { key: "poison", name: "Poison", category: "spell", elixir: 4, rarity: "epic" },
  { key: "arrows", name: "Arrows", category: "spell", elixir: 3, rarity: "common" },
  { key: "lightning", name: "Lightning", category: "spell", elixir: 6, rarity: "epic" },
  { key: "rocket", name: "Rocket", category: "spell", elixir: 6, rarity: "rare" },
  { key: "freeze", name: "Freeze", category: "spell", elixir: 4, rarity: "epic" },
  { key: "tornado", name: "Tornado", category: "spell", elixir: 3, rarity: "epic" },
  { key: "snowball", name: "Giant Snowball", category: "spell", elixir: 2, rarity: "common" },
  { key: "barbarian_barrel", name: "Barbarian Barrel", category: "spell", elixir: 2, rarity: "epic" },
  { key: "earthquake", name: "Earthquake", category: "spell", elixir: 3, rarity: "rare" },
  { key: "rage", name: "Rage", category: "spell", elixir: 2, rarity: "epic" },
  
  // Buildings
  { key: "cannon", name: "Cannon", category: "building", elixir: 3, rarity: "common" },
  { key: "tesla", name: "Tesla", category: "building", elixir: 4, rarity: "common" },
  { key: "inferno_tower", name: "Inferno Tower", category: "building", elixir: 5, rarity: "rare" },
  { key: "tombstone", name: "Tombstone", category: "building", elixir: 3, rarity: "rare" },
  { key: "goblin_cage", name: "Goblin Cage", category: "building", elixir: 4, rarity: "rare" },
  { key: "bomb_tower", name: "Bomb Tower", category: "building", elixir: 4, rarity: "rare" },
  { key: "furnace", name: "Furnace", category: "building", elixir: 4, rarity: "rare" },
  { key: "elixir_collector", name: "Elixir Collector", category: "building", elixir: 6, rarity: "rare" },
  { key: "cannon_cart", name: "Cannon Cart", category: "building", elixir: 5, rarity: "epic" },
];

export function DeckBuilder({ playerCards, showOnlyOwned = false, onSaveDeck, onAnalyzeDeck }: DeckBuilderProps) {
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showOwnedOnly, setShowOwnedOnly] = useState(showOnlyOwned);
  const [playerTag, setPlayerTag] = useState("");
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [loadedPlayerData, setLoadedPlayerData] = useState<CardData[] | null>(null);
  const [deckName, setDeckName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Merge player card data with all cards
  const availableCards = useMemo(() => {
    const cardsToMerge = loadedPlayerData || playerCards;
    if (!cardsToMerge || cardsToMerge.length === 0) return ALL_CARDS;
    
    return ALL_CARDS.map(card => {
      const playerCard = cardsToMerge.find(pc => pc.key === card.key);
      return playerCard ? { ...card, owned: true, level: playerCard.level } : card;
    });
  }, [playerCards, loadedPlayerData]);

  // Filter cards based on category and ownership
  const filteredCards = useMemo(() => {
    let cards = availableCards;
    
    if (filterCategory) {
      cards = cards.filter(card => card.category === filterCategory);
    }
    
    if (showOwnedOnly) {
      cards = cards.filter(card => card.owned);
    }
    
    return cards;
  }, [availableCards, filterCategory, showOwnedOnly]);

  // Calculate deck stats
  const deckStats = useMemo(() => {
    if (selectedCards.length === 0) {
      return { avgElixir: 0, total: 0 };
    }
    
    const totalElixir = selectedCards.reduce((sum, card) => sum + card.elixir, 0);
    return {
      avgElixir: totalElixir / selectedCards.length,
      total: selectedCards.length,
    };
  }, [selectedCards]);

  const handleCardClick = (card: CardData) => {
    if (selectedCards.find(c => c.key === card.key)) {
      // Remove card
      setSelectedCards(selectedCards.filter(c => c.key !== card.key));
    } else {
      // Add card (max 8)
      if (selectedCards.length < 8) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const handleClearDeck = () => {
    setSelectedCards([]);
  };

  const handleSaveDeck = () => {
    if (selectedCards.length === 8) {
      setShowSaveDialog(true);
    }
  };

  const handleConfirmSave = () => {
    if (onSaveDeck && selectedCards.length === 8 && deckName.trim()) {
      onSaveDeck(selectedCards, deckName.trim());
      setShowSaveDialog(false);
      setDeckName("");
    }
  };

  const handleLoadPlayer = async () => {
    if (!playerTag.trim()) {
      setPlayerError("Please enter a player tag");
      return;
    }

    setLoadingPlayer(true);
    setPlayerError(null);

    try {
      const normalizedTag = normalizePlayerTag(playerTag);
      const response = await fetch(`/api/player?tag=${encodeURIComponent(normalizedTag)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to load player data");
      }

      const data = await response.json();
      
      // Transform player cards to CardData format
      const playerCardsData: CardData[] = data.cards
        .map((card: any) => {
          const cardKey = card.name.toLowerCase().replace(/[.\s]/g, "_");
          const cardData = ALL_CARDS.find(c => c.key === cardKey);
          
          if (!cardData) return null;
          
          return {
            ...cardData,
            owned: true,
            level: card.level,
          };
        })
        .filter(Boolean);

      setLoadedPlayerData(playerCardsData);
      setPlayerError(null);
    } catch (error) {
      setPlayerError(error instanceof Error ? error.message : "Failed to load player data");
      setLoadedPlayerData(null);
    } finally {
      setLoadingPlayer(false);
    }
  };

  const handleAnalyze = () => {
    if (onAnalyzeDeck && selectedCards.length === 8) {
      onAnalyzeDeck(selectedCards);
    }
  };

  const isCardSelected = (cardKey: string) => {
    return selectedCards.some(c => c.key === cardKey);
  };

  const canAddMoreCards = selectedCards.length < 8;
  const deckComplete = selectedCards.length === 8;

  return (
    <div className="flex flex-col gap-6">
      {/* Player Tag Input */}
      <Card className="border-border/60 bg-surface/80">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <User className="size-5 text-primary" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text">Load Your Cards</h3>
              <p className="text-sm text-text-muted">
                Enter your player tag to load your card collection
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <Input
              placeholder="#ABC123"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadPlayer()}
              className="flex-1"
              disabled={loadingPlayer}
            />
            <Button
              onClick={handleLoadPlayer}
              disabled={loadingPlayer || !playerTag.trim()}
              className="gap-2"
            >
              {loadingPlayer ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Load Cards
                </>
              )}
            </Button>
          </div>

          {playerError && (
            <p className="mt-2 text-sm text-red-400">{playerError}</p>
          )}

          {loadedPlayerData && (
            <div className="mt-3 flex items-center gap-2 text-sm text-accent">
              <Badge variant="primary">✓</Badge>
              <span>Loaded {loadedPlayerData.length} cards from your collection</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Dialog */}
      {showSaveDialog && (
        <Card className="border-primary/60 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-text mb-4">Save Your Deck</h3>
            <Input
              placeholder="Enter deck name (e.g., 'My Hog Cycle')"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmSave()}
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleConfirmSave}
                disabled={!deckName.trim()}
                className="flex-1"
              >
                Save Deck
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setDeckName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deck Display Area */}
      <Card className="border-border/60 bg-surface/80">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text">Your Deck</h2>
              <p className="text-sm text-text-muted">
                {selectedCards.length}/8 cards • {deckStats.avgElixir.toFixed(1)} avg elixir
              </p>
            </div>
            <div className="flex gap-2">
              {selectedCards.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearDeck} className="gap-2">
                  <Trash2 className="size-4" />
                  Clear
                </Button>
              )}
              {deckComplete && onAnalyzeDeck && (
                <Button variant="outline" size="sm" onClick={handleAnalyze} className="gap-2">
                  <Sparkles className="size-4" />
                  Analyze
                </Button>
              )}
              {deckComplete && (
                <Button variant="primary" size="sm" onClick={handleSaveDeck} className="gap-2">
                  <Save className="size-4" />
                  Save Deck
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 min-h-[140px]">
            {selectedCards.map((card) => (
              <div
                key={card.key}
                className="relative flex flex-col items-center gap-2 rounded-lg border border-primary/60 bg-primary/10 p-3 cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition"
                onClick={() => handleCardClick(card)}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border/40 bg-surface">
                  <Image
                    src={getCardArtUrl(card)}
                    alt={card.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-xs font-medium text-text text-center line-clamp-1">{card.name}</p>
                <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                  {card.elixir}
                </Badge>
              </div>
            ))}
            {Array.from({ length: 8 - selectedCards.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/40 bg-background/50 p-3 min-h-[140px]"
              >
                <p className="text-xs text-text-muted">Empty slot</p>
              </div>
            ))}
          </div>

          {!deckComplete && selectedCards.length > 0 && (
            <p className="mt-4 text-sm text-accent">
              Add {8 - selectedCards.length} more {selectedCards.length === 7 ? "card" : "cards"} to complete your deck
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-border/60 bg-surface/80">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterCategory === null ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(null)}
              >
                All Cards
              </Button>
              {CARD_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={filterCategory === category.id ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {playerCards && playerCards.length > 0 && (
              <Button
                variant={showOwnedOnly ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowOwnedOnly(!showOwnedOnly)}
              >
                {showOwnedOnly ? "Showing Owned" : "Show All"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card Grid */}
      <Card className="border-border/60 bg-surface/80">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text">
              {filterCategory
                ? CARD_CATEGORIES.find(c => c.id === filterCategory)?.label
                : "All Cards"}
            </h3>
            <p className="text-sm text-text-muted">
              {filteredCards.length} cards available
            </p>
          </div>

          <div className="grid grid-cols-6 gap-3 md:grid-cols-8 lg:grid-cols-10">
            {filteredCards.map((card) => {
              const selected = isCardSelected(card.key);
              const disabled = !canAddMoreCards && !selected;

              return (
                <div
                  key={card.key}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-lg border p-2 cursor-pointer transition",
                    selected
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : disabled
                      ? "border-border/40 bg-background/50 opacity-50 cursor-not-allowed"
                      : "border-border/60 bg-background/80 hover:border-primary/60 hover:shadow-md hover:shadow-primary/10",
                    !card.owned && "opacity-60"
                  )}
                  onClick={() => !disabled && handleCardClick(card)}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border/40 bg-surface">
                    <Image
                      src={getCardArtUrl(card)}
                      alt={card.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  
                  <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                    {card.elixir}
                  </Badge>

                  {card.owned && card.level && (
                    <Badge variant="outline" className="absolute top-1 left-1 text-xs">
                      {card.level}
                    </Badge>
                  )}

                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg">
                      <Badge variant="primary" className="text-xs">
                        ✓
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions (placeholder) */}
      {selectedCards.length > 0 && selectedCards.length < 8 && (
        <Card className="border-accent/60 bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-accent mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-text">AI Suggestions</h3>
                <p className="text-sm text-text-muted mt-1">
                  Based on your selected cards, we recommend adding: Fireball, Musketeer, or Ice Spirit to balance your deck.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
