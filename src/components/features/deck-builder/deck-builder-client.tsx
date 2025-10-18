"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { DeckBuilder } from "@/components/features/deck-builder/deck-builder";
import { AnalysisModal } from "@/components/features/deck-builder/analysis-modal";

interface CardData {
  key: string;
  name: string;
  category: "win-condition" | "support" | "spell" | "building";
  elixir: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  owned?: boolean;
  level?: number;
}

interface AnalysisData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  synergies: Array<{
    cards: string[];
    description: string;
  }>;
  suggestions: string[];
  rating: {
    overall: number;
    offense: number;
    defense: number;
    versatility: number;
  };
}

export function DeckBuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [loadedDeck, setLoadedDeck] = useState<{ name: string; cards: string[] } | null>(null);
  const [isLoadingDeck, setIsLoadingDeck] = useState(false);

  // Load deck from query parameter if provided
  useEffect(() => {
    const loadDeckParam = searchParams.get("loadDeck");
    if (loadDeckParam) {
      setIsLoadingDeck(true);
      fetch(`/api/deck/custom?id=${loadDeckParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.deck) {
            setLoadedDeck({ name: data.deck.name, cards: data.deck.cards });
            setCurrentDeckId(data.deck.id);
          }
        })
        .catch(err => {
          console.error("Failed to load deck:", err);
          alert("Failed to load deck");
        })
        .finally(() => {
          setIsLoadingDeck(false);
        });
    }
  }, [searchParams]);

  const handleSaveDeck = async (cards: CardData[], deckName: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/deck/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deckName,
          cards: cards.map(c => c.key),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save deck");
      }

      const data = await response.json();
      
      // Success! Show feedback and store deck ID
      setCurrentDeckId(data.deck.id);
      console.log("Deck saved successfully:", data.deck);
      alert("✅ Deck saved successfully!");
      
      // Optionally redirect to saved decks page
      // router.push("/account/decks");
    } catch (error) {
      console.error("Failed to save deck:", error);
      alert(`❌ ${error instanceof Error ? error.message : "Failed to save deck"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeDeck = async (cards: CardData[]) => {
    setAnalyzing(true);
    setShowAnalysisModal(true);
    setAnalysisData(null);
    
    try {
      const response = await fetch("/api/analyze/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cards: cards.map(c => c.key),
          deckId: currentDeckId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze deck");
      }

      const data = await response.json();
      
      // Store analysis and display in modal
      setAnalysisData(data.analysis);
      console.log("Analysis complete:", data.analysis);
    } catch (error) {
      console.error("Failed to analyze deck:", error);
      setShowAnalysisModal(false);
      alert(`❌ ${error instanceof Error ? error.message : "Failed to analyze deck"}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!currentDeckId || !analysisData) {
      alert("Please save your deck first before saving the analysis.");
      return;
    }

    try {
      const response = await fetch("/api/deck/custom", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentDeckId,
          aiAnalysis: analysisData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save analysis");
      }

      alert("✅ Analysis saved to your deck!");
      setShowAnalysisModal(false);
    } catch (error) {
      console.error("Failed to save analysis:", error);
      alert("❌ Failed to save analysis");
    }
  };

  return (
    <>
      {isLoadingDeck ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          Loading deck...
        </div>
      ) : (
        <DeckBuilder
          onSaveDeck={handleSaveDeck}
          onAnalyzeDeck={handleAnalyzeDeck}
          initialCards={loadedDeck?.cards}
          initialDeckName={loadedDeck?.name}
        />
      )}
      
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysis={analysisData}
        isLoading={analyzing}
        onSaveAnalysis={handleSaveAnalysis}
        canSave={!!currentDeckId}
      />
    </>
  );
}
