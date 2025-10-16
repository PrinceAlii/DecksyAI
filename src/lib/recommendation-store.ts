interface StoredRecommendation {
  sessionId: string;
  player: unknown;
  quiz: unknown;
  scoreBreakdown: unknown;
  decks: unknown;
}

const store = new Map<string, StoredRecommendation>();

export function saveRecommendation(record: StoredRecommendation) {
  store.set(record.sessionId, record);
}

export function getRecommendation(sessionId: string): StoredRecommendation | undefined {
  return store.get(sessionId);
}

export function listRecommendations(): StoredRecommendation[] {
  return Array.from(store.values()).sort((a, b) => (a.sessionId > b.sessionId ? -1 : 1));
}
