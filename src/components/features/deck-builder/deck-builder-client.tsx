"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeckBuilder } from "@/components/features/deck-builder/deck-builder";

interface CardData {
  key: string;
  name: string;
  category: "win-condition" | "support" | "spell" | "building";
  elixir: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  owned?: boolean;
  level?: number;
}

export function DeckBuilderClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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
      
      // Success! Show feedback
      console.log("Deck saved successfully:", data.deck);
      alert("✅ Deck saved successfully!");
      
      // Optionally redirect to saved deck view
      // router.push(`/deck/${data.deck.slug}`);
    } catch (error) {
      console.error("Failed to save deck:", error);
      alert(`❌ ${error instanceof Error ? error.message : "Failed to save deck"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeDeck = async (cards: CardData[]) => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cards: cards.map(c => c.key),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze deck");
      }

      const data = await response.json();
      
      // Show analysis results
      console.log("Analysis complete:", data);
      alert("✅ Analysis complete! Check the console for results.");
      
      // TODO: Display analysis in UI (modal, expandable section, etc.)
    } catch (error) {
      console.error("Failed to analyze deck:", error);
      alert(`❌ ${error instanceof Error ? error.message : "Failed to analyze deck"}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DeckBuilder
      onSaveDeck={handleSaveDeck}
      onAnalyzeDeck={handleAnalyzeDeck}
    />
  );
}
