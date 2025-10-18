import type { BattleArchetypeAggregate, DeckArchetype } from "@/lib/clash-royale";
import { DeckDefinition } from "@/lib/data/deck-catalog";
import { trackAnalytics } from "@/lib/analytics";
import { assignExperimentVariant } from "@/lib/feature-flags";

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
  preferences?: string;
  userId?: string;
  sessionId?: string;
  feedbackPreferences?: FeedbackPreferences;
  battleAggregate?: BattleArchetypeAggregate;
  weightVariantOverride?: string;
}

export interface FeedbackPreferences {
  collectionWeight?: number;
  trophiesWeight?: number;
  playstyleWeight?: number;
  difficultyWeight?: number;
  preferArchetypes?: DeckArchetype[];
  avoidArchetypes?: DeckArchetype[];
}

export interface WeightVector {
  collection: number;
  trophies: number;
  playstyle: number;
  difficulty: number;
}

export interface WeightStrategy {
  weights: WeightVector;
  variant: string;
  defaultVariant: string;
  assignmentReason: "override" | "rollout";
}

const BASE_WEIGHTS: WeightVector = {
  collection: 0.4,
  trophies: 0.2,
  playstyle: 0.3,
  difficulty: 0.1,
};

const MIN_WEIGHT = 0.05;

function normaliseWeights(weights: WeightVector): WeightVector {
  const total = weights.collection + weights.trophies + weights.playstyle + weights.difficulty;
  if (total <= 0) {
    return { ...BASE_WEIGHTS };
  }
  const normalised = {
    collection: weights.collection / total,
    trophies: weights.trophies / total,
    playstyle: weights.playstyle / total,
    difficulty: weights.difficulty / total,
  } satisfies WeightVector;

  const result: WeightVector = { collection: 0, trophies: 0, playstyle: 0, difficulty: 0 };
  let remaining = 1;
  const adjustableKeys: Array<keyof WeightVector> = [];

  for (const key of Object.keys(normalised) as Array<keyof WeightVector>) {
    if (normalised[key] < MIN_WEIGHT) {
      result[key] = MIN_WEIGHT;
      remaining -= MIN_WEIGHT;
    } else {
      adjustableKeys.push(key);
    }
  }

  const adjustableTotal = adjustableKeys.reduce((sum, key) => sum + normalised[key], 0);
  const safeRemaining = Math.max(remaining, 0);

  for (const key of adjustableKeys) {
    if (adjustableTotal === 0) {
      result[key] = safeRemaining / adjustableKeys.length;
    } else {
      result[key] = (normalised[key] / adjustableTotal) * safeRemaining;
    }
  }

  return result;
}

function applyFeedbackPreferenceWeights(weights: WeightVector, preferences?: FeedbackPreferences): WeightVector {
  if (!preferences) {
    return weights;
  }

  const overridden: WeightVector = {
    collection: preferences.collectionWeight ?? weights.collection,
    trophies: preferences.trophiesWeight ?? weights.trophies,
    playstyle: preferences.playstyleWeight ?? weights.playstyle,
    difficulty: preferences.difficultyWeight ?? weights.difficulty,
  };

  return normaliseWeights(overridden);
}

const exposureAdjustments: Record<DeckArchetype, Partial<WeightVector>> = {
  beatdown: { playstyle: 0.05, difficulty: 0.05 },
  control: { collection: 0.05, playstyle: 0.05 },
  cycle: { difficulty: 0.05, trophies: 0.05 },
  siege: { playstyle: 0.05, collection: 0.05 },
  spell: { collection: 0.05, difficulty: 0.05 },
  tempo: { playstyle: 0.05, trophies: 0.05 },
};

function applyExposureWeights(
  weights: WeightVector,
  aggregate?: BattleArchetypeAggregate,
  intensity = 1,
): WeightVector {
  if (!aggregate || aggregate.totalBattles === 0) {
    return weights;
  }

  const adjusted: WeightVector = { ...weights };

  for (const [archetypeKey, count] of Object.entries(aggregate.archetypeExposure)) {
    const archetype = archetypeKey as DeckArchetype;
    const exposure = typeof count === "number" ? count : 0;
    if (exposure <= 0) {
      continue;
    }

    const ratio = exposure / aggregate.totalBattles;
    const modifiers = exposureAdjustments[archetype];
    if (!modifiers) {
      continue;
    }

    for (const [category, value] of Object.entries(modifiers)) {
      const key = category as keyof WeightVector;
      const delta = (value ?? 0) * ratio * intensity;
      adjusted[key] = Math.max(MIN_WEIGHT, adjusted[key] + delta);
    }
  }

  return normaliseWeights(adjusted);
}

const archetypeCounterMatrix: Record<DeckArchetype, DeckArchetype[]> = {
  beatdown: ["control", "cycle"],
  control: ["beatdown", "tempo"],
  cycle: ["beatdown", "spell"],
  siege: ["beatdown", "tempo"],
  spell: ["control", "cycle"],
  tempo: ["control", "cycle"],
};

function calculateMetaAlignmentBonus(
  deck: DeckDefinition,
  preferences?: FeedbackPreferences,
  aggregate?: BattleArchetypeAggregate,
): number {
  let bonus = 0;

  if (preferences) {
    if (preferences.preferArchetypes?.includes(deck.archetype)) {
      bonus += 5;
    }
    if (preferences.avoidArchetypes?.includes(deck.archetype)) {
      bonus -= 5;
    }
  }

  if (aggregate && aggregate.totalBattles > 0) {
    let counterRatio = 0;
    for (const [archetypeKey, count] of Object.entries(aggregate.archetypeExposure)) {
      const archetype = archetypeKey as DeckArchetype;
      const exposure = typeof count === "number" ? count : 0;
      if (exposure <= 0) {
        continue;
      }

      const ratio = exposure / aggregate.totalBattles;
      const counters = archetypeCounterMatrix[archetype] ?? [];

      if (counters.includes(deck.archetype)) {
        counterRatio += ratio;
      } else if (deck.archetype === archetype) {
        counterRatio -= ratio * 0.5;
      }
    }

    if (counterRatio !== 0) {
      bonus += clamp(counterRatio * 15, -8, 8);
    }
  }

  return bonus;
}

export function resolveWeightStrategy(payload: RecommendationPayload): WeightStrategy {
  const assignment = assignExperimentVariant("deck-weighting", {
    userId: payload.userId,
    playerTag: payload.player?.tag,
    sessionId: payload.sessionId,
    overrideVariant: payload.weightVariantOverride,
  });

  const intensity = assignment.variant === "meta-aware" ? 1.5 : 1;

  let weights = normaliseWeights({ ...BASE_WEIGHTS });
  weights = applyFeedbackPreferenceWeights(weights, payload.feedbackPreferences);
  weights = applyExposureWeights(weights, payload.battleAggregate, intensity);

  return {
    weights,
    variant: assignment.variant,
    defaultVariant: assignment.descriptor.defaultVariant,
    assignmentReason: assignment.reason,
  };
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

export function scoreDeck(
  deck: DeckDefinition,
  payload: RecommendationPayload,
  strategy?: WeightStrategy,
): DeckScore {
  const collection = scoreCollection(deck, payload.player);
  const trophies = scoreTrophies(deck, payload.player);
  const playstyle = scorePlaystyle(deck, payload.quiz);
  const difficulty = scoreDifficulty(deck, payload.quiz);

  const activeStrategy = strategy ?? resolveWeightStrategy(payload);

  const weightedScore = clamp(
    collection.score * activeStrategy.weights.collection +
      trophies * activeStrategy.weights.trophies +
      playstyle * activeStrategy.weights.playstyle +
      difficulty * activeStrategy.weights.difficulty,
    0,
    100,
  );

  const metaBonus = calculateMetaAlignmentBonus(deck, payload.feedbackPreferences, payload.battleAggregate);
  const finalScore = clamp(weightedScore + metaBonus, 0, 100);

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
  if (payload.battleAggregate && payload.battleAggregate.totalBattles > 0) {
    const exposures = Object.entries(payload.battleAggregate.archetypeExposure)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));

    if (exposures.length > 0) {
      const [topArchetype, count] = exposures[0];
      const ratio = payload.battleAggregate.totalBattles
        ? ((Number(count) ?? 0) / payload.battleAggregate.totalBattles) * 100
        : 0;
      notes.push(`Recent opponents leaned into ${topArchetype} archetypes (~${Math.round(ratio)}%).`);
    }
  }

  if (metaBonus > 1) {
    notes.push(`Meta alignment bonus applied (+${Math.round(metaBonus)}).`);
  } else if (metaBonus < -1) {
    notes.push(`Meta alignment penalty applied (${Math.round(metaBonus)}).`);
  }

  if (activeStrategy.variant !== activeStrategy.defaultVariant) {
    notes.push(`Weight variant: ${activeStrategy.variant} (${activeStrategy.assignmentReason}).`);
  }

  return {
    deck,
    score: Math.round(finalScore),
    breakdown: {
      collection: Math.round(collection.score),
      trophies: Math.round(trophies),
      playstyle: Math.round(playstyle),
      difficulty: Math.round(difficulty),
    },
    notes,
  };
}

function filterDecksByPreferences(decks: DeckDefinition[], preferences?: string): DeckDefinition[] {
  if (!preferences?.trim()) {
    return decks;
  }

  const lowerPrefs = preferences.toLowerCase();
  
  // Extract keywords and negative keywords
  const hasLogbait = lowerPrefs.includes('logbait') || lowerPrefs.includes('log bait');
  const hasBalloon = lowerPrefs.includes('balloon') || lowerPrefs.includes('loon');
  const hasHog = lowerPrefs.includes('hog');
  const hasGraveyard = lowerPrefs.includes('graveyard') || lowerPrefs.includes('gy');
  const hasMiner = lowerPrefs.includes('miner');
  const hasXbow = lowerPrefs.includes('xbow') || lowerPrefs.includes('x-bow');
  const hasMortar = lowerPrefs.includes('mortar');
  const hasGolem = lowerPrefs.includes('golem');
  const hasGiant = lowerPrefs.includes('giant');
  const hasPekka = lowerPrefs.includes('pekka');
  const hasMegaKnight = lowerPrefs.includes('mega knight') || lowerPrefs.includes('mk');
  
  // Check for "no X" patterns
  const noBalloon = lowerPrefs.match(/\bno\s+(?:balloon|loon)/i);
  const noHog = lowerPrefs.match(/\bno\s+hog/i);
  const noGraveyard = lowerPrefs.match(/\bno\s+(?:graveyard|gy)/i);
  const noMiner = lowerPrefs.match(/\bno\s+miner/i);
  const noXbow = lowerPrefs.match(/\bno\s+(?:xbow|x-bow)/i);
  const noMortar = lowerPrefs.match(/\bno\s+mortar/i);
  const noGolem = lowerPrefs.match(/\bno\s+golem/i);
  const noGiant = lowerPrefs.match(/\bno\s+giant/i);
  const noPekka = lowerPrefs.match(/\bno\s+pekka/i);
  const noMegaKnight = lowerPrefs.match(/\bno\s+(?:mega\s+knight|mk)/i);

  return decks.filter((deck) => {
    const deckNameLower = deck.name.toLowerCase();
    const deckCards = deck.cards.map(c => c.name.toLowerCase());
    const deckHasCard = (cardName: string) => deckCards.some(c => c.includes(cardName));
    
    // Apply negative filters first (exclusions)
    if (noBalloon && deckHasCard('balloon')) return false;
    if (noHog && deckHasCard('hog')) return false;
    if (noGraveyard && deckHasCard('graveyard')) return false;
    if (noMiner && deckHasCard('miner')) return false;
    if (noXbow && deckHasCard('x-bow')) return false;
    if (noMortar && deckHasCard('mortar')) return false;
    if (noGolem && deckHasCard('golem')) return false;
    if (noGiant && deckHasCard('giant')) return false;
    if (noPekka && deckHasCard('pekka')) return false;
    if (noMegaKnight && deckHasCard('mega knight')) return false;
    
    // Apply positive filters (requirements)
    if (hasLogbait && (deckNameLower.includes('bait') || deckHasCard('goblin barrel'))) return true;
    if (hasBalloon && deckHasCard('balloon')) return true;
    if (hasHog && deckHasCard('hog')) return true;
    if (hasGraveyard && deckHasCard('graveyard')) return true;
    if (hasMiner && deckHasCard('miner')) return true;
    if (hasXbow && deckHasCard('x-bow')) return true;
    if (hasMortar && deckHasCard('mortar')) return true;
    if (hasGolem && deckHasCard('golem')) return true;
    if (hasGiant && deckHasCard('giant')) return true;
    if (hasPekka && deckHasCard('pekka')) return true;
    if (hasMegaKnight && deckHasCard('mega knight')) return true;
    
    // If no positive filters matched but there were positive keywords, exclude this deck
    const hasAnyPositiveFilter = hasLogbait || hasBalloon || hasHog || hasGraveyard || 
                                  hasMiner || hasXbow || hasMortar || hasGolem || 
                                  hasGiant || hasPekka || hasMegaKnight;
    
    return !hasAnyPositiveFilter;
  });
}

export function rankDecks(decks: DeckDefinition[], payload: RecommendationPayload): DeckScore[] {
  const strategy = resolveWeightStrategy(payload);

  if (strategy.variant !== strategy.defaultVariant) {
    trackAnalytics({
      name: "experiment_assignment",
      properties: {
        experiment: "deck-weighting",
        variant: strategy.variant,
        reason: strategy.assignmentReason,
        userId: payload.userId ?? null,
        playerTag: payload.player?.tag ?? null,
      },
    });
  }

  // Filter decks based on user preferences
  const filteredDecks = filterDecksByPreferences(decks, payload.preferences);
  
  // If filtering resulted in no decks, fall back to all decks
  const decksToScore = filteredDecks.length > 0 ? filteredDecks : decks;

  const scores = decksToScore.map((deck) => scoreDeck(deck, payload, strategy)).sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 3);

  if (strategy.variant !== strategy.defaultVariant) {
    trackAnalytics({
      name: "experiment_exposure",
      properties: {
        experiment: "deck-weighting",
        variant: strategy.variant,
        topDecks: top.map((entry) => entry.deck.slug),
        userId: payload.userId ?? null,
        playerTag: payload.player?.tag ?? null,
      },
    });
  }

  return top;
}
