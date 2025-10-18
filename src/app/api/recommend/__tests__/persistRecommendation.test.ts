import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RecommendationPayload } from "@/lib/scoring";
const { mockRecords, upsertMock, findManyMock } = vi.hoisted(() => {
  const records: Array<Record<string, unknown>> = [];

  const upsert = vi.fn(async ({ where, create, update }: any) => {
    const createInput = (create ?? update) ?? {};
    const sessionId = createInput.sessionId ?? where?.sessionId;
    const connectedUserId = createInput.user?.connect?.id ?? update?.user?.connect?.id;

    const record = {
      sessionId,
      playerTag: createInput.playerTag,
      trophyRange: createInput.trophyRange,
      arena: createInput.arena,
      playstyle: createInput.playstyle,
      rationale: createInput.rationale,
      scoreBreakdown: createInput.scoreBreakdown,
      decks: createInput.decks,
      userId: connectedUserId,
    };

    const existingIndex = records.findIndex((item) => item.sessionId === sessionId);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    return record;
  });

  const findMany = vi.fn(async ({ where }: any = {}) => {
    if (where?.userId) {
      return records.filter((item) => item.userId === where.userId);
    }

    return [...records];
  });

  return { mockRecords: records, upsertMock: upsert, findManyMock: findMany };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recommendation: {
      upsert: upsertMock,
      findMany: findManyMock,
    },
  },
}));

import { persistRecommendation } from "@/app/api/recommend/route";
import { prisma } from "@/lib/prisma";

describe("persistRecommendation", () => {
  beforeEach(() => {
    mockRecords.length = 0;
    upsertMock?.mockClear();
    findManyMock?.mockClear();
  });

  it("associates recommendations with the requesting user", async () => {
    const payload: RecommendationPayload = {
      player: {
        tag: "#PLAYER1",
        name: "Player One",
        trophies: 5200,
        arena: "Path of Legends",
        collection: [],
      },
      quiz: {
        preferredPace: "balanced",
        comfortLevel: "cycle",
        riskTolerance: "mid",
      },
      userId: "user-123",
    };

    const breakdown = [];
    const enrichedDecks = [];

    await persistRecommendation("session-123", payload, breakdown, enrichedDecks);

    expect(prisma).toBeDefined();
    if (!prisma) {
      throw new Error("Prisma client was not initialised by the mock");
    }

    const rows = await prisma.recommendation.findMany({ where: { userId: payload.userId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sessionId: "session-123", userId: payload.userId });
  });
});
