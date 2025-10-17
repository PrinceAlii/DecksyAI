import { z } from "zod";

export const deckCardSchema = z
  .object({
    name: z.string().min(1),
    key: z.string().min(1),
    levelRequirement: z.number().int().nonnegative(),
    isChamp: z.boolean().optional(),
    image: z.string().min(1).optional(),
  })
  .strict();

export const deckDefinitionSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    archetype: z.enum(["beatdown", "control", "cycle", "siege", "spell", "tempo"]),
    trophyRange: z.tuple([z.number().int(), z.number().int()]),
    trophyBand: z.string().min(1),
    description: z.string().min(1),
    archetypeNotes: z.string().min(1),
    averageElixir: z.number().positive(),
    playstyles: z.array(z.enum(["aggro", "control", "bridge", "spell", "cycle"])).min(1),
    cards: z.array(deckCardSchema).min(1),
    strengths: z.array(z.string().min(1)).min(1),
    weaknesses: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const playerCollectionCardSchema = z
  .object({
    key: z.string().min(1),
    level: z.number().int().nonnegative(),
  })
  .strict();

export const playerProfileSchema = z
  .object({
    tag: z.string().min(1),
    name: z.string().min(1),
    trophies: z.number().int().nonnegative(),
    arena: z.string().min(1),
    collection: z.array(playerCollectionCardSchema),
  })
  .strict();

export const quizResponseSchema = z
  .object({
    preferredPace: z.enum(["aggro", "balanced", "control"]),
    comfortLevel: z.enum(["cycle", "bridge", "spell"]),
    riskTolerance: z.enum(["safe", "mid", "greedy"]),
  })
  .strict();

export const deckScoreBreakdownSchema = z
  .object({
    collection: z.number().int(),
    trophies: z.number().int(),
    playstyle: z.number().int(),
    difficulty: z.number().int(),
  })
  .strict();

export const explainerSchema = z
  .object({
    summary: z.string().min(1),
    substitutions: z
      .array(
        z
          .object({
            card: z.string().min(1),
            suggestion: z.string().min(1),
          })
          .strict(),
      )
      .optional(),
    matchupTips: z
      .array(
        z
          .object({
            archetype: z.string().min(1),
            tip: z.string().min(1),
          })
          .strict(),
      )
      .optional(),
    practicePlan: z
      .array(
        z
          .object({
            focus: z.string().min(1),
            drill: z.string().min(1),
            reps: z.string().min(1).optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export const deckScoreSchema = z
  .object({
    deck: deckDefinitionSchema,
    score: z.number().int(),
    breakdown: deckScoreBreakdownSchema,
    notes: z.array(z.string().min(1)),
    explainer: explainerSchema.optional(),
  })
  .strict();

export const recommendationPayloadSchema = z
  .object({
    player: playerProfileSchema,
    quiz: quizResponseSchema,
    userId: z.string().min(1).optional(),
    sessionId: z.string().uuid().optional(),
    feedbackPreferences: z
      .object({
        collectionWeight: z.number().optional(),
        trophiesWeight: z.number().optional(),
        playstyleWeight: z.number().optional(),
        difficultyWeight: z.number().optional(),
        preferArchetypes: z.array(z.enum(["beatdown", "control", "cycle", "siege", "spell", "tempo"])).optional(),
        avoidArchetypes: z.array(z.enum(["beatdown", "control", "cycle", "siege", "spell", "tempo"])).optional(),
      })
      .strict()
      .optional(),
    battleAggregate: z
      .object({
        totalBattles: z.number().int().nonnegative(),
        archetypeExposure: z.record(z.enum(["beatdown", "control", "cycle", "siege", "spell", "tempo"]), z.number()),
      })
      .strict()
      .optional(),
    weightVariantOverride: z.string().min(1).optional(),
  })
  .strict();

export const recommendationResponseSchema = z
  .object({
    sessionId: z.string().uuid(),
    results: z.array(deckScoreSchema),
  })
  .strict();

export const recommendationLookupSchema = z
  .object({
    sessionId: z.string().min(1),
  })
  .strict();

export const coachRequestSchema = recommendationPayloadSchema.extend({
  deckSlug: z.string().min(1).optional(),
});

export const coachScoreSchema = z
  .object({
    total: z.number().int(),
    breakdown: deckScoreBreakdownSchema,
    notes: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const coachResponseSchema = z
  .object({
    deck: deckDefinitionSchema,
    score: coachScoreSchema.optional(),
    explainer: explainerSchema.optional(),
    explainers: z.array(explainerSchema).optional(),
  })
  .strict();

export const feedbackRequestSchema = z
  .object({
    sessionId: z.string().min(1),
    rating: z.number().int().min(-1).max(1),
    notes: z.string().max(2000).optional(),
    channel: z.string().max(0).optional(),
  })
  .strict();

export const feedbackListQuerySchema = z
  .object({
    sessionId: z.string().min(1).optional(),
  })
  .strict();

export const playerTagParamSchema = z
  .object({
    tag: z.string().min(1),
  })
  .strict();

export const battleLogSchema = z
  .array(
    z
      .object({
        opponent: z.string().min(1),
        result: z.enum(["win", "loss", "draw"]),
        deck: z.array(z.string().min(1)),
        opponentDeck: z.array(z.string().min(1)),
        timestamp: z.string().min(1),
      })
      .strict(),
  );

export const errorResponseSchema = z
  .object({
    error: z.string().min(1),
    details: z.unknown().optional(),
  })
  .strict();

export type RecommendationPayloadInput = z.infer<typeof recommendationPayloadSchema>;
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
