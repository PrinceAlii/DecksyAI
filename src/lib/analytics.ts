export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

const analyticsBuffer: AnalyticsEvent[] = [];

export function trackAnalytics(event: AnalyticsEvent): void {
  analyticsBuffer.push(event);

  if (process.env.NODE_ENV !== "test") {
    const props = event.properties ? JSON.stringify(event.properties) : "{}";
    console.info(`[Analytics] ${event.name}: ${props}`);
  }
}

export function getAnalyticsBuffer(): AnalyticsEvent[] {
  return [...analyticsBuffer];
}

export function resetAnalyticsBuffer(): void {
  analyticsBuffer.length = 0;
}
