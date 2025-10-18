import { NextRequest } from "next/server";

const { mockFindUnique, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    recommendation: { findUnique: mockFindUnique },
    explainer: { findMany: mockFindMany },
  } as const;

  return { prisma: mockPrisma as unknown };
});

import { GET } from "../route";

describe("GET /api/coach", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFindMany.mockReset();
    mockFindMany.mockResolvedValue([]);
  });

  it("returns 404 without leaking explainers when the recommendation is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    const request = new NextRequest(
      "http://test.local/api/coach?deck=mega-knight-miner-control&sessionId=missing",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Recommendation not found" });
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { sessionId: "missing" } });
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
