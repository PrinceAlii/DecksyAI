import { DeckDefinition } from "@/lib/data/deck-catalog";

export interface PlayerCollectionCard {
  key: string;
  level: number;
}

export interface PlayerProfile {
  tag: string;
  name: string;
  trophies: number;
  arena: string;
  collection: PlayerCollectionCard[];
}

export interface QuizResponse {
  preferredPace: "aggro" | "balanced" | "control";
  comfortLevel: "cycle" | "bridge" | "spell";
  riskTolerance: "safe" | "mid" | "greedy";
}

export interface DeckScore {
  deck: DeckDefinition;
  score: number;
  breakdown: {
    collection: number;
    trophies: number;
    playstyle: number;
    difficulty: number;
  };
  notes: string[];
}

export interface RecommendationPayload {
  player: PlayerProfile;
  quiz: QuizResponse;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreCollection(deck: DeckDefinition, player: PlayerProfile): { score: number; missingCards: string[] } {
  const collectionMap = new Map(player.collection.map((card) => [card.key, card.level]));
  let points = 0;
  const missingCards: string[] = [];

  for (const card of deck.cards) {
    const level = collectionMap.get(card.key);
    if (typeof level === "number" && level >= card.levelRequirement - 1) {
      points += 1;
    } else if (typeof level === "number") {
      points += 0.5;
      missingCards.push(`${card.name} (needs level ${card.levelRequirement})`);
    } else {
      missingCards.push(card.name);
    }
  }

  return {
    score: (points / deck.cards.length) * 100,
    missingCards,
  };
}

function scoreTrophies(deck: DeckDefinition, player: PlayerProfile): number {
  const [min, max] = deck.trophyRange;
  if (player.trophies >= min && player.trophies <= max) {
    return 100;
  }

  const distance = player.trophies < min ? min - player.trophies : player.trophies - max;
  const penalty = clamp(distance / 400, 0, 1);
  return (1 - penalty) * 100;
}

function scorePlaystyle(deck: DeckDefinition, quiz: QuizResponse): number {
  const mapping: Record<QuizResponse["preferredPace"], DeckDefinition["playstyles"][number]> = {
    aggro: "aggro",
    balanced: "bridge",
    control: "control",
  };

  const comfortMatch = deck.playstyles.includes(quiz.comfortLevel as DeckDefinition["playstyles"][number]);
  const paceMatch = deck.playstyles.includes(mapping[quiz.preferredPace]);
  const riskMatch =
    (quiz.riskTolerance === "safe" && deck.archetype === "control") ||
    (quiz.riskTolerance === "greedy" && deck.archetype === "beatdown") ||
    quiz.riskTolerance === "mid";

  return clamp((paceMatch ? 40 : 0) + (comfortMatch ? 40 : 0) + (riskMatch ? 20 : 0), 0, 100);
}

function scoreDifficulty(deck: DeckDefinition, quiz: QuizResponse): number {
  const difficultyByArchetype: Record<DeckDefinition["archetype"], number> = {
    beatdown: 60,
    control: 70,
    cycle: 80,
    siege: 90,
    spell: 75,
    tempo: 65,
  };

  const targetDifficulty = quiz.riskTolerance === "safe" ? 60 : quiz.riskTolerance === "mid" ? 75 : 90;
  const difficulty = difficultyByArchetype[deck.archetype];
  const difference = Math.abs(difficulty - targetDifficulty);

  return clamp(100 - difference, 40, 100);
}

export function scoreDeck(deck: DeckDefinition, payload: RecommendationPayload): DeckScore {
  const collection = scoreCollection(deck, payload.player);
  const trophies = scoreTrophies(deck, payload.player);
  const playstyle = scorePlaystyle(deck, payload.quiz);
  const difficulty = scoreDifficulty(deck, payload.quiz);

  const weightedScore = clamp(
    collection.score * 0.4 + trophies * 0.2 + playstyle * 0.3 + difficulty * 0.1,
    0,
    100,
  );

  const notes: string[] = [];
  if (collection.missingCards.length > 0) {
    notes.push(`Consider upgrading or substituting: ${collection.missingCards.join(", ")}.`);
  }
  if (trophies < 60) {
    notes.push("Deck is outside your current trophy comfort zone.");
  }
  if (playstyle < 50) {
    notes.push("Playstyle alignment is limited; expect a learning curve.");
  }

  return {
    deck,
    score: Math.round(weightedScore),
    breakdown: {
      collection: Math.round(collection.score),
      trophies: Math.round(trophies),
      playstyle: Math.round(playstyle),
      difficulty: Math.round(difficulty),
    },
    notes,
  };
}

export function rankDecks(decks: DeckDefinition[], payload: RecommendationPayload): DeckScore[] {
  return decks
    .map((deck) => scoreDeck(deck, payload))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
