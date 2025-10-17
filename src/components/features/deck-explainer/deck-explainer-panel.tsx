"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GeminiExplainer, GeminiExplainerStreamEvent } from "@/lib/gemini";
import { cn } from "@/lib/utils";

interface DeckExplainerPanelProps {
  deckSlug: string;
  sessionId?: string;
  initialExplainer?: GeminiExplainer | null;
  practicePlanEnabled: boolean;
}

type ExplainerStatus = "idle" | "loading" | "streaming" | "complete" | "error";

interface ExplainerState {
  summary: string;
  substitutions: GeminiExplainer["substitutions"];
  matchupTips: GeminiExplainer["matchupTips"];
  practicePlan?: GeminiExplainer["practicePlan"];
  status: ExplainerStatus;
  error?: string;
  model?: string;
  isCached?: boolean;
}

function extractSummaryFromRaw(rawText: string): string | undefined {
  const summaryIndex = rawText.indexOf("\"summary\"");
  if (summaryIndex === -1) return undefined;

  const colonIndex = rawText.indexOf(":", summaryIndex);
  if (colonIndex === -1) return undefined;

  const firstQuote = rawText.indexOf("\"", colonIndex + 1);
  if (firstQuote === -1) return undefined;

  let buffer = "";
  let escaped = false;
  for (let i = firstQuote + 1; i < rawText.length; i += 1) {
    const char = rawText[i];
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      return buffer;
    }

    buffer += char;
  }

  return buffer.length > 0 ? buffer : undefined;
}

export function DeckExplainerPanel({
  deckSlug,
  sessionId,
  initialExplainer,
  practicePlanEnabled,
}: DeckExplainerPanelProps) {
  const [state, setState] = useState<ExplainerState>(() => ({
    summary: initialExplainer?.summary ?? "",
    substitutions: initialExplainer?.substitutions ?? [],
    matchupTips: initialExplainer?.matchupTips ?? [],
    practicePlan: initialExplainer?.practicePlan,
    status: initialExplainer ? "complete" : "idle",
    isCached: Boolean(initialExplainer),
  }));
  const abortController = useRef<AbortController | null>(null);

  const shouldStream = Boolean(sessionId);

  useEffect(() => {
    setState({
      summary: initialExplainer?.summary ?? "",
      substitutions: initialExplainer?.substitutions ?? [],
      matchupTips: initialExplainer?.matchupTips ?? [],
      practicePlan: initialExplainer?.practicePlan,
      status: initialExplainer ? "complete" : "idle",
      error: undefined,
      model: undefined,
      isCached: Boolean(initialExplainer),
    });
  }, [deckSlug, initialExplainer]);

  useEffect(() => {
    if (!shouldStream) {
      return () => {
        abortController.current?.abort();
      };
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setState((previous) => ({
      ...previous,
      status: previous.status === "complete" ? "complete" : "loading",
      error: undefined,
      isCached: false,
    }));

    async function runStream() {
      try {
        const response = await fetch(`/api/coach?deck=${encodeURIComponent(deckSlug)}&sessionId=${encodeURIComponent(sessionId!)}&stream=1`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            let event: GeminiExplainerStreamEvent | { type: "error"; error: string; fallback?: GeminiExplainer };
            try {
              event = JSON.parse(trimmed) as GeminiExplainerStreamEvent;
            } catch (error) {
              console.warn("Failed to parse stream chunk", error, trimmed);
              continue;
            }

            setState((previous) => {
              switch (event.type) {
                case "cached":
                  return {
                    summary: event.payload.summary,
                    substitutions: event.payload.substitutions,
                    matchupTips: event.payload.matchupTips,
                    practicePlan: event.payload.practicePlan,
                    status: "complete",
                    model: event.model,
                    isCached: true,
                  };
                case "start":
                  return { ...previous, status: "streaming", model: event.model };
                case "delta": {
                  const summary = extractSummaryFromRaw(event.rawText) ?? previous.summary;
                  return { ...previous, status: "streaming", summary };
                }
                case "update":
                  return {
                    summary: event.payload.summary,
                    substitutions: event.payload.substitutions,
                    matchupTips: event.payload.matchupTips,
                    practicePlan: event.payload.practicePlan,
                    status: "streaming",
                    model: event.model,
                    isCached: false,
                  };
                case "complete":
                  return {
                    summary: event.payload.summary,
                    substitutions: event.payload.substitutions,
                    matchupTips: event.payload.matchupTips,
                    practicePlan: event.payload.practicePlan,
                    status: "complete",
                    model: event.model,
                    isCached: false,
                  };
                case "error":
                  return {
                    summary: event.fallback.summary,
                    substitutions: event.fallback.substitutions,
                    matchupTips: event.fallback.matchupTips,
                    practicePlan: event.fallback.practicePlan,
                    status: "error",
                    error: event.error,
                    model: previous.model,
                    isCached: false,
                  };
                default:
                  return previous;
              }
            });
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState((previous) => ({
          ...previous,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    }

    void runStream();

    return () => {
      controller.abort();
    };
  }, [deckSlug, sessionId, shouldStream]);

  const hasData = useMemo(() => {
    return state.summary.length > 0 || state.substitutions.length > 0 || state.matchupTips.length > 0;
  }, [state.matchupTips.length, state.substitutions.length, state.summary.length]);

  const showPracticePlan = practicePlanEnabled && (state.practicePlan?.length ?? 0) > 0;

  return (
    <Card className="border-border/60 bg-surface">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-text">Gemini coach notes</h2>
          <div className="flex items-center gap-2">
            {state.model && (
              <Badge variant="outline" className="text-xs uppercase tracking-wide text-text-muted">
                {state.isCached ? "Cached" : state.model}
              </Badge>
            )}
            {state.status === "streaming" && <Sparkles className="size-4 animate-pulse text-accent" />}
          </div>
        </div>

        {state.error && (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-text">Overview</h3>
            {hasData ? (
              <p
                className={cn("mt-2 whitespace-pre-line text-sm text-text-muted", {
                  "animate-pulse": state.status === "streaming" && !state.isCached,
                })}
              >
                {state.summary || "Gemini is preparing notes..."}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-border/60" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-border/40" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-border/30" />
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-text">Substitutions</h3>
              {state.substitutions.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm text-text-muted">
                  {state.substitutions.map((substitution) => (
                    <li key={`${substitution.card}-${substitution.suggestion}`}>{substitution.card}: {substitution.suggestion}</li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-2 space-y-2 text-sm text-text-muted">
                  <li className="animate-pulse rounded bg-border/40 px-3 py-2" />
                  <li className="animate-pulse rounded bg-border/30 px-3 py-2" />
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-text">Matchups</h3>
              {state.matchupTips.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm text-text-muted">
                  {state.matchupTips.map((tip) => (
                    <li key={`${tip.archetype}-${tip.tip}`}>{tip.tip}</li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-2 space-y-2 text-sm text-text-muted">
                  <li className="animate-pulse rounded bg-border/40 px-3 py-2" />
                  <li className="animate-pulse rounded bg-border/30 px-3 py-2" />
                </ul>
              )}
            </div>
          </div>

          {showPracticePlan && state.practicePlan && (
            <div className="rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-text-muted">
                <Sparkles className="size-4 text-accent" /> Practice plan
              </div>
              <ol className="mt-3 space-y-3 text-sm text-text-muted">
                {state.practicePlan.map((drill) => (
                  <li key={`${drill.focus}-${drill.drill}`} className="rounded-md border border-border/40 bg-surface/80 p-3">
                    <div className="font-semibold text-text">{drill.focus}</div>
                    <div className="mt-1 text-sm">{drill.drill}</div>
                    {drill.reps && <div className="mt-1 text-xs uppercase tracking-wide text-text-muted">{drill.reps}</div>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
