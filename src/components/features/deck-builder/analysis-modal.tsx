"use client";

import { CheckCircle2, AlertTriangle, Lightbulb, TrendingUp, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AnalysisData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  synergies: Array<{
    cards: string[];
    description: string;
  }>;
  suggestions: string[];
  rating: {
    overall: number;
    offense: number;
    defense: number;
    versatility: number;
  };
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisData | null;
  isLoading?: boolean;
  onSaveAnalysis?: () => void;
  canSave?: boolean;
}

function RatingBar({ label, value, maxValue = 10 }: { label: string; value: number; maxValue?: number }) {
  const percentage = (value / maxValue) * 100;
  
  // Color based on rating
  const getColor = (val: number) => {
    if (val >= 8) return "from-green-500 to-emerald-600";
    if (val >= 6) return "from-blue-500 to-cyan-600";
    if (val >= 4) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="text-text-muted">
          {value}/{maxValue}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500",
            getColor(value)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function AnalysisModal({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onSaveAnalysis,
  canSave = false,
}: AnalysisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <Card className="border-border/60 bg-surface shadow-2xl">
          <CardContent className="p-0">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-surface/95 backdrop-blur p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <TrendingUp className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">Deck Analysis</h2>
                  <p className="text-sm text-text-muted">AI-powered insights for your deck</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="size-8 rounded-full p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-6 p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-text">Analyzing your deck...</p>
                    <p className="text-sm text-text-muted">This may take a few seconds</p>
                  </div>
                </div>
              ) : analysis ? (
                <>
                  {/* Summary */}
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-text">Summary</h3>
                    <p className="text-sm leading-relaxed text-text-muted whitespace-pre-line">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Strengths */}
                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-green-500" />
                        <h3 className="text-base font-semibold text-text">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-500" />
                            <span className="text-sm text-text-muted">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="size-5 text-orange-500" />
                        <h3 className="text-base font-semibold text-text">Weaknesses</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                            <span className="text-sm text-text-muted">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Synergies */}
                  {analysis.synergies && analysis.synergies.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex size-5 items-center justify-center rounded bg-blue-500/20">
                          <span className="text-xs text-blue-500">🔗</span>
                        </div>
                        <h3 className="text-base font-semibold text-text">Card Synergies</h3>
                      </div>
                      <div className="space-y-3">
                        {analysis.synergies.map((synergy, index) => (
                          <div key={index} className="rounded-lg border border-border/40 bg-background/50 p-3">
                            <div className="mb-1.5 flex flex-wrap gap-1.5">
                              {synergy.cards.map((card, cardIndex) => (
                                <Badge key={cardIndex} variant="secondary" className="text-xs">
                                  {card}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-text-muted">{synergy.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Lightbulb className="size-5 text-accent" />
                        <h3 className="text-base font-semibold text-text">Suggestions</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="text-sm text-text-muted">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ratings */}
                  <div>
                    <h3 className="mb-4 text-base font-semibold text-text">Performance Ratings</h3>
                    <div className="space-y-4">
                      <RatingBar label="Overall" value={analysis.rating.overall} />
                      <RatingBar label="Offensive Power" value={analysis.rating.offense} />
                      <RatingBar label="Defensive Strength" value={analysis.rating.defense} />
                      <RatingBar label="Versatility" value={analysis.rating.versatility} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <AlertTriangle className="size-12 text-orange-500" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-text">No analysis available</p>
                    <p className="text-sm text-text-muted">
                      Something went wrong. Please try analyzing again.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isLoading && analysis && (
              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border/60 bg-surface/95 backdrop-blur p-6">
                {!canSave && (
                  <p className="text-xs text-text-muted text-center">
                    💡 Sign in and save your deck to persist this analysis
                  </p>
                )}
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  {canSave && onSaveAnalysis && (
                    <Button variant="primary" onClick={onSaveAnalysis}>
                      Save Analysis
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
