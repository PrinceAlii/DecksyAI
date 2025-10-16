"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlayerProfile, QuizResponse } from "@/lib/scoring";

interface BattleLogEntry {
  opponent: string;
  result: "win" | "loss" | "draw";
  deck: string[];
  timestamp: string;
}

const quizDefaults: QuizResponse = {
  preferredPace: "balanced",
  comfortLevel: "bridge",
  riskTolerance: "mid",
};

export function PlayerOnboarding() {
  const router = useRouter();
  const [playerTag, setPlayerTag] = useState("");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [battles, setBattles] = useState<BattleLogEntry[]>([]);
  const [quiz, setQuiz] = useState<QuizResponse>(quizDefaults);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setStep(2);
    }
  }, [player]);

  async function handleFetchPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const sanitizedTag = playerTag.replace("#", "").toUpperCase();

    if (sanitizedTag.length < 4) {
      setError("Enter a valid player tag.");
      return;
    }

    try {
      setLoading(true);
      const [playerRes, battleRes] = await Promise.all([
        fetch(`/api/player/${sanitizedTag}`),
        fetch(`/api/battles/${sanitizedTag}`),
      ]);

      if (!playerRes.ok) {
        throw new Error("Unable to fetch player profile");
      }

      const playerJson = (await playerRes.json()) as PlayerProfile;
      setPlayer(playerJson);

      if (battleRes.ok) {
        const battleJson = (await battleRes.json()) as BattleLogEntry[];
        setBattles(battleJson);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player,
          quiz,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }

      const json = (await response.json()) as { sessionId: string };
      setStep(3);
      router.push(`/recommend?sessionId=${json.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const recentBattleSummary = useMemo(() => {
    if (battles.length === 0) {
      return null;
    }

    const wins = battles.filter((battle) => battle.result === "win").length;
    const losses = battles.filter((battle) => battle.result === "loss").length;
    const draws = battles.length - wins - losses;
    return { wins, losses, draws };
  }, [battles]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-surface p-8">
        <CardContent className="space-y-6 p-0">
          <div>
            <h2 className="text-2xl font-semibold text-text">Start with your player tag</h2>
            <p className="mt-2 text-text-muted">
              Securely connect via the Clash Royale API. We fetch your cards and battle history to build a profile in seconds.
            </p>
          </div>
          <form className="space-y-4" aria-label="Player tag" onSubmit={handleFetchPlayer}>
            <label className="block text-sm font-medium text-text-muted" htmlFor="tag">
              Player Tag
            </label>
            <Input
              id="tag"
              name="tag"
              placeholder="#ABC123"
              value={playerTag}
              onChange={(event) => setPlayerTag(event.target.value)}
              autoComplete="off"
            />
            <Button type="submit" className="w-full justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Fetch my data
            </Button>
            {error && <p className="text-sm text-danger">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {player && step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/60 bg-surface p-8">
              <CardContent className="space-y-6 p-0">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-text">{player.name}</h3>
                    <p className="text-sm text-text-muted">
                      #{player.tag.replace("#", "")} • {player.trophies} trophies • {player.arena}
                    </p>
                  </div>
                  {recentBattleSummary ? (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Badge variant="secondary">{recentBattleSummary.wins}W</Badge>
                      <Badge variant="outline">{recentBattleSummary.losses}L</Badge>
                      <Badge variant="ghost">{recentBattleSummary.draws}D</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">Battle history unavailable</p>
                  )}
                </header>

                <form className="grid gap-6" onSubmit={handleRecommend}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Preferred pace</label>
                      <div className="grid gap-2">
                        {(["aggro", "balanced", "control"] as const).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={quiz.preferredPace === option ? "primary" : "outline"}
                            className="justify-between"
                            onClick={() => setQuiz((prev) => ({ ...prev, preferredPace: option }))}
                          >
                            <span className="capitalize">{option}</span>
                            {quiz.preferredPace === option && <Trophy className="size-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Comfort win condition</label>
                      <div className="grid gap-2">
                        {(["cycle", "bridge", "spell"] as const).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={quiz.comfortLevel === option ? "primary" : "outline"}
                            className="justify-between"
                            onClick={() => setQuiz((prev) => ({ ...prev, comfortLevel: option }))}
                          >
                            <span className="capitalize">{option}</span>
                            {quiz.comfortLevel === option && <Sparkles className="size-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Risk tolerance</label>
                      <div className="grid gap-2">
                        {(["safe", "mid", "greedy"] as const).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={quiz.riskTolerance === option ? "primary" : "outline"}
                            className="justify-between"
                            onClick={() => setQuiz((prev) => ({ ...prev, riskTolerance: option }))}
                          >
                            <span className="capitalize">{option}</span>
                            {quiz.riskTolerance === option && <Sparkles className="size-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Generate recommendations
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
