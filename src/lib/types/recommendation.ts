import type { DeckDefinition } from "@/lib/data/deck-catalog";

export interface RecommendationExplainer {
  summary: string;
  substitutions: { card: string; suggestion: string }[];
  matchupTips: { archetype: string; tip: string }[];
}

export interface RecommendationDeckResult {
  deck: DeckDefinition;
  score: number;
  breakdown: {
    collection: number;
    trophies: number;
    playstyle: number;
    difficulty: number;
  };
  notes: string[];
  explainer?: RecommendationExplainer;
}

export interface RecommendationScoreBreakdown {
  deck: string;
  total: number;
  breakdown: {
    collection: number;
    trophies: number;
    playstyle: number;
    difficulty: number;
  };
  notes: string[];
}
